// src/hooks/useEnvelopeBudgeting.js
import { useCallback } from 'react';
import { useStorage } from './useStorage';

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
  // State for tracking category funding history - now using cloud storage
  const [categoryFundingHistory, setCategoryFundingHistory] = useStorage('budgetCalc_categoryFundingHistory', []);

  // State for tracking money movements between categories - now using cloud storage
  const [categoryTransfers, setCategoryTransfers] = useStorage('budgetCalc_categoryTransfers', []);

  // Monthly budget settings - to store the amount allocated per month to each category - now using cloud storage
  const [monthlyBudget, setMonthlyBudget] = useStorage('budgetCalc_monthlyBudget', {});

  // State for tracking pending account transfers (NEW - for cross-account allocation) - now using cloud storage
  const [pendingTransfers, setPendingTransfers] = useStorage('budgetCalc_pendingTransfers', []);

  /**
   * Calculate the total amount available to be allocated (legacy - global)
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
   * Calculate available to allocate per account (NEW - account-based allocation)
   * This is the proper way to handle envelope budgeting with multiple accounts
   */
  const calculateAccountBasedToBeAllocated = useCallback((activeBudgetAllocations = []) => {
    const accountAllocations = {};

    // Initialize with account balances
    accounts.forEach(account => {
      accountAllocations[account.id] = {
        accountId: account.id,
        accountName: account.name,
        accountBalance: validateAmount(account.balance || 0),
        totalAllocated: 0,
        availableToAllocate: 0,
        categories: []
      };
    });

    // Calculate allocated amounts per account based on active budget allocations
    activeBudgetAllocations.forEach(allocation => {
      const accountId = allocation.sourceAccountId;
      if (accountAllocations[accountId]) {
        const category = categories.find(c => c.id === allocation.categoryId);
        if (category) {
          const allocatedAmount = validateAmount(category.available || 0);
          accountAllocations[accountId].totalAllocated += allocatedAmount;
          accountAllocations[accountId].categories.push({
            categoryId: category.id,
            categoryName: category.name,
            allocated: allocatedAmount
          });
        }
      }
    });

    // Calculate available to allocate for each account
    Object.values(accountAllocations).forEach(account => {
      account.availableToAllocate = validateAmount(account.accountBalance - account.totalAllocated);
    });

    return accountAllocations;
  }, [accounts, categories]);

  /**
   * Get available to allocate for a specific account
   */
  const getAccountAvailableToAllocate = useCallback((accountId, activeBudgetAllocations = []) => {
    const accountAllocations = calculateAccountBasedToBeAllocated(activeBudgetAllocations);
    return accountAllocations[accountId]?.availableToAllocate || 0;
  }, [calculateAccountBasedToBeAllocated]);

  /**
   * Validate cross-account allocation (NEW - Smart Cross-Account Allocation)
   * Determines if allocation is possible and what transfers are needed
   */
  const validateCrossAccountAllocation = useCallback((categoryId, amount, activeBudgetAllocations = []) => {
    const validatedAmount = validateAmount(amount);
    if (validatedAmount <= 0) {
      return { isValid: false, reason: 'Invalid amount' };
    }

    // Find the category and its funding account
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      return { isValid: false, reason: 'Category not found' };
    }

    // Find the category's funding account from active budget allocations
    const allocation = activeBudgetAllocations.find(a => a.categoryId === categoryId);
    const targetAccountId = allocation?.sourceAccountId;

    if (!targetAccountId) {
      return { isValid: false, reason: 'No funding account assigned to category' };
    }

    const targetAccount = accounts.find(a => a.id === targetAccountId);
    if (!targetAccount) {
      return { isValid: false, reason: 'Target account not found' };
    }

    // Check if target account has sufficient funds
    const targetAccountAvailable = getAccountAvailableToAllocate(targetAccountId, activeBudgetAllocations);

    if (targetAccountAvailable >= validatedAmount) {
      // Simple case: target account has enough funds
      return {
        isValid: true,
        requiresTransfer: false,
        targetAccount,
        amount: validatedAmount
      };
    }

    // Calculate shortfall and find potential source accounts
    const shortfall = validatedAmount - targetAccountAvailable;
    const availableSourceAccounts = accounts
      .filter(acc => acc.id !== targetAccountId)
      .map(acc => ({
        id: acc.id,
        name: acc.name,
        available: getAccountAvailableToAllocate(acc.id, activeBudgetAllocations)
      }))
      .filter(acc => acc.available >= shortfall)
      .sort((a, b) => b.available - a.available); // Sort by available amount descending

    if (availableSourceAccounts.length === 0) {
      // Check total funds across all accounts
      const totalAvailable = accounts.reduce((sum, acc) => {
        return sum + getAccountAvailableToAllocate(acc.id, activeBudgetAllocations);
      }, 0);

      return {
        isValid: false,
        reason: totalAvailable < validatedAmount
          ? 'Insufficient funds across all accounts'
          : 'No single account has enough funds for transfer'
      };
    }

    return {
      isValid: true,
      requiresTransfer: true,
      targetAccount,
      amount: validatedAmount,
      shortfall,
      availableSourceAccounts,
      transferAmount: shortfall
    };
  }, [categories, accounts, getAccountAvailableToAllocate]);

  /**
   * Create a pending transfer record (NEW)
   */
  const createPendingTransfer = useCallback((fromAccountId, toAccountId, amount, reason, categoryId = null) => {
    const validatedAmount = validateAmount(amount);
    if (validatedAmount <= 0) return null;

    const newTransfer = {
      id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromAccountId,
      toAccountId,
      amount: validatedAmount,
      reason,
      categoryId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setPendingTransfers(prev => [...prev, newTransfer]);
    return newTransfer;
  }, [setPendingTransfers]);

  /**
   * Get all pending transfers (NEW)
   */
  const getPendingTransfers = useCallback(() => {
    return pendingTransfers.filter(transfer => transfer.status === 'pending');
  }, [pendingTransfers]);

  /**
   * Calculate total pending transfer amount (NEW)
   */
  const getTotalPendingTransferAmount = useCallback(() => {
    return getPendingTransfers().reduce((sum, transfer) => sum + validateAmount(transfer.amount), 0);
  }, [getPendingTransfers]);

  /**
   * Mark pending transfer as completed (NEW)
   */
  const completePendingTransfer = useCallback((transferId) => {
    setPendingTransfers(prev =>
      prev.map(transfer =>
        transfer.id === transferId
          ? { ...transfer, status: 'completed', completedAt: new Date().toISOString() }
          : transfer
      )
    );
  }, [setPendingTransfers]);

  /**
   * Cancel a pending transfer (NEW)
   */
  const cancelPendingTransfer = useCallback((transferId) => {
    setPendingTransfers(prev =>
      prev.map(transfer =>
        transfer.id === transferId
          ? { ...transfer, status: 'cancelled', cancelledAt: new Date().toISOString() }
          : transfer
      )
    );
  }, [setPendingTransfers]);

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

    // Account-based allocation (NEW)
    calculateAccountBasedToBeAllocated,
    getAccountAvailableToAllocate,

    // Cross-account allocation (NEW - Smart Cross-Account Allocation)
    validateCrossAccountAllocation,
    createPendingTransfer,
    getPendingTransfers,
    getTotalPendingTransferAmount,
    completePendingTransfer,
    cancelPendingTransfer,
    pendingTransfers,

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
