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
   * Add a new transaction
   */
  const addTransaction = useCallback((transactionData) => {
    const newTransaction = {
      ...transactionData,
      id: Math.max(...transactions.map(t => t.id), 0) + 1,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [...prev, newTransaction]);

    // Update account balance
    setAccounts(prev => prev.map(account =>
      account.id === newTransaction.accountId
        ? { ...account, balance: (account.balance || 0) + newTransaction.amount }
        : account
    ));

    // Update category spending if it's an expense
    if (newTransaction.categoryId && newTransaction.amount < 0) {
      setCategories(prev => prev.map(category =>
        category.id === newTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(newTransaction.amount)
          }
          : category
      ));
    }

    return newTransaction;
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback((transactionId, transactionData) => {
    // Find the old transaction
    const oldTransaction = transactions.find(t => t.id === transactionId);
    if (!oldTransaction) return;

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

    // Reverse old transaction effects on category if it was an expense
    if (oldTransaction.categoryId && oldTransaction.amount < 0) {
      setCategories(prev => prev.map(category =>
        category.id === oldTransaction.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(oldTransaction.amount))
          }
          : category
      ));
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

    // Update category spending if it's an expense
    if (updatedTransaction.categoryId && updatedTransaction.amount < 0) {
      setCategories(prev => prev.map(category =>
        category.id === updatedTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(updatedTransaction.amount)
          }
          : category
      ));
    }

    return updatedTransaction;
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Delete a transaction
   */
  const deleteTransaction = useCallback((transactionId) => {
    // Find the transaction to delete
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) return;

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

    // Reverse transaction effects on category if it was an expense
    if (transactionToDelete.categoryId && transactionToDelete.amount < 0) {
      setCategories(prev => prev.map(category =>
        category.id === transactionToDelete.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(transactionToDelete.amount))
          }
          : category
      ));
    }

    // Remove the transaction
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Filter transactions by various criteria
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

      // Filter by category
      if (categoryId && transaction.categoryId !== categoryId) {
        return false;
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

      // Filter by search term
      if (searchTerm && !transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
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