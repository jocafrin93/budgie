// src/hooks/useTransactionManagement.js
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing transactions
 * Extracts transaction-related state and operations from App.js
 */
export const useTransactionManagement = (accounts, setAccounts, categories, setCategories) => {
  // Transactions state
  const [transactions, setTransactions] = useLocalStorage('budgetCalc_transactions', []);

  /**
   * Add a new transaction with enhanced split support
   */
  const addTransaction = useCallback((transactionData) => {
    console.log('addTransaction called with:', transactionData);

    let createdTransaction;

    // Update transactions array and generate ID inside state setter
    setTransactions(prev => {
      console.log('Previous array length:', prev.length);

      // Generate ID based on current state, not stale closure
      const newId = Math.max(...prev.map(t => t.id), 0) + 1;

      createdTransaction = {
        ...transactionData,
        id: newId,
        createdAt: new Date().toISOString()
      };

      console.log('Created newTransaction with ID:', newId);

      const updated = [...prev, createdTransaction];
      console.log('New array length:', updated.length);
      return updated;
    });

    // Update account balance for main transaction
    setAccounts(prev => prev.map(account => {
      if (account.id === createdTransaction.accountId) {
        return { ...account, balance: (account.balance || 0) + createdTransaction.amount };
      }
      // Handle transfer to another account
      if (createdTransaction.transferAccountId && account.id === createdTransaction.transferAccountId) {
        return { ...account, balance: (account.balance || 0) - createdTransaction.amount };
      }
      return account;
    }));

    // Handle category spending for different transaction types
    if (createdTransaction.isSplit && createdTransaction.splits) {
      // SPLIT TRANSACTION: Update category spending for each split
      console.log('Processing split transaction category updates:', createdTransaction.splits);

      createdTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0) {
          // Only track spending for expense splits (negative amounts)
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: (category.spent || 0) + Math.abs(split.amount)
              }
              : category
          ));
          console.log(`Updated category ${split.categoryId} spending by ${Math.abs(split.amount)}`);
        }
      });
    } else if (createdTransaction.categoryId && createdTransaction.amount < 0 && !createdTransaction.transferAccountId) {
      // REGULAR EXPENSE: Update category spending
      setCategories(prev => prev.map(category =>
        category.id === createdTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(createdTransaction.amount)
          }
          : category
      ));
      console.log(`Updated category ${createdTransaction.categoryId} spending by ${Math.abs(createdTransaction.amount)}`);
    }

    return createdTransaction;
  }, [setTransactions, setAccounts, setCategories]);

  /**
   * Update an existing transaction with enhanced split support
   */
  const updateTransaction = useCallback((transactionId, transactionData) => {
    // Find the old transaction
    const oldTransaction = transactions.find(t => t.id === transactionId);
    if (!oldTransaction) return;

    console.log('Updating transaction:', transactionId, 'old:', oldTransaction, 'new:', transactionData);

    // Reverse old transaction effects on account
    setAccounts(prev => prev.map(account => {
      if (account.id === oldTransaction.accountId) {
        return {
          ...account,
          balance: (account.balance || 0) - oldTransaction.amount
        };
      }
      if (oldTransaction.transferAccountId && account.id === oldTransaction.transferAccountId) {
        return {
          ...account,
          balance: (account.balance || 0) + oldTransaction.amount
        };
      }
      return account;
    }));

    // Reverse old transaction effects on category spending
    if (oldTransaction.isSplit && oldTransaction.splits) {
      // REVERSE SPLIT TRANSACTION: Remove spending from each split category
      oldTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0) {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: Math.max(0, (category.spent || 0) - Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Reversed category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (oldTransaction.categoryId && oldTransaction.amount < 0) {
      // REVERSE REGULAR EXPENSE: Remove spending from category
      setCategories(prev => prev.map(category =>
        category.id === oldTransaction.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(oldTransaction.amount))
          }
          : category
      ));
      console.log(`Reversed category ${oldTransaction.categoryId} spending by $${Math.abs(oldTransaction.amount)}`);
    }

    // Update the transaction
    const updatedTransaction = {
      ...oldTransaction,
      ...transactionData,
      lastModified: new Date().toISOString()
    };

    setTransactions(prev => prev.map(txn =>
      txn.id === transactionId ? updatedTransaction : txn
    ));

    // Apply new transaction effects on account
    setAccounts(prev => prev.map(account => {
      if (account.id === updatedTransaction.accountId) {
        return {
          ...account,
          balance: (account.balance || 0) + updatedTransaction.amount
        };
      }
      if (updatedTransaction.transferAccountId && account.id === updatedTransaction.transferAccountId) {
        return {
          ...account,
          balance: (account.balance || 0) - updatedTransaction.amount
        };
      }
      return account;
    }));

    // Apply new transaction effects on category spending
    if (updatedTransaction.isSplit && updatedTransaction.splits) {
      // APPLY SPLIT TRANSACTION: Add spending to each split category
      updatedTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0) {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: (category.spent || 0) + Math.abs(split.amount)
              }
              : category
          ));
          console.log(`Applied category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (updatedTransaction.categoryId && updatedTransaction.amount < 0 && !updatedTransaction.transferAccountId) {
      // APPLY REGULAR EXPENSE: Add spending to category
      setCategories(prev => prev.map(category =>
        category.id === updatedTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(updatedTransaction.amount)
          }
          : category
      ));
      console.log(`Applied category ${updatedTransaction.categoryId} spending by $${Math.abs(updatedTransaction.amount)}`);
    }

    return updatedTransaction;
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Delete a transaction with enhanced split support
   */
  const deleteTransaction = useCallback((transactionId) => {
    // Find the transaction to delete
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

    console.log('Deleting transaction:', transactionToDelete);

    // Reverse transaction effects on account
    setAccounts(prev => prev.map(account => {
      if (account.id === transactionToDelete.accountId) {
        return {
          ...account,
          balance: (account.balance || 0) - transactionToDelete.amount
        };
      }
      if (transactionToDelete.transferAccountId && account.id === transactionToDelete.transferAccountId) {
        return {
          ...account,
          balance: (account.balance || 0) + transactionToDelete.amount
        };
      }
      return account;
    }));

    // Reverse transaction effects on category spending
    if (transactionToDelete.isSplit && transactionToDelete.splits) {
      // REVERSE SPLIT TRANSACTION: Remove spending from each split category
      transactionToDelete.splits.forEach(split => {
        if (split.categoryId && split.amount < 0) {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: Math.max(0, (category.spent || 0) - Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Deleted - reversed category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (transactionToDelete.categoryId && transactionToDelete.amount < 0) {
      // REVERSE REGULAR EXPENSE: Remove spending from category
      setCategories(prev => prev.map(category =>
        category.id === transactionToDelete.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(transactionToDelete.amount))
          }
          : category
      ));
      console.log(`Deleted - reversed category ${transactionToDelete.categoryId} spending by $${Math.abs(transactionToDelete.amount)}`);
    }

    // Remove the transaction
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Enhanced filter function that understands splits
   */
  const filterTransactions = useCallback((filters = {}) => {
    const {
      accountId,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      searchTerm
    } = filters;

    return transactions.filter(transaction => {
      // Filter by account
      if (accountId && transaction.accountId !== accountId) {
        return false;
      }

      // Filter by category (including splits)
      if (categoryId) {
        const matchesMainCategory = transaction.categoryId === categoryId;
        const matchesSplitCategory = transaction.isSplit && transaction.splits?.some(split => split.categoryId === categoryId);
        if (!matchesMainCategory && !matchesSplitCategory) {
          return false;
        }
      }

      // Filter by date range
      if (startDate && new Date(transaction.date) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(transaction.date) > new Date(endDate)) {
        return false;
      }

      // Filter by amount range
      if (minAmount !== undefined && transaction.amount < minAmount) {
        return false;
      }
      if (maxAmount !== undefined && transaction.amount > maxAmount) {
        return false;
      }

      // Filter by search term (including split memos)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesMain = (
          transaction.payee?.toLowerCase().includes(searchLower) ||
          transaction.memo?.toLowerCase().includes(searchLower)
        );
        const matchesSplits = transaction.isSplit && transaction.splits?.some(split =>
          split.memo?.toLowerCase().includes(searchLower)
        );
        if (!matchesMain && !matchesSplits) {
          return false;
        }
      }

      return true;
    });
  }, [transactions]);

  return {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions
  };
};