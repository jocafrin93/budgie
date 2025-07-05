// src/hooks/useAccountManagement.js
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing accounts
 * Extracts account-related state and operations from App.js
 */
export const useAccountManagement = () => {
  // Accounts state
  const [accounts, setAccounts] = useLocalStorage('budgetCalc_accounts', [
    {
      id: 1,
      name: 'Checking',
      balance: 1000,
      type: 'checking',
      color: 'bg-blue-500',
      isDefault: true
    },
    {
      id: 2,
      name: 'Savings',
      balance: 5000,
      type: 'savings',
      color: 'bg-green-500',
      isDefault: false
    }
  ]);

  /**
   * Add a new account
   */
  const addAccount = useCallback((accountData) => {
    const newAccount = {
      ...accountData,
      id: Math.max(...accounts.map(a => a.id), 0) + 1,
    };
    
    // If this is the first account, make it the default
    if (accounts.length === 0) {
      newAccount.isDefault = true;
    }
    
    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  }, [accounts, setAccounts]);

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
      // Make sure we're not unsetting the default on the only default account
      const currentDefault = accounts.find(a => a.isDefault);
      if (currentDefault && currentDefault.id === accountId) {
        // Don't allow unsetting the default if it's the only default
        setAccounts(prev => prev.map(account =>
          account.id === accountId ? { ...account, ...accountData, isDefault: true } : account
        ));
        return;
      }
      
      // Normal update
      setAccounts(prev => prev.map(account =>
        account.id === accountId ? { ...account, ...accountData } : account
      ));
    }
  }, [accounts, setAccounts]);

  /**
   * Delete an account
   */
  const deleteAccount = useCallback((accountId) => {
    // Check if this is the default account
    const accountToDelete = accounts.find(a => a.id === accountId);
    if (!accountToDelete) return;
    
    // Don't allow deleting the only account
    if (accounts.length <= 1) {
      console.error('Cannot delete the only account');
      return;
    }
    
    // If deleting the default account, make another account the default
    if (accountToDelete.isDefault) {
      const newAccounts = accounts.filter(a => a.id !== accountId);
      newAccounts[0].isDefault = true;
      setAccounts(newAccounts);
    } else {
      // Normal delete
      setAccounts(prev => prev.filter(a => a.id !== accountId));
    }
  }, [accounts, setAccounts]);

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
    
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    if (!fromAccount) {
      console.error('From account not found');
      return;
    }
    
    if (fromAccount.balance < amount) {
      console.error('Insufficient funds for transfer');
      return;
    }
    
    const toAccount = accounts.find(a => a.id === toAccountId);
    if (!toAccount) {
      console.error('To account not found');
      return;
    }
    
    setAccounts(prev => prev.map(account => {
      if (account.id === fromAccountId) {
        return { ...account, balance: account.balance - amount };
      }
      if (account.id === toAccountId) {
        return { ...account, balance: account.balance + amount };
      }
      return account;
    }));
    
    // Return a transaction-like object that could be used to record the transfer
    return {
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      amount,
      date: new Date().toISOString()
    };
  }, [accounts, setAccounts]);

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

  return {
    accounts,
    setAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    getDefaultAccount,
    getTotalBalance
  };
};