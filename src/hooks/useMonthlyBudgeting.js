// src/hooks/useMonthlyBudgeting.js
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing monthly budget data
 * Implements YNAB-style monthly budgeting with carry forward functionality
 */
export const useMonthlyBudgeting = (categories = [], transactions = []) => {
    // Monthly budget data structure:
    // {
    //   "2025-01": {
    //     categories: {
    //       1: { allocated: 500, carryForward: 0 },
    //       2: { allocated: 200, carryForward: 50 }
    //     },
    //     toBeBudgeted: 1000 // Available money for this month
    //   }
    // }
    const [monthlyBudgets, setMonthlyBudgets] = useLocalStorage('budgetCalc_monthlyBudgets', {});

    /**
     * Get current month string in YYYY-MM format
     */
    const getCurrentMonth = useCallback(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    /**
     * Get previous month string
     */
    const getPreviousMonth = useCallback((monthString) => {
        const [year, month] = monthString.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1); // month - 2 because month is 1-indexed but Date expects 0-indexed
        return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    /**
     * Initialize a month's budget data if it doesn't exist
     */
    const initializeMonth = useCallback((monthString) => {
        setMonthlyBudgets(prev => {
            if (prev[monthString]) {
                return prev; // Month already exists
            }

            const newMonth = {
                categories: {},
                toBeBudgeted: 0
            };

            // Initialize all categories for this month
            categories.forEach(category => {
                newMonth.categories[category.id] = {
                    allocated: 0,
                    carryForward: 0
                };
            });

            return {
                ...prev,
                [monthString]: newMonth
            };
        });
    }, [categories, setMonthlyBudgets]);

    /**
     * Get budget data for a specific month
     */
    const getMonthBudget = useCallback((monthString) => {
        const monthBudget = monthlyBudgets[monthString];
        if (!monthBudget) {
            // Return empty structure if month doesn't exist (don't initialize during render)
            return {
                categories: {},
                toBeBudgeted: 0
            };
        }
        return monthBudget;
    }, [monthlyBudgets]);

    /**
     * Calculate spending for a specific month and category
     */
    const getMonthlySpending = useCallback((monthString, categoryId) => {
        const [year, month] = monthString.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        return transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const isInMonth = transactionDate >= monthStart && transactionDate <= monthEnd;

                // Check if transaction affects this category
                if (transaction.isSplit && transaction.splits) {
                    return isInMonth && transaction.splits.some(split =>
                        split.categoryId === categoryId && split.amount < 0
                    );
                } else {
                    return isInMonth && transaction.categoryId === categoryId && transaction.amount < 0;
                }
            })
            .reduce((total, transaction) => {
                if (transaction.isSplit && transaction.splits) {
                    const categorySpending = transaction.splits
                        .filter(split => split.categoryId === categoryId && split.amount < 0)
                        .reduce((sum, split) => sum + Math.abs(split.amount), 0);
                    return total + categorySpending;
                } else {
                    return total + Math.abs(transaction.amount);
                }
            }, 0);
    }, [transactions]);

    /**
     * Calculate income for a specific month
     */
    const getMonthlyIncome = useCallback((monthString) => {
        const [year, month] = monthString.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        return transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const isInMonth = transactionDate >= monthStart && transactionDate <= monthEnd;
                // Income transactions are positive amounts without categories (or with income categories)
                return isInMonth && transaction.amount > 0 && !transaction.transferAccountId;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
    }, [transactions]);

    /**
     * Get comprehensive month data including calculated fields
     */
    const getMonthData = useCallback((monthString) => {
        const monthBudget = getMonthBudget(monthString);
        const monthlyIncome = getMonthlyIncome(monthString);

        // Calculate totals
        let totalAllocated = 0;
        let totalSpent = 0;
        let totalCarryForward = 0;

        const categoriesWithData = categories.map(category => {
            const categoryBudget = monthBudget.categories[category.id] || { allocated: 0, carryForward: 0 };
            const spent = getMonthlySpending(monthString, category.id);
            const allocated = categoryBudget.allocated;
            const carryForward = categoryBudget.carryForward;
            const available = allocated + carryForward - spent;

            totalAllocated += allocated;
            totalSpent += spent;
            totalCarryForward += carryForward;

            return {
                ...category,
                allocated,
                spent,
                available,
                carryForward
            };
        });

        // Calculate "To Be Budgeted"
        const toBeBudgeted = monthlyIncome + totalCarryForward - totalAllocated;

        return {
            monthString,
            categories: categoriesWithData,
            summary: {
                income: monthlyIncome,
                allocated: totalAllocated,
                spent: totalSpent,
                carryForward: totalCarryForward,
                toBeBudgeted,
                remaining: toBeBudgeted // In YNAB, "remaining" is the same as "to be budgeted"
            }
        };
    }, [categories, getMonthBudget, getMonthlyIncome, getMonthlySpending]);

    /**
     * Allocate money to a category for a specific month
     */
    const allocateToCategory = useCallback((monthString, categoryId, amount) => {
        initializeMonth(monthString);

        setMonthlyBudgets(prev => {
            const monthBudget = prev[monthString] || { categories: {}, toBeBudgeted: 0 };
            const categoryBudget = monthBudget.categories[categoryId] || { allocated: 0, carryForward: 0 };

            return {
                ...prev,
                [monthString]: {
                    ...monthBudget,
                    categories: {
                        ...monthBudget.categories,
                        [categoryId]: {
                            ...categoryBudget,
                            allocated: amount
                        }
                    }
                }
            };
        });
    }, [initializeMonth, setMonthlyBudgets]);

    /**
     * Carry forward unspent money from previous month
     */
    const carryForwardFromPreviousMonth = useCallback((monthString) => {
        const previousMonth = getPreviousMonth(monthString);
        const previousMonthData = getMonthData(previousMonth);

        initializeMonth(monthString);

        setMonthlyBudgets(prev => {
            const monthBudget = prev[monthString] || { categories: {}, toBeBudgeted: 0 };
            const updatedCategories = { ...monthBudget.categories };

            // Carry forward unspent amounts for each category
            previousMonthData.categories.forEach(category => {
                const unspentAmount = Math.max(0, category.available); // Only carry forward positive amounts

                updatedCategories[category.id] = {
                    ...(updatedCategories[category.id] || { allocated: 0, carryForward: 0 }),
                    carryForward: unspentAmount
                };
            });

            return {
                ...prev,
                [monthString]: {
                    ...monthBudget,
                    categories: updatedCategories
                }
            };
        });

        console.log(`Carried forward unspent amounts from ${previousMonth} to ${monthString}`);
    }, [getPreviousMonth, getMonthData, initializeMonth, setMonthlyBudgets]);

    /**
     * Auto-carry forward for current month if not already done
     */
    const autoCarryForwardIfNeeded = useCallback((monthString) => {
        const monthBudget = getMonthBudget(monthString);
        const hasCarryForward = Object.values(monthBudget.categories).some(cat => cat.carryForward > 0);

        if (!hasCarryForward) {
            carryForwardFromPreviousMonth(monthString);
        }
    }, [getMonthBudget, carryForwardFromPreviousMonth]);

    /**
     * Get available months (months with data or current/future months)
     */
    const getAvailableMonths = useCallback(() => {
        const months = [];
        const now = new Date();

        // Get months with existing data
        const existingMonths = Object.keys(monthlyBudgets);

        // Generate range from 6 months ago to 6 months in future
        for (let i = -6; i <= 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            months.push({ value, label });
        }

        // Add any existing months that aren't in the range
        existingMonths.forEach(monthString => {
            if (!months.find(m => m.value === monthString)) {
                const [year, month] = monthString.split('-').map(Number);
                const date = new Date(year, month - 1, 1);
                const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                months.push({ value: monthString, label });
            }
        });

        // Sort months chronologically
        months.sort((a, b) => a.value.localeCompare(b.value));

        return months;
    }, [monthlyBudgets]);

    /**
     * Initialize current month on first load
     */
    const currentMonth = getCurrentMonth();
    const currentMonthData = useMemo(() => {
        return getMonthData(currentMonth);
    }, [currentMonth, getMonthData]);

    return {
        // Data getters
        getCurrentMonth,
        getMonthData,
        getMonthBudget,
        getAvailableMonths,
        currentMonthData,

        // Actions
        allocateToCategory,
        carryForwardFromPreviousMonth,
        autoCarryForwardIfNeeded,
        initializeMonth,

        // Utilities
        getMonthlySpending,
        getMonthlyIncome,
        getPreviousMonth
    };
};
