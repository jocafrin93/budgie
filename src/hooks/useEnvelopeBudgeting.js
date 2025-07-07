// src/hooks/useEnvelopeBudgeting.js
import { useCallback } from 'react';
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

  // Helper function to validate amounts
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    // Cap at reasonable maximum (e.g., $100,000) and minimum (-$100,000)
    return Math.min(Math.max(amount, -100000), 100000);
  };

  /**
   * Calculate the available balance for each category
   * Available = Allocated - Spent
   */
  // const calculateCategoryBalances = useCallback(() => {
  //   // Create a map of category ID to spent amount from transactions
  //   const categorySpending = {};

  //   transactions.forEach(transaction => {
  //     if (transaction.categoryId && transaction.amount < 0) {
  //       if (!categorySpending[transaction.categoryId]) {
  //         categorySpending[transaction.categoryId] = 0;
  //       }
  //       const validatedAmount = validateAmount(Math.abs(transaction.amount));
  //       if (validatedAmount > 0) {
  //         categorySpending[transaction.categoryId] = validateAmount(
  //           categorySpending[transaction.categoryId] + validatedAmount
  //         );
  //       }
  //     }
  //   });

  //   // Update category available balances
  //   setCategories(currentCategories =>
  //     currentCategories.map(category => {
  //       const spent = validateAmount(categorySpending[category.id] || 0);
  //       const allocated = validateAmount(category.allocated || 0);
  //       const available = validateAmount(allocated - spent);

  //       return {
  //         ...category,
  //         spent,
  //         available
  //       };
  //     })
  //   );
  // }, [transactions, setCategories]);

  /**
   * Create category update for funding
   * Returns the update object instead of directly modifying categories
   */
  const createFundingUpdate = useCallback((categoryId, amount, paycheckId = null, date = new Date()) => {
    // Validate inputs
    if (!categoryId || amount === 0) return null;

    // Validate and cap the amount
    const validatedAmount = validateAmount(amount);
    if (validatedAmount === 0) return null;

    // Check if we're removing money (negative amount)
    const isRemoving = validatedAmount < 0;

    // If removing, ensure category has enough available funds
    if (isRemoving) {
      const category = categories.find(c => c.id === categoryId);
      if (!category || Math.abs(validatedAmount) > validateAmount(category.available || 0)) {
        return null; // Can't remove more than available
      }
    }

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

    // Return the category update object
    return {
      categoryId,
      update: (category) => {
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
      }
    };
  }, [categories, setCategoryFundingHistory]);

  /**
   * Create category updates for moving money between categories
   * Returns update objects instead of directly modifying categories
   */
  const createMoveMoneyUpdates = useCallback((fromCategoryId, toCategoryId, amount, note = '') => {
    // Validate inputs
    if (!fromCategoryId || !toCategoryId) return null;

    const validatedAmount = validateAmount(amount);
    if (validatedAmount <= 0) return null;

    if (fromCategoryId === toCategoryId) return null;

    // Find categories
    const fromCategory = categories.find(c => c.id === fromCategoryId);
    const toCategory = categories.find(c => c.id === toCategoryId);

    if (!fromCategory || !toCategory) return null;

    // Check if from category has enough available
    const fromAvailable = validateAmount(fromCategory.available || 0);
    if (fromAvailable < validatedAmount) return null;

    // Record the transfer
    setCategoryTransfers(prevTransfers => [
      ...prevTransfers,
      {
        id: Math.max(0, ...prevTransfers.map(t => t.id)) + 1,
        fromCategoryId,
        toCategoryId,
        amount: validatedAmount,
        date: new Date().toISOString(),
        note
      }
    ]);

    // Return update functions for both categories
    return {
      updates: [
        {
          categoryId: fromCategoryId,
          update: (category) => {
            if (category.id === fromCategoryId) {
              const currentAvailable = validateAmount(category.available || 0);
              return {
                ...category,
                available: validateAmount(currentAvailable - validatedAmount)
              };
            }
            return category;
          }
        },
        {
          categoryId: toCategoryId,
          update: (category) => {
            if (category.id === toCategoryId) {
              const currentAvailable = validateAmount(category.available || 0);
              return {
                ...category,
                available: validateAmount(currentAvailable + validatedAmount)
              };
            }
            return category;
          }
        }
      ]
    };
  }, [categories, setCategoryTransfers]);

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
   * Create transaction impact updates for categories
   * Returns update objects instead of directly modifying categories
   */
  const createTransactionUpdates = useCallback((transaction, oldTransaction = null) => {
    // Only handle transactions with categories
    if (!transaction.categoryId) return null;

    // Validate transaction amount
    const validatedAmount = validateAmount(transaction.amount);
    if (validatedAmount === 0) return null;

    const updates = [];

    // Reverse the old transaction's effect if updating
    if (oldTransaction && oldTransaction.categoryId) {
      const validatedOldAmount = validateAmount(oldTransaction.amount);
      if (validatedOldAmount < 0) {
        updates.push({
          categoryId: oldTransaction.categoryId,
          update: (category) => {
            if (category.id === oldTransaction.categoryId) {
              const currentAvailable = validateAmount(category.available || 0);
              return {
                ...category,
                available: validateAmount(currentAvailable + Math.abs(validatedOldAmount))
              };
            }
            return category;
          }
        });
      }
    }

    // Apply the new transaction's effect
    if (validatedAmount < 0) {
      // Expense - reduce the available amount
      updates.push({
        categoryId: transaction.categoryId,
        update: (category) => {
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
        }
      });
    } else if (validatedAmount > 0 && transaction.isInflow) {
      // Income directly to category - increase available amount
      updates.push({
        categoryId: transaction.categoryId,
        update: (category) => {
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
        }
      });
    }

    return updates.length > 0 ? { updates } : null;
  }, []);

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

  // Note: calculateCategoryBalances is available but not automatically called
  // to avoid infinite loops. Call it manually when needed.

  return {
    // Core envelope budgeting functions
    calculateToBeAllocated,
    calculateNeededFunding,
    createFundingUpdate,
    createMoveMoneyUpdates,
    createTransactionUpdates,

    // Monthly budgeting
    monthlyBudget,
    setMonthlyBudgetForCategory,

    // History and reporting
    categoryFundingHistory,
    categoryTransfers,
    getFundingSuggestions,
    getCategoryReport
  };
};
