// src/hooks/useEnvelopeBudgeting.js
import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for YNAB-style envelope budgeting system
 * 
 * This hook provides functionality for:
 * 1. Managing category balances (envelopes)
 * 2. Allocating money to categories
 * 3. Moving money between categories
 * 4. Handling overspending in categories
 * 5. Integrating with planning items (expenses/goals)
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Envelope budgeting state and functions
 */
export const useEnvelopeBudgeting = ({
  categories = [],
  setCategories,
  planningItems = [],
  transactions = [],
  accounts = []
} = {}) => {
  // State for tracking category funding history
  const [categoryFundingHistory, setCategoryFundingHistory] = useLocalStorage('budgetCalc_categoryFundingHistory', []);

  // State for tracking money movements between categories
  const [categoryTransfers, setCategoryTransfers] = useLocalStorage('budgetCalc_categoryTransfers', []);

  // Monthly budget settings - to store the amount allocated per month to each category
  const [monthlyBudget, setMonthlyBudget] = useLocalStorage('budgetCalc_monthlyBudget', {});

  /**
   * Calculate the total amount available to be allocated
   * Available to allocate = Sum of account balances - Sum of category available balances
   */
  const calculateToBeAllocated = useCallback(() => {
    // Total money in all accounts
    const totalAccountBalance = validateAmount(accounts.reduce((total, account) => {
      return total + validateAmount(account.balance || 0);
    }, 0));

    // Total money already in category envelopes
    const totalInEnvelopes = validateAmount(categories.reduce((total, category) => {
      return total + validateAmount(category.available || 0);
    }, 0));

    // Money available to allocate = Account balances - Already in envelopes
    return validateAmount(totalAccountBalance - totalInEnvelopes);
  }, [accounts, categories]);

  /**
   * Calculate needed funding for each category based on active planning items
   * This helps users see how much they should allocate to each category
   */
  const calculateNeededFunding = useCallback(() => {
    const needed = {};

    // Only consider active planning items
    const activeItems = planningItems.filter(item =>
      item.isActive || (!item.allocationPaused && item.priorityState === 'active')
    );

    // Group by category and sum amounts
    activeItems.forEach(item => {
      if (!item.categoryId) return;

      if (!needed[item.categoryId]) {
        needed[item.categoryId] = 0;
      }

      // For expenses, use the amount; for goals, use the monthly contribution
      const amount = item.type === 'savings-goal'
        ? (item.monthlyContribution || 0)
        : (item.amount || 0);

      needed[item.categoryId] += amount;
    });

    return needed;
  }, [planningItems]);

  /**
   * Calculate the available balance for each category
   * Available = Allocated - Spent
   */
  const calculateCategoryBalances = useCallback(() => {
    // Create a map of category ID to spent amount from transactions
    const categorySpending = {};

    transactions.forEach(transaction => {
      if (transaction.categoryId && transaction.amount < 0) {
        if (!categorySpending[transaction.categoryId]) {
          categorySpending[transaction.categoryId] = 0;
        }
        const validatedAmount = validateAmount(Math.abs(transaction.amount));
        if (validatedAmount > 0) {
          categorySpending[transaction.categoryId] = validateAmount(
            categorySpending[transaction.categoryId] + validatedAmount
          );
        }
      }
    });

    // Update category available balances
    setCategories(currentCategories =>
      currentCategories.map(category => {
        const spent = validateAmount(categorySpending[category.id] || 0);
        const allocated = validateAmount(category.allocated || 0);
        const available = validateAmount(allocated - spent);

        return {
          ...category,
          spent,
          available
        };
      })
    );
  }, [transactions, setCategories]);

  /**
   * Fund a category with a specific amount
   * This increases the category's allocated and available amounts
   */
  // Helper function to validate amounts
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    // Cap at reasonable maximum (e.g., $100,000) and minimum (-$100,000)
    return Math.min(Math.max(amount, -100000), 100000);
  };

  const fundCategory = useCallback((categoryId, amount, paycheckId = null, date = new Date()) => {
    // Validate inputs
    if (!categoryId || amount === 0) return false;

    // Validate and cap the amount
    const validatedAmount = validateAmount(amount);
    if (validatedAmount === 0) return false;

    // Check if we're removing money (negative amount)
    const isRemoving = validatedAmount < 0;

    // If removing, ensure category has enough available funds
    if (isRemoving) {
      const category = categories.find(c => c.id === categoryId);
      if (!category || Math.abs(validatedAmount) > validateAmount(category.available || 0)) {
        return false; // Can't remove more than available
      }
    }

    // Only allow allocation if:
    // 1. It's removing funds (negative amount)
    // 2. It's part of paycheck workflow (has paycheckId)
    // 3. It's a manual allocation AND no items need allocation
    if (!isRemoving && !paycheckId) {
      // Check if any items in this category need allocation
      const categoryItems = planningItems.filter(item => item.categoryId === categoryId);
      const hasItemsNeedingAllocation = categoryItems.some(item => item.needsAllocation);

      if (hasItemsNeedingAllocation) {
        console.log('Skipping automatic allocation - items need manual allocation');
        return false;
      }
    }

    // Update category
    setCategories(currentCategories =>
      currentCategories.map(category => {
        if (category.id === categoryId) {
          const currentAllocated = validateAmount(category.allocated || 0);
          const currentAvailable = validateAmount(category.available || 0);
          return {
            ...category,
            allocated: validateAmount(currentAllocated + validatedAmount),
            available: validateAmount(currentAvailable + validatedAmount),
            lastFunded: date.toISOString()
          };
        }
        return category;
      })
    );

    // Add to funding history
    setCategoryFundingHistory(prevHistory => [
      ...prevHistory,
      {
        id: Math.max(0, ...prevHistory.map(h => h.id)) + 1,
        categoryId,
        amount: validatedAmount,
        paycheckId,
        date: date.toISOString(),
        note: paycheckId ? 'Funded from paycheck' : 'Manual funding'
      }
    ]);

    // Update item allocation if this is part of paycheck workflow
    if (paycheckId && validatedAmount > 0) {
      const categoryItems = planningItems.filter(item =>
        item.categoryId === categoryId &&
        item.needsAllocation
      );

      if (categoryItems.length > 0) {
        // Distribute the amount among items needing allocation
        const amountPerItem = validatedAmount / categoryItems.length;
        categoryItems.forEach(item => {
          item.needsAllocation = false;
          item.allocated = (item.allocated || 0) + amountPerItem;
        });
      }
    }

    return true;
  }, [setCategories, setCategoryFundingHistory, planningItems]);

  /**
   * Move money from one category to another
   */
  const moveMoney = useCallback((fromCategoryId, toCategoryId, amount, note = '') => {
    // Validate inputs
    if (!fromCategoryId || !toCategoryId) return false;

    const validatedAmount = validateAmount(amount);
    if (validatedAmount <= 0) return false;

    if (fromCategoryId === toCategoryId) return false;

    // Find categories
    const fromCategory = categories.find(c => c.id === fromCategoryId);
    const toCategory = categories.find(c => c.id === toCategoryId);

    if (!fromCategory || !toCategory) return false;

    // Check if from category has enough available
    const fromAvailable = validateAmount(fromCategory.available || 0);
    if (fromAvailable < validatedAmount) return false;

    // Update categories
    setCategories(currentCategories =>
      currentCategories.map(category => {
        if (category.id === fromCategoryId) {
          const currentAvailable = validateAmount(category.available || 0);
          return {
            ...category,
            available: validateAmount(currentAvailable - validatedAmount)
          };
        }
        if (category.id === toCategoryId) {
          const currentAllocated = validateAmount(category.allocated || 0);
          const currentAvailable = validateAmount(category.available || 0);
          return {
            ...category,
            allocated: validateAmount(currentAllocated + validatedAmount),
            available: validateAmount(currentAvailable + validatedAmount)
          };
        }
        return category;
      })
    );

    // Record the transfer
    setCategoryTransfers(prevTransfers => [
      ...prevTransfers,
      {
        id: Math.max(0, ...prevTransfers.map(t => t.id)) + 1,
        fromCategoryId,
        toCategoryId,
        amount,
        date: new Date().toISOString(),
        note
      }
    ]);

    return true;
  }, [categories, setCategories, setCategoryTransfers]);

  /**
   * Set a category's monthly budget amount
   * This is used for planning and auto-funding
   */
  const setMonthlyBudgetForCategory = useCallback((categoryId, amount) => {
    setMonthlyBudget(prev => ({
      ...prev,
      [categoryId]: amount
    }));
  }, [setMonthlyBudget]);

  /**
   * Fund all categories according to their monthly budget
   * Used for auto-funding during payday
   */
  const autoFundCategories = useCallback((totalAmount, paycheckId = null) => {
    // Validate total amount
    const validatedTotal = validateAmount(totalAmount);
    if (validatedTotal <= 0) return { totalFunded: 0, fundingResults: [], remainingToAllocate: 0 };

    // Get items that need allocation
    const itemsNeedingAllocation = planningItems.filter(item =>
      item.isActive && item.needsAllocation && item.categoryId
    );

    // Group by category and sum amounts
    const categoryAmounts = {};
    itemsNeedingAllocation.forEach(item => {
      const categoryId = parseInt(item.categoryId, 10);
      if (!categoryAmounts[categoryId]) {
        categoryAmounts[categoryId] = 0;
      }
      const amount = item.type === 'savings-goal' ?
        (item.monthlyContribution || 0) :
        (item.amount || 0);
      categoryAmounts[categoryId] += validateAmount(amount);
    });

    // Convert to array and validate amounts
    const categoriesToFund = Object.entries(categoryAmounts)
      .map(([categoryId, amount]) => ({
        categoryId: parseInt(categoryId, 10),
        amount: validateAmount(amount),
        items: itemsNeedingAllocation.filter(item => item.categoryId === parseInt(categoryId, 10))
      }))
      .filter(({ amount }) => amount > 0);

    // Calculate total needed
    const totalNeeded = validateAmount(
      categoriesToFund.reduce((sum, item) => sum + item.amount, 0)
    );

    // If not enough to fund everything, scale proportionally
    const scaleFactor = validatedTotal < totalNeeded ? validatedTotal / totalNeeded : 1;

    // Fund each category
    let totalFunded = 0;
    const fundingResults = [];

    categoriesToFund.forEach(({ categoryId, amount, items }) => {
      const scaledAmount = validateAmount(Math.min(amount * scaleFactor, amount));
      if (scaledAmount > 0) {
        const success = fundCategory(categoryId, scaledAmount, paycheckId);
        if (success) {
          totalFunded = validateAmount(totalFunded + scaledAmount);
          fundingResults.push({
            categoryId,
            amount: scaledAmount,
            success
          });

          // Clear needsAllocation flag for funded items
          items.forEach(item => {
            item.needsAllocation = false;
            item.allocated = (item.allocated || 0) + (
              item.type === 'savings-goal' ?
                item.monthlyContribution :
                item.amount
            );
          });
        }
      }
    });

    return {
      totalFunded,
      fundingResults,
      remainingToAllocate: validateAmount(validatedTotal - totalFunded)
    };
  }, [monthlyBudget, fundCategory, planningItems]);

  /**
   * Get funding suggestions based on active planning items
   */
  const getFundingSuggestions = useCallback(() => {
    const needed = calculateNeededFunding();
    const suggestions = [];

    categories.forEach(category => {
      const neededAmount = needed[category.id] || 0;
      const currentAvailable = category.available || 0;

      if (neededAmount > 0) {
        suggestions.push({
          categoryId: category.id,
          categoryName: category.name,
          currentAvailable,
          neededAmount,
          suggestedFunding: Math.max(0, neededAmount - currentAvailable)
        });
      }
    });

    return suggestions.sort((a, b) => b.suggestedFunding - a.suggestedFunding);
  }, [categories, calculateNeededFunding]);

  /**
   * Handle a transaction's impact on category available balance
   * This is called when a transaction is added or updated
   */
  const handleTransactionForCategory = useCallback((transaction, oldTransaction = null) => {
    // Only handle transactions with categories
    if (!transaction.categoryId) return;

    // Validate transaction amount
    const validatedAmount = validateAmount(transaction.amount);
    if (validatedAmount === 0) return;

    // Reverse the old transaction's effect if updating
    if (oldTransaction && oldTransaction.categoryId) {
      const validatedOldAmount = validateAmount(oldTransaction.amount);
      if (validatedOldAmount < 0) {
        setCategories(currentCategories =>
          currentCategories.map(category => {
            if (category.id === oldTransaction.categoryId) {
              const currentAvailable = validateAmount(category.available || 0);
              return {
                ...category,
                available: validateAmount(currentAvailable + Math.abs(validatedOldAmount))
              };
            }
            return category;
          })
        );
      }
    }

    // Apply the new transaction's effect
    if (validatedAmount < 0) {
      // Expense - reduce the available amount
      setCategories(currentCategories =>
        currentCategories.map(category => {
          if (category.id === transaction.categoryId) {
            const currentAvailable = validateAmount(category.available || 0);
            const newAvailable = validateAmount(currentAvailable - Math.abs(validatedAmount));

            return {
              ...category,
              available: newAvailable,
              overspent: newAvailable < 0
            };
          }
          return category;
        })
      );
    } else if (validatedAmount > 0 && transaction.isInflow) {
      // Income directly to category - increase available amount
      setCategories(currentCategories =>
        currentCategories.map(category => {
          if (category.id === transaction.categoryId) {
            const currentAllocated = validateAmount(category.allocated || 0);
            const currentAvailable = validateAmount(category.available || 0);
            return {
              ...category,
              allocated: validateAmount(currentAllocated + validatedAmount),
              available: validateAmount(currentAvailable + validatedAmount)
            };
          }
          return category;
        })
      );
    }
  }, [setCategories]);

  /**
   * Create a report of category spending and funding
   */
  const getCategoryReport = useCallback((categoryId, startDate, endDate) => {
    // Filter transactions for this category and date range
    const categoryTransactions = transactions.filter(t =>
      t.categoryId === categoryId &&
      new Date(t.date) >= new Date(startDate) &&
      new Date(t.date) <= new Date(endDate)
    );

    // Filter funding history for this category and date range
    const categoryFunding = categoryFundingHistory.filter(f =>
      f.categoryId === categoryId &&
      new Date(f.date) >= new Date(startDate) &&
      new Date(f.date) <= new Date(endDate)
    );

    // Calculate totals with validation
    const totalSpent = validateAmount(categoryTransactions.reduce(
      (sum, t) => t.amount < 0 ? validateAmount(sum + Math.abs(validateAmount(t.amount))) : sum,
      0
    ));

    const totalFunded = validateAmount(categoryFunding.reduce(
      (sum, f) => validateAmount(sum + validateAmount(f.amount)),
      0
    ));

    return {
      categoryId,
      startDate,
      endDate,
      transactions: categoryTransactions,
      funding: categoryFunding,
      totalSpent,
      totalFunded,
      netChange: validateAmount(totalFunded - totalSpent)
    };
  }, [transactions, categoryFundingHistory]);

  // Calculate category balances when transactions change
  useEffect(() => {
    calculateCategoryBalances();
  }, [transactions, calculateCategoryBalances]);

  /**
   * Unified function to transfer funds between categories or between a category and the "to be allocated" pool
   * This combines the functionality of fundCategory and moveMoney into a single operation
   * 
   * @param {string|number} source - Source of funds: either a category ID or 'toBeAllocated'
   * @param {string|number} destination - Destination for funds: either a category ID or 'toBeAllocated'
   * @param {number} amount - Amount to transfer (always positive)
   * @param {string} note - Optional note about the transfer
   * @param {number} paycheckId - Optional ID of associated paycheck
   * @returns {boolean} - Whether the transfer was successful
   */
  const transferFunds = useCallback((source, destination, amount, note = '', paycheckId = null) => {
    // Validate inputs
    if (!source || !destination || amount <= 0) return false;
    if (source === destination) return false;

    const date = new Date();

    // Case 1: Moving from toBeAllocated to a category (Assign funds to category)
    if (source === 'toBeAllocated' && typeof destination === 'number') {
      return fundCategory(destination, amount, paycheckId, date);
    }

    // Case 2: Moving from a category to toBeAllocated (Remove funds from category)
    if (typeof source === 'number' && destination === 'toBeAllocated') {
      return fundCategory(source, -amount, paycheckId, date);
    }

    // Case 3: Moving between categories (Move money)
    if (typeof source === 'number' && typeof destination === 'number') {
      return moveMoney(source, destination, amount, note);
    }

    return false;
  }, [fundCategory, moveMoney]);

  return {
    // Core envelope budgeting functions
    calculateToBeAllocated,
    calculateNeededFunding,
    fundCategory,
    moveMoney,
    transferFunds,
    handleTransactionForCategory,

    // Monthly budgeting
    monthlyBudget,
    setMonthlyBudgetForCategory,
    autoFundCategories,

    // History and reporting
    categoryFundingHistory,
    categoryTransfers,
    getFundingSuggestions,
    getCategoryReport
  };
};