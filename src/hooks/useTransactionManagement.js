// src/hooks/useTransactionManagement.js
import { useCallback } from 'react';
import { useSimpleStorage } from './useSimpleStorage';

/**
 * Custom hook for managing transactions
 * Extracts transaction-related state and operations from App.js
 */
export const useTransactionManagement = (accounts, setAccounts, categories, setCategories) => {
  // Transactions state - now uses simple localStorage
  const [transactions, setTransactions] = useSimpleStorage('budgetCalc_transactions', []);

  /**
   * Add a new transaction with enhanced split support
   */
  const addTransaction = useCallback((transactionData) => {
    console.log('addTransaction called with:', transactionData);
    console.log('addTransaction called from:', new Error().stack);

    // Verify accounts exist before proceeding
    if (transactionData.accountId && !accounts.some(a => String(a.id) === String(transactionData.accountId))) {
      console.error(`ERROR: Source account ID ${transactionData.accountId} does not exist!`, {
        providedAccountId: transactionData.accountId,
        availableAccounts: accounts.map(a => ({ id: a.id, name: a.name }))
      });
      return null;
    }

    if (transactionData.transferToAccountId && !accounts.some(a => String(a.id) === String(transactionData.transferToAccountId))) {
      console.error(`ERROR: Target account ID ${transactionData.transferToAccountId} does not exist!`, {
        providedAccountId: transactionData.transferToAccountId,
        availableAccounts: accounts.map(a => ({ id: a.id, name: a.name }))
      });
      return null;
    }

    // Normalize account IDs to ensure consistent type handling
    const normalizedData = {
      ...transactionData,
      accountId: transactionData.accountId ? parseInt(transactionData.accountId, 10) : transactionData.accountId,
      transferToAccountId: transactionData.transferToAccountId ? parseInt(transactionData.transferToAccountId, 10) : transactionData.transferToAccountId
    };

    console.log('Normalized transaction data:', normalizedData);

    let createdTransaction;

    // Update transactions array and generate ID inside state setter
    setTransactions(prev => {
      console.log('Previous array length:', prev.length);

      // Generate ID based on current state, not stale closure
      const newId = Math.max(...prev.map(t => t.id || 0), 0) + 1;

      createdTransaction = {
        ...normalizedData, // Use normalized data instead of original
        id: newId,
        createdAt: new Date().toISOString()
      };

      console.log('Created newTransaction with ID:', newId);

      const updated = [...prev, createdTransaction];
      console.log('New array length:', updated.length);
      return updated;
    });

    // Update account balance for main transaction (with extra safety)
    setAccounts(prev => {
      // Make sure accounts are valid before proceeding
      if (!Array.isArray(prev) || prev.length === 0) {
        console.error('Invalid accounts array:', prev);
        return prev;
      }

      // Safety check for createdTransaction
      if (!createdTransaction) {
        console.error('createdTransaction is undefined');
        return prev;
      }

      // Safety check for createdTransaction.accountId
      if (createdTransaction.accountId === undefined || createdTransaction.accountId === null) {
        console.error('createdTransaction.accountId is undefined or null');
        return prev;
      }

      // Debugging account lookup
      const sourceAccount = prev.find(a => String(a.id) === String(createdTransaction.accountId));
      const destAccount = createdTransaction.transferToAccountId ?
        prev.find(a => String(a.id) === String(createdTransaction.transferToAccountId)) :
        null;

      console.log('Account balance update - account lookup:', {
        sourceAccountId: createdTransaction.accountId,
        sourceAccountFound: !!sourceAccount,
        destAccountId: createdTransaction.transferToAccountId,
        destAccountFound: !!destAccount,
        allAccountIds: prev.map(a => a.id)
      });

      return prev.map(account => {
        // Skip null or undefined accounts
        if (!account) return account;

        // Skip accounts without an id
        if (account.id === undefined || account.id === null) {
          console.warn('Account without ID found:', account);
          return account;
        }

        try {
          // Ensure consistent ID type comparison by converting to strings for comparison
          const accountIdStr = String(account.id);
          const transactionAccountIdStr = String(createdTransaction.accountId);
          const transferToAccountIdStr = createdTransaction.transferToAccountId ? String(createdTransaction.transferToAccountId) : null;

          if (accountIdStr === transactionAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (transaction account)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) + parseFloat(createdTransaction.amount)
            };
          }

          // Handle transfer to another account
          if (transferToAccountIdStr && accountIdStr === transferToAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (transfer destination account)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) - parseFloat(createdTransaction.amount)
            };
          }

          return account;
        } catch (error) {
          console.error(`Error processing account ${account.id}:`, error);
          return account;
        }
      });
    });

    // Handle category spending for different transaction types
    if (createdTransaction.isSplit && createdTransaction.splits) {
      // SPLIT TRANSACTION: Update category spending for each split
      console.log('Processing split transaction category updates:', createdTransaction.splits);

      createdTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0 && split.categoryId !== 'to-be-allocated') {
          // Only track spending for expense splits (negative amounts), excluding "to-be-allocated"
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: (category.spent || 0) + Math.abs(split.amount),
                available: (category.allocated || 0) - ((category.spent || 0) + Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Updated category ${split.categoryId} spending by ${Math.abs(split.amount)}`);
        }
      });
    } else if (createdTransaction.categoryId && createdTransaction.amount < 0 && !createdTransaction.transferToAccountId && createdTransaction.categoryId !== 'to-be-allocated') {
      // REGULAR EXPENSE: Update category spending (excluding "to-be-allocated")
      setCategories(prev => prev.map(category =>
        category.id === createdTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(createdTransaction.amount),
            available: (category.allocated || 0) - ((category.spent || 0) + Math.abs(createdTransaction.amount))
          }
          : category
      ));
      console.log(`Updated category ${createdTransaction.categoryId} spending by ${Math.abs(createdTransaction.amount)}`);
    }

    // Handle "to-be-allocated" transactions - these increase available funds for allocation
    if (createdTransaction.categoryId === 'to-be-allocated' && createdTransaction.amount > 0) {
      console.log(`Transaction categorized as "to-be-allocated" with amount: ${createdTransaction.amount}`);
      // Note: The actual "to-be-allocated" amount calculation is handled in the summary components
      // by filtering transactions with categoryId === 'to-be-allocated'
    }

    return createdTransaction;
  }, [setTransactions, setAccounts, setCategories]);

  /**
   * Update an existing transaction with enhanced split support
   */
  const updateTransaction = useCallback((transactionId, transactionData) => {
    // Find the old transaction
    const oldTransaction = transactions.find(t => t.id === transactionId);
    if (!oldTransaction) {
      console.error(`Transaction with ID ${transactionId} not found for update`);
      return null;
    }

    // Verify accounts exist before proceeding
    if (transactionData.accountId && !accounts.some(a => String(a.id) === String(transactionData.accountId))) {
      console.error(`ERROR: Source account ID ${transactionData.accountId} does not exist!`, {
        providedAccountId: transactionData.accountId,
        availableAccounts: accounts.map(a => ({ id: a.id, name: a.name }))
      });
      return null;
    }

    if (transactionData.transferToAccountId && !accounts.some(a => String(a.id) === String(transactionData.transferToAccountId))) {
      console.error(`ERROR: Target account ID ${transactionData.transferToAccountId} does not exist!`, {
        providedAccountId: transactionData.transferToAccountId,
        availableAccounts: accounts.map(a => ({ id: a.id, name: a.name }))
      });
      return null;
    }

    // Normalize account IDs to ensure consistent type handling
    const normalizedData = {
      ...transactionData,
      accountId: transactionData.accountId ? parseInt(transactionData.accountId, 10) : transactionData.accountId,
      transferToAccountId: transactionData.transferToAccountId ? parseInt(transactionData.transferToAccountId, 10) : transactionData.transferToAccountId
    };

    console.log('Updating transaction:', transactionId, 'old:', oldTransaction, 'new:', normalizedData);

    // Reverse old transaction effects on account
    setAccounts(prev => {
      // Make sure accounts are valid before proceeding
      if (!Array.isArray(prev) || prev.length === 0) {
        console.error('Invalid accounts array:', prev);
        return prev;
      }

      return prev.map(account => {
        // Skip null or undefined accounts
        if (!account) return account;

        // Skip accounts without an id
        if (account.id === undefined || account.id === null) {
          console.warn('Account without ID found when reversing transaction:', account);
          return account;
        }

        try {
          // Ensure consistent ID comparison with string conversion
          const accountIdStr = String(account.id);
          const oldTransactionAccountIdStr = String(oldTransaction.accountId);
          const oldTransferToAccountIdStr = oldTransaction.transferToAccountId ? String(oldTransaction.transferToAccountId) : null;

          if (accountIdStr === oldTransactionAccountIdStr) {
            console.log(`Reversing balance for account ${account.id} from old transaction`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) - parseFloat(oldTransaction.amount)
            };
          }

          if (oldTransferToAccountIdStr && accountIdStr === oldTransferToAccountIdStr) {
            console.log(`Reversing transfer balance for account ${account.id} from old transaction`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) + parseFloat(oldTransaction.amount)
            };
          }

          return account;
        } catch (error) {
          console.error(`Error processing account ${account.id} during transaction reversal:`, error);
          return account;
        }
      });
    });

    // Reverse old transaction effects on category spending
    if (oldTransaction.isSplit && oldTransaction.splits) {
      // REVERSE SPLIT TRANSACTION: Remove spending from each split category
      oldTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0 && split.categoryId !== 'to-be-allocated') {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: Math.max(0, (category.spent || 0) - Math.abs(split.amount)),
                available: (category.allocated || 0) - Math.max(0, (category.spent || 0) - Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Reversed category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (oldTransaction.categoryId && oldTransaction.amount < 0 && oldTransaction.categoryId !== 'to-be-allocated') {
      // REVERSE REGULAR EXPENSE: Remove spending from category (excluding "to-be-allocated")
      setCategories(prev => prev.map(category =>
        category.id === oldTransaction.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(oldTransaction.amount)),
            available: (category.allocated || 0) - Math.max(0, (category.spent || 0) - Math.abs(oldTransaction.amount))
          }
          : category
      ));
      console.log(`Reversed category ${oldTransaction.categoryId} spending by $${Math.abs(oldTransaction.amount)}`);
    }

    // Update the transaction
    const updatedTransaction = {
      ...oldTransaction,
      ...normalizedData, // Use normalized data instead of original
      lastModified: new Date().toISOString()
    };

    setTransactions(prev => prev.map(txn =>
      txn.id === transactionId ? updatedTransaction : txn
    ));

    // Apply new transaction effects on account (with extra safety)
    setAccounts(prev => {
      // Make sure accounts are valid before proceeding
      if (!Array.isArray(prev) || prev.length === 0) {
        console.error('Invalid accounts array:', prev);
        return prev;
      }

      // Debugging account lookup
      const sourceAccount = prev.find(a => String(a.id) === String(updatedTransaction.accountId));
      const destAccount = updatedTransaction.transferToAccountId ?
        prev.find(a => String(a.id) === String(updatedTransaction.transferToAccountId)) :
        null;

      console.log('Account balance update for updated transaction - account lookup:', {
        sourceAccountId: updatedTransaction.accountId,
        sourceAccountFound: !!sourceAccount,
        destAccountId: updatedTransaction.transferToAccountId,
        destAccountFound: !!destAccount,
        allAccountIds: prev.map(a => a.id)
      });

      return prev.map(account => {
        // Skip null or undefined accounts
        if (!account) return account;

        // Skip accounts without an id
        if (account.id === undefined || account.id === null) {
          console.warn('Account without ID found:', account);
          return account;
        }

        try {
          // Ensure consistent ID type comparison using strings
          const accountIdStr = String(account.id);
          const transactionAccountIdStr = String(updatedTransaction.accountId);
          const transferToAccountIdStr = updatedTransaction.transferToAccountId ?
            String(updatedTransaction.transferToAccountId) :
            null;

          if (accountIdStr === transactionAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (updated transaction account)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) + parseFloat(updatedTransaction.amount)
            };
          }

          if (transferToAccountIdStr && accountIdStr === transferToAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (updated transfer destination account)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) - parseFloat(updatedTransaction.amount)
            };
          }

          return account;
        } catch (error) {
          console.error(`Error processing account ${account.id} during update:`, error);
          return account;
        }
      });
    });

    // Apply new transaction effects on category spending
    if (updatedTransaction.isSplit && updatedTransaction.splits) {
      // APPLY SPLIT TRANSACTION: Add spending to each split category
      updatedTransaction.splits.forEach(split => {
        if (split.categoryId && split.amount < 0 && split.categoryId !== 'to-be-allocated') {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: (category.spent || 0) + Math.abs(split.amount),
                available: (category.allocated || 0) - ((category.spent || 0) + Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Applied category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (updatedTransaction.categoryId && updatedTransaction.amount < 0 && !updatedTransaction.transferToAccountId && updatedTransaction.categoryId !== 'to-be-allocated') {
      // APPLY REGULAR EXPENSE: Add spending to category (excluding "to-be-allocated")
      setCategories(prev => prev.map(category =>
        category.id === updatedTransaction.categoryId
          ? {
            ...category,
            spent: (category.spent || 0) + Math.abs(updatedTransaction.amount),
            available: (category.allocated || 0) - ((category.spent || 0) + Math.abs(updatedTransaction.amount))
          }
          : category
      ));
      console.log(`Applied category ${updatedTransaction.categoryId} spending by $${Math.abs(updatedTransaction.amount)}`);
    }

    // Handle "to-be-allocated" transactions - these increase available funds for allocation
    if (updatedTransaction.categoryId === 'to-be-allocated' && updatedTransaction.amount > 0) {
      console.log(`Updated transaction categorized as "to-be-allocated" with amount: ${updatedTransaction.amount}`);
      // Note: The actual "to-be-allocated" amount calculation is handled in the summary components
      // by filtering transactions with categoryId === 'to-be-allocated'
    }

    return updatedTransaction;
  }, [transactions, setTransactions, setAccounts, setCategories]);

  /**
   * Delete a transaction with enhanced split support
   */
  const deleteTransaction = useCallback((transactionId) => {
    // Find the transaction to delete
    const transactionToDelete = transactions.find(t => t.id === transactionId);
    if (!transactionToDelete) {
      console.error(`Transaction with ID ${transactionId} not found for deletion`);
      return null;
    }

    console.log('Deleting transaction:', transactionToDelete);

    // Reverse transaction effects on account
    setAccounts(prev => {
      // Make sure accounts are valid before proceeding
      if (!Array.isArray(prev) || prev.length === 0) {
        console.error('Invalid accounts array:', prev);
        return prev;
      }

      // Debugging account lookup
      const sourceAccount = prev.find(a => String(a.id) === String(transactionToDelete.accountId));
      const destAccount = transactionToDelete.transferToAccountId ?
        prev.find(a => String(a.id) === String(transactionToDelete.transferToAccountId)) :
        null;

      console.log('Account balance update for deleted transaction - account lookup:', {
        sourceAccountId: transactionToDelete.accountId,
        sourceAccountFound: !!sourceAccount,
        destAccountId: transactionToDelete.transferToAccountId,
        destAccountFound: !!destAccount,
        allAccountIds: prev.map(a => a.id)
      });

      return prev.map(account => {
        // Skip null or undefined accounts
        if (!account) return account;

        // Skip accounts without an id
        if (account.id === undefined || account.id === null) {
          console.warn('Account without ID found when deleting transaction:', account);
          return account;
        }

        try {
          // Ensure consistent ID comparison with string conversion
          const accountIdStr = String(account.id);
          const transactionAccountIdStr = String(transactionToDelete.accountId);
          const transferToAccountIdStr = transactionToDelete.transferToAccountId ?
            String(transactionToDelete.transferToAccountId) :
            null;

          if (accountIdStr === transactionAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (deleting from account)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) - parseFloat(transactionToDelete.amount)
            };
          }

          if (transferToAccountIdStr && accountIdStr === transferToAccountIdStr) {
            console.log(`Updating balance for account ${account.id} (deleting from transfer destination)`);
            return {
              ...account,
              balance: (parseFloat(account.balance) || 0) + parseFloat(transactionToDelete.amount)
            };
          }

          return account;
        } catch (error) {
          console.error(`Error processing account ${account.id} during deletion:`, error);
          return account;
        }
      });
    });

    // Reverse transaction effects on category spending
    if (transactionToDelete.isSplit && transactionToDelete.splits) {
      // REVERSE SPLIT TRANSACTION: Remove spending from each split category
      transactionToDelete.splits.forEach(split => {
        if (split.categoryId && split.amount < 0 && split.categoryId !== 'to-be-allocated') {
          setCategories(prev => prev.map(category =>
            category.id === split.categoryId
              ? {
                ...category,
                spent: Math.max(0, (category.spent || 0) - Math.abs(split.amount)),
                available: (category.allocated || 0) - Math.max(0, (category.spent || 0) - Math.abs(split.amount))
              }
              : category
          ));
          console.log(`Deleted - reversed category ${split.categoryId} spending by $${Math.abs(split.amount)}`);
        }
      });
    } else if (transactionToDelete.categoryId && transactionToDelete.amount < 0 && transactionToDelete.categoryId !== 'to-be-allocated') {
      // REVERSE REGULAR EXPENSE: Remove spending from category (excluding "to-be-allocated")
      setCategories(prev => prev.map(category =>
        category.id === transactionToDelete.categoryId
          ? {
            ...category,
            spent: Math.max(0, (category.spent || 0) - Math.abs(transactionToDelete.amount)),
            available: (category.allocated || 0) - Math.max(0, (category.spent || 0) - Math.abs(transactionToDelete.amount))
          }
          : category
      ));
      console.log(`Deleted - reversed category ${transactionToDelete.categoryId} spending by $${Math.abs(transactionToDelete.amount)}`);
    }

    // Handle deletion of "to-be-allocated" transactions
    if (transactionToDelete.categoryId === 'to-be-allocated') {
      console.log(`Deleted "to-be-allocated" transaction with amount: ${transactionToDelete.amount}`);
      // Note: The actual "to-be-allocated" amount calculation is handled in the summary components
      // by filtering transactions with categoryId === 'to-be-allocated'
    }

    // Remove the transaction
    setTransactions(prev => {
      const filtered = prev.filter(t => t.id !== transactionId);
      console.log('🔄 TRANSACTIONS - Removing transaction. Before:', prev.length, 'After:', filtered.length);
      return filtered;
    });
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
