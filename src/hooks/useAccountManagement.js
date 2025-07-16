// src/hooks/useAccountManagement.js
import { useCallback } from 'react';
import { useStorage } from './useStorage';

/**
 * Custom hook for managing accounts
 * Extracts account-related state and operations from App.js
 */
export const useAccountManagement = () => {
  // Accounts state - now using cloud storage
  const [accounts, setAccounts] = useStorage('budgetCalc_accounts', [
    {
      id: 1,
      name: 'Checking',
      balance: 1000,
      clearedBalance: 950, // Cleared balance is typically less than total balance
      type: 'checking',
      color: 'bg-info/50',
      isDefault: true
    },
    {
      id: 2,
      name: 'Savings',
      balance: 5000,
      clearedBalance: 5000, // Savings accounts typically have all funds cleared
      type: 'savings',
      color: 'bg-green-500',
      isDefault: false
    }
  ]);

  /**
   * Add a new account
   */
  const addAccount = useCallback((accountData) => {
    setAccounts(prev => {
      const newAccount = {
        ...accountData,
        id: Math.max(...prev.map(a => a.id), 0) + 1,
      };

      // If this is the first account, make it the default
      if (prev.length === 0) {
        newAccount.isDefault = true;
      }

      return [...prev, newAccount];
    });
  }, [setAccounts]);

  /**
   * Update an existing account
   */
  const updateAccount = useCallback((accountId, accountData) => {
    // If setting this account as default, unset default on all others
    if (accountData.isDefault) {
      setAccounts(prev => prev.map(account => ({
        ...account,
        isDefault: account.id === accountId
      })));
    } else {
      setAccounts(prev => {
        // Make sure we're not unsetting the default on the only default account
        const currentDefault = prev.find(a => a.isDefault);
        if (currentDefault && currentDefault.id === accountId) {
          // Don't allow unsetting the default if it's the only default
          return prev.map(account =>
            account.id === accountId ? { ...account, ...accountData, isDefault: true } : account
          );
        }

        // Normal update
        return prev.map(account =>
          account.id === accountId ? { ...account, ...accountData } : account
        );
      });
    }
  }, [setAccounts]);

  /**
   * Delete an account
   */
  const deleteAccount = useCallback((accountId) => {
    setAccounts(prev => {
      // Check if this is the default account
      const accountToDelete = prev.find(a => a.id === accountId);
      if (!accountToDelete) return prev;

      // Don't allow deleting the only account
      if (prev.length <= 1) {
        console.error('Cannot delete the only account');
        return prev;
      }

      // If deleting the default account, make another account the default
      if (accountToDelete.isDefault) {
        const newAccounts = prev.filter(a => a.id !== accountId);
        newAccounts[0].isDefault = true;
        return newAccounts;
      } else {
        // Normal delete
        return prev.filter(a => a.id !== accountId);
      }
    });
  }, [setAccounts]);

  /**
   * Transfer money between accounts
   */
  const transferBetweenAccounts = useCallback((fromAccountId, toAccountId, amount) => {
    if (fromAccountId === toAccountId) {
      console.error('Cannot transfer to the same account');
      return;
    }

    if (amount <= 0) {
      console.error('Transfer amount must be positive');
      return;
    }

    let transferResult = null;

    setAccounts(prev => {
      const fromAccount = prev.find(a => a.id === fromAccountId);
      if (!fromAccount) {
        console.error('From account not found');
        return prev;
      }

      if (fromAccount.balance < amount) {
        console.error('Insufficient funds for transfer');
        return prev;
      }

      const toAccount = prev.find(a => a.id === toAccountId);
      if (!toAccount) {
        console.error('To account not found');
        return prev;
      }

      // Store transfer result for return value
      transferResult = {
        fromAccount: fromAccount.name,
        toAccount: toAccount.name,
        amount,
        date: new Date().toISOString()
      };

      return prev.map(account => {
        if (account.id === fromAccountId) {
          return { ...account, balance: account.balance - amount };
        }
        if (account.id === toAccountId) {
          return { ...account, balance: account.balance + amount };
        }
        return account;
      });
    });

    return transferResult;
  }, [setAccounts]);

  /**
   * Get the default account
   */
  const getDefaultAccount = useCallback(() => {
    return accounts.find(a => a.isDefault) || accounts[0];
  }, [accounts]);

  /**
   * Calculate total balance across all accounts
   */
  const getTotalBalance = useCallback(() => {
    return accounts.reduce((total, account) => total + (account.balance || 0), 0);
  }, [accounts]);

  /**
   * Calculate total cleared balance across all accounts
   */
  const getTotalClearedBalance = useCallback(() => {
    return accounts.reduce((total, account) => total + (account.clearedBalance || 0), 0);
  }, [accounts]);

  /**
   * Calculate total working balance across all accounts
   * This is the source of truth for budget calculations
   */
  const getTotalWorkingBalance = useCallback((transactions = []) => {
    return accounts.reduce((total, account) => {
      // Calculate working balance the same way AccountsManagement does
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const startingBalance = account.startingBalance || account.balance || 0;
      const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      return total + workingBalance;
    }, 0);
  }, [accounts]);

  return {
    accounts,
    setAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    getDefaultAccount,
    getTotalBalance,
    getTotalClearedBalance,
    getTotalWorkingBalance
  };
};
