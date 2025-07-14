// src/hooks/useScheduledTransactions.js
import { useCallback, useEffect } from 'react';
import { useStorage } from './useStorage';

/**
 * Custom hook for managing scheduled transactions
 * Handles creation, activation, and recurring pattern management
 */
export const useScheduledTransactions = (addTransaction) => {
    // Scheduled transactions state
    const [scheduledTransactions, setScheduledTransactions] = useStorage('budgetCalc_scheduledTransactions', []);

    /**
     * Generate next occurrence date based on frequency
     */
    const getNextOccurrenceDate = useCallback((currentDate, frequency, interval = 1) => {
        const date = new Date(currentDate);

        switch (frequency) {
            case 'weekly':
                date.setDate(date.getDate() + (7 * interval));
                break;
            case 'bi-weekly':
                date.setDate(date.getDate() + (14 * interval));
                break;
            case 'every-3-weeks':
                date.setDate(date.getDate() + (21 * interval));
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + interval);
                break;
            case 'every-5-weeks':
                date.setDate(date.getDate() + (35 * interval));
                break;
            case 'every-6-weeks':
                date.setDate(date.getDate() + (42 * interval));
                break;
            case 'every-7-weeks':
                date.setDate(date.getDate() + (49 * interval));
                break;
            case 'bi-monthly':
                date.setMonth(date.getMonth() + (2 * interval));
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + (3 * interval));
                break;
            case 'semi-annually':
                date.setMonth(date.getMonth() + (6 * interval));
                break;
            case 'annually':
                date.setFullYear(date.getFullYear() + interval);
                break;
            default:
                date.setMonth(date.getMonth() + interval);
        }

        return date;
    }, []);

    /**
     * Create scheduled transactions from budget item
     */
    const createScheduledTransactionsFromBudgetItem = useCallback((budgetItem, scheduledTransactionOptions) => {
        const {
            createScheduledTransactions,
            endCondition,
            endDate,
            maxOccurrences
        } = scheduledTransactionOptions;

        if (!createScheduledTransactions || !budgetItem.dueDate || !budgetItem.frequency) {
            console.log('🔥 SCHEDULED TRANSACTION CREATION SKIPPED:', {
                createScheduledTransactions,
                dueDate: budgetItem.dueDate,
                frequency: budgetItem.frequency,
                budgetItem
            });
            return [];
        }

        console.log('🔥 CREATING SCHEDULED TRANSACTIONS FROM BUDGET ITEM:', {
            budgetItem,
            categoryId: budgetItem.categoryId,
            categoryIdType: typeof budgetItem.categoryId,
            scheduledTransactionOptions
        });

        const transactions = [];
        let currentDate = new Date(budgetItem.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If the first due date is in the past, move to next occurrence
        while (currentDate < today) {
            currentDate = getNextOccurrenceDate(currentDate, budgetItem.frequency);
        }

        let occurrenceCount = 1;
        const maxDate = endDate ? new Date(endDate) : new Date(Date.now() + (5 * 365 * 24 * 60 * 60 * 1000)); // 5 years max

        // Generate scheduled transactions based on end condition
        while (currentDate <= maxDate) {
            // Check end conditions
            if (endCondition === 'max_occurrences' && occurrenceCount > maxOccurrences) {
                break;
            }
            if (endCondition === 'until_date' && endDate && currentDate > new Date(endDate)) {
                break;
            }

            const scheduledTransaction = {
                id: `scheduled_${Date.now()}_${occurrenceCount}`,
                isScheduled: true,
                scheduledDate: currentDate.toISOString().split('T')[0],
                nextDueDate: currentDate.toISOString().split('T')[0], // Add nextDueDate for compatibility
                dueDate: currentDate.toISOString().split('T')[0], // Add dueDate for compatibility
                isActivated: false,
                budgetItemId: budgetItem.id || `budget_${Date.now()}`,
                categoryId: budgetItem.categoryId, // Ensure categoryId is preserved
                accountId: budgetItem.accountId,
                amount: -Math.abs(budgetItem.amount), // Expenses are negative
                payee: budgetItem.payee || budgetItem.name,
                memo: `${budgetItem.displayName || budgetItem.name} - Scheduled Payment`,
                date: currentDate.toISOString().split('T')[0],
                frequency: budgetItem.frequency, // Add frequency for display
                recurringPattern: {
                    frequency: budgetItem.frequency,
                    interval: 1,
                    endCondition,
                    endDate,
                    maxOccurrences,
                    currentOccurrence: occurrenceCount,
                    parentBudgetItemId: budgetItem.id || `budget_${Date.now()}`
                },
                createdAt: new Date().toISOString()
            };

            console.log('🔥 SCHEDULED TRANSACTION CREATED:', {
                id: scheduledTransaction.id,
                categoryId: scheduledTransaction.categoryId,
                categoryIdType: typeof scheduledTransaction.categoryId,
                budgetItemCategoryId: budgetItem.categoryId,
                budgetItemCategoryIdType: typeof budgetItem.categoryId,
                budgetItemId: budgetItem.id,
                budgetItemIdType: typeof budgetItem.id,
                payee: scheduledTransaction.payee,
                amount: scheduledTransaction.amount,
                frequency: scheduledTransaction.frequency,
                scheduledDate: scheduledTransaction.scheduledDate,
                fullBudgetItem: budgetItem
            });

            transactions.push(scheduledTransaction);

            // For indefinite recurring, only create the next few occurrences
            if (endCondition === 'indefinite' && occurrenceCount >= 12) {
                break;
            }

            // Move to next occurrence
            currentDate = getNextOccurrenceDate(currentDate, budgetItem.frequency);
            occurrenceCount++;
        }

        return transactions;
    }, [getNextOccurrenceDate]);

    /**
     * Add scheduled transactions to the store
     */
    const addScheduledTransactions = useCallback((transactions) => {
        setScheduledTransactions(prev => [...prev, ...transactions]);
    }, [setScheduledTransactions]);

    /**
     * Activate scheduled transactions that are due today
     */
    const activateScheduledTransactions = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];

        setScheduledTransactions(prev => {
            const updated = [...prev];
            let hasChanges = false;

            updated.forEach(scheduledTxn => {
                if (!scheduledTxn.isActivated && scheduledTxn.scheduledDate === todayString) {
                    // Activate the scheduled transaction
                    scheduledTxn.isActivated = true;
                    scheduledTxn.activatedAt = new Date().toISOString();
                    scheduledTxn.isNewlyActivated = true; // For highlighting
                    hasChanges = true;

                    // Create the actual transaction
                    const actualTransaction = {
                        ...scheduledTxn,
                        id: undefined, // Let addTransaction generate new ID
                        isScheduled: false,
                        scheduledTransactionId: scheduledTxn.id
                    };

                    console.log('🔄 SCHEDULED TRANSACTION ACTIVATION - Creating transaction from scheduled:', {
                        scheduledTransactionId: scheduledTxn.id,
                        scheduledDate: scheduledTxn.scheduledDate,
                        payee: scheduledTxn.payee,
                        amount: scheduledTxn.amount,
                        wasAlreadyActivated: scheduledTxn.isActivated
                    });

                    addTransaction(actualTransaction);

                    // Generate next occurrence for indefinite recurring
                    if (scheduledTxn.recurringPattern?.endCondition === 'indefinite') {
                        const nextDate = getNextOccurrenceDate(
                            new Date(scheduledTxn.scheduledDate),
                            scheduledTxn.recurringPattern.frequency,
                            scheduledTxn.recurringPattern.interval
                        );

                        const nextScheduledTransaction = {
                            ...scheduledTxn,
                            id: `scheduled_${Date.now()}_${scheduledTxn.recurringPattern.currentOccurrence + 1}`,
                            scheduledDate: nextDate.toISOString().split('T')[0],
                            date: nextDate.toISOString().split('T')[0],
                            isActivated: false,
                            isNewlyActivated: false,
                            recurringPattern: {
                                ...scheduledTxn.recurringPattern,
                                currentOccurrence: scheduledTxn.recurringPattern.currentOccurrence + 1
                            },
                            createdAt: new Date().toISOString()
                        };

                        updated.push(nextScheduledTransaction);
                    }
                }
            });

            return hasChanges ? updated : prev;
        });
    }, [setScheduledTransactions, addTransaction, getNextOccurrenceDate]);

    /**
     * Get upcoming scheduled transactions (not yet activated) - only next occurrence per unique transaction
     */
    const getUpcomingScheduledTransactions = useCallback(() => {
        // Filter out activated and skipped transactions
        const activeScheduledTransactions = scheduledTransactions
            .filter(txn => !txn.isActivated && !txn.isSkipped);

        // Group by parent budget item ID or payee to identify unique transactions
        const groupedTransactions = {};

        activeScheduledTransactions.forEach(txn => {
            // Use parentBudgetItemId if available, otherwise use payee as grouping key
            const groupKey = txn.recurringPattern?.parentBudgetItemId ||
                txn.budgetItemId ||
                `${txn.payee}_${txn.accountId}_${txn.amount}`;

            if (!groupedTransactions[groupKey]) {
                groupedTransactions[groupKey] = [];
            }
            groupedTransactions[groupKey].push(txn);
        });

        // Get only the next occurrence (earliest date) for each group
        const nextOccurrences = Object.values(groupedTransactions).map(group => {
            // Sort by scheduled date and return the earliest one
            return group.sort((a, b) =>
                new Date(a.scheduledDate) - new Date(b.scheduledDate)
            )[0];
        });

        // Sort all next occurrences by date
        return nextOccurrences.sort((a, b) =>
            new Date(a.scheduledDate) - new Date(b.scheduledDate)
        );
    }, [scheduledTransactions]);

    /**
     * Get newly activated transactions (for highlighting)
     */
    const getNewlyActivatedTransactions = useCallback(() => {
        return scheduledTransactions.filter(txn => txn.isNewlyActivated);
    }, [scheduledTransactions]);

    /**
     * Clear newly activated flag (when transaction is marked as cleared)
     */
    const clearNewlyActivatedFlag = useCallback((scheduledTransactionId) => {
        setScheduledTransactions(prev =>
            prev.map(txn =>
                txn.id === scheduledTransactionId
                    ? { ...txn, isNewlyActivated: false }
                    : txn
            )
        );
    }, [setScheduledTransactions]);

    /**
     * Edit scheduled transaction
     */
    const editScheduledTransaction = useCallback((scheduledTransactionId, updates, editScope = 'this_only') => {
        setScheduledTransactions(prev => {
            if (editScope === 'this_only') {
                return prev.map(txn =>
                    txn.id === scheduledTransactionId
                        ? { ...txn, ...updates, lastModified: new Date().toISOString() }
                        : txn
                );
            } else if (editScope === 'all_future') {
                const targetTransaction = prev.find(txn => txn.id === scheduledTransactionId);
                if (!targetTransaction) return prev;

                return prev.map(txn => {
                    // Update this transaction and all future ones with same parent
                    if (txn.recurringPattern?.parentBudgetItemId === targetTransaction.recurringPattern?.parentBudgetItemId &&
                        new Date(txn.scheduledDate) >= new Date(targetTransaction.scheduledDate)) {
                        return { ...txn, ...updates, lastModified: new Date().toISOString() };
                    }
                    return txn;
                });
            }
            return prev;
        });
    }, [setScheduledTransactions]);

    /**
     * Skip a scheduled transaction occurrence
     */
    const skipScheduledTransaction = useCallback((scheduledTransactionId) => {
        setScheduledTransactions(prev =>
            prev.map(txn =>
                txn.id === scheduledTransactionId
                    ? { ...txn, isSkipped: true, skippedAt: new Date().toISOString() }
                    : txn
            )
        );
    }, [setScheduledTransactions]);

    /**
     * Activate scheduled transaction early ("Pay Now")
     */
    const activateScheduledTransactionEarly = useCallback((scheduledTransactionId) => {
        setScheduledTransactions(prev => {
            const updated = [...prev];
            const scheduledTxn = updated.find(txn => txn.id === scheduledTransactionId);

            if (scheduledTxn && !scheduledTxn.isActivated) {
                scheduledTxn.isActivated = true;
                scheduledTxn.activatedAt = new Date().toISOString();
                scheduledTxn.activatedEarly = true;

                // Create the actual transaction
                const actualTransaction = {
                    ...scheduledTxn,
                    id: undefined, // Let addTransaction generate new ID
                    isScheduled: false,
                    scheduledTransactionId: scheduledTxn.id,
                    date: new Date().toISOString().split('T')[0] // Use today's date
                };

                addTransaction(actualTransaction);
            }

            return updated;
        });
    }, [setScheduledTransactions, addTransaction]);

    /**
     * Delete scheduled transaction
     */
    const deleteScheduledTransaction = useCallback((scheduledTransactionId, deleteScope = 'this_only') => {
        setScheduledTransactions(prev => {
            if (deleteScope === 'this_only') {
                return prev.filter(txn => txn.id !== scheduledTransactionId);
            } else if (deleteScope === 'all_future') {
                const targetTransaction = prev.find(txn => txn.id === scheduledTransactionId);
                if (!targetTransaction) return prev;

                return prev.filter(txn => {
                    // Remove this transaction and all future ones with same parent
                    if (txn.recurringPattern?.parentBudgetItemId === targetTransaction.recurringPattern?.parentBudgetItemId &&
                        new Date(txn.scheduledDate) >= new Date(targetTransaction.scheduledDate)) {
                        return false;
                    }
                    return true;
                });
            }
            return prev;
        });
    }, [setScheduledTransactions]);

    // Auto-activate scheduled transactions at midnight (run on component mount and daily)
    useEffect(() => {
        activateScheduledTransactions();

        // Set up daily check at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
            activateScheduledTransactions();

            // Set up daily interval after first midnight activation
            const intervalId = setInterval(activateScheduledTransactions, 24 * 60 * 60 * 1000);

            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [activateScheduledTransactions]);

    return {
        scheduledTransactions,
        createScheduledTransactionsFromBudgetItem,
        addScheduledTransactions,
        activateScheduledTransactions,
        getUpcomingScheduledTransactions,
        getNewlyActivatedTransactions,
        clearNewlyActivatedFlag,
        editScheduledTransaction,
        skipScheduledTransaction,
        activateScheduledTransactionEarly,
        deleteScheduledTransaction
    };
};
