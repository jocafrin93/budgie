// src/hooks/useMonthlyBudgeting.js
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook for managing month-to-month YNAB-style budgeting
 * Extends existing envelope budgeting with monthly periods
 */
export const useMonthlyBudgeting = ({
    categories = [],
    setCategories,
    planningItems = [],
    transactions = [],
    accounts = []
} = {}) => {

    // Current budget month state (YYYY-MM format)
    const [currentBudgetMonth, setCurrentBudgetMonth] = useLocalStorage(
        'budgetCalc_currentBudgetMonth',
        getCurrentMonthKey()
    );

    // Monthly budget data: { "2025-06": { categoryId: { allocated: 500, notes: "..." }, ... } }
    const [monthlyBudgets, setMonthlyBudgets] = useLocalStorage('budgetCalc_monthlyBudgets', {});

    // Monthly category balances: { "2025-06": { categoryId: { available: 450, carryover: 50 }, ... } }
    const [monthlyBalances, setMonthlyBalances] = useLocalStorage('budgetCalc_monthlyBalances', {});

    // Budget month settings and metadata
    const [budgetMonthSettings, setBudgetMonthSettings] = useLocalStorage('budgetCalc_monthSettings', {
        autoCarryover: true, // Automatically carry positive balances forward
        warnOnOverspend: true, // Show warnings for overspending
        showFutureMonths: 3 // How many future months to show in navigation
    });

    /**
     * Get current month in YYYY-MM format
     */
    function getCurrentMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    /**
     * Get month display name from month key
     */
    const getMonthDisplayName = useCallback((monthKey) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, []);

    /**
     * Navigate to different budget months
     */
    const navigateToMonth = useCallback((monthKey) => {
        setCurrentBudgetMonth(monthKey);
    }, [setCurrentBudgetMonth]);

    const navigateToNextMonth = useCallback(() => {
        const [year, month] = currentBudgetMonth.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonthKey = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
        setCurrentBudgetMonth(nextMonthKey);
    }, [currentBudgetMonth, setCurrentBudgetMonth]);

    const navigateToPrevMonth = useCallback(() => {
        const [year, month] = currentBudgetMonth.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
        setCurrentBudgetMonth(prevMonthKey);
    }, [currentBudgetMonth, setCurrentBudgetMonth]);

    /**
     * Get available months for navigation
     */
    const getAvailableMonths = useCallback(() => {
        const months = [];
        const currentDate = new Date();

        // Add past months (up to 12 months back)
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                key: monthKey,
                display: getMonthDisplayName(monthKey),
                isPast: i > 0,
                isCurrent: i === 0
            });
        }

        // Add future months
        for (let i = 1; i <= budgetMonthSettings.showFutureMonths; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.push({
                key: monthKey,
                display: getMonthDisplayName(monthKey),
                isFuture: true
            });
        }

        return months;
    }, [budgetMonthSettings.showFutureMonths, getMonthDisplayName]);

    /**
     * Check if current month is in the future (YNAB-style behavior)
     */
    const isCurrentMonthFuture = useCallback(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 0-based to 1-based
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        return currentBudgetMonth > currentMonthKey;
    }, [currentBudgetMonth]);

    /**
     * Calculate uncovered overspending from previous months (YNAB-style)
     */
    const calculateUncoveredOverspending = useCallback(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        let totalUncoveredOverspending = 0;

        // Check all months before current month
        Object.keys(monthlyBudgets).forEach(monthKey => {
            if (monthKey >= currentMonthKey) return; // Skip current and future months

            const monthBudgets = monthlyBudgets[monthKey] || {};
            const monthBalances = monthlyBalances[monthKey] || {};

            // Check each category in that month
            Object.keys(monthBudgets).forEach(categoryId => {
                const allocated = monthBudgets[categoryId]?.allocated || 0;
                const available = monthBalances[categoryId]?.available || allocated;

                // Calculate spending for that month
                const [year, month] = monthKey.split('-').map(Number);
                const monthTransactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return t.categoryId === parseInt(categoryId) &&
                        transactionDate.getFullYear() === year &&
                        transactionDate.getMonth() + 1 === month &&
                        t.amount < 0;
                });

                const spent = monthTransactions.reduce((total, t) => total + Math.abs(t.amount), 0);
                const overspent = Math.max(0, spent - available);

                if (overspent > 0) {
                    totalUncoveredOverspending += overspent;
                }
            });
        });

        return totalUncoveredOverspending;
    }, [monthlyBudgets, monthlyBalances, transactions]);

    /**
     * Get current month's budget data
     */
    const getCurrentMonthBudget = useCallback(() => {
        return monthlyBudgets[currentBudgetMonth] || {};
    }, [monthlyBudgets, currentBudgetMonth]);

    /**
     * Get current month's balance data
     */
    const getCurrentMonthBalances = useCallback(() => {
        return monthlyBalances[currentBudgetMonth] || {};
    }, [monthlyBalances, currentBudgetMonth]);

    /**
     * Allocate money to a category for the current month
     */
    const allocateToCategory = useCallback((categoryId, amount, notes = '') => {
        const validatedAmount = parseFloat(amount) || 0;

        setMonthlyBudgets(prev => ({
            ...prev,
            [currentBudgetMonth]: {
                ...prev[currentBudgetMonth],
                [categoryId]: {
                    allocated: (prev[currentBudgetMonth]?.[categoryId]?.allocated || 0) + validatedAmount,
                    notes: notes || prev[currentBudgetMonth]?.[categoryId]?.notes || ''
                }
            }
        }));

        // Update available balance
        setMonthlyBalances(prev => ({
            ...prev,
            [currentBudgetMonth]: {
                ...prev[currentBudgetMonth],
                [categoryId]: {
                    ...prev[currentBudgetMonth]?.[categoryId],
                    available: (prev[currentBudgetMonth]?.[categoryId]?.available || 0) + validatedAmount
                }
            }
        }));

        // Also update the main categories for backward compatibility
        setCategories(prev => prev.map(cat =>
            cat.id === categoryId
                ? {
                    ...cat,
                    allocated: (cat.allocated || 0) + validatedAmount,
                    available: (cat.available || 0) + validatedAmount
                }
                : cat
        ));
    }, [currentBudgetMonth, setMonthlyBudgets, setMonthlyBalances, setCategories]);

    /**
     * Move money between categories within the current month
     */
    const moveMoney = useCallback((fromCategoryId, toCategoryId, amount) => {
        const validatedAmount = parseFloat(amount) || 0;

        // Check if source category has enough available
        const currentBalances = getCurrentMonthBalances();
        const fromAvailable = currentBalances[fromCategoryId]?.available || 0;

        if (fromAvailable < validatedAmount) {
            throw new Error(`Insufficient funds in source category. Available: $${fromAvailable.toFixed(2)}`);
        }

        setMonthlyBalances(prev => ({
            ...prev,
            [currentBudgetMonth]: {
                ...prev[currentBudgetMonth],
                [fromCategoryId]: {
                    ...prev[currentBudgetMonth]?.[fromCategoryId],
                    available: fromAvailable - validatedAmount
                },
                [toCategoryId]: {
                    ...prev[currentBudgetMonth]?.[toCategoryId],
                    available: (prev[currentBudgetMonth]?.[toCategoryId]?.available || 0) + validatedAmount
                }
            }
        }));

        // Update main categories
        setCategories(prev => prev.map(cat => {
            if (cat.id === fromCategoryId) {
                return { ...cat, available: (cat.available || 0) - validatedAmount };
            }
            if (cat.id === toCategoryId) {
                return { ...cat, available: (cat.available || 0) + validatedAmount };
            }
            return cat;
        }));
    }, [currentBudgetMonth, getCurrentMonthBalances, setMonthlyBalances, setCategories]);

    /**
     * Calculate total available to allocate for current month
     */
    const calculateMonthlyToBeAllocated = useCallback(() => {
        // Total account balances
        const totalAccountBalance = accounts.reduce((total, account) => {
            return total + (account.balance || 0);
        }, 0);

        // Total allocated this month across all categories
        const currentBudget = getCurrentMonthBudget();
        const totalAllocatedThisMonth = Object.values(currentBudget).reduce((total, catBudget) => {
            return total + (catBudget.allocated || 0);
        }, 0);

        return totalAccountBalance - totalAllocatedThisMonth;
    }, [accounts, getCurrentMonthBudget]);

    /**
     * Auto-carry forward balances from previous month (YNAB-style)
     * This happens automatically when viewing a new month
     */
    const carryForwardBalances = useCallback((targetMonth = currentBudgetMonth) => {
        const [year, month] = targetMonth.split('-').map(Number);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

        const prevMonthBalances = monthlyBalances[prevMonthKey] || {};
        const prevMonthBudgets = monthlyBudgets[prevMonthKey] || {};

        if (Object.keys(prevMonthBalances).length === 0 && Object.keys(prevMonthBudgets).length === 0) return;

        // Calculate what should carry forward from previous month
        const carryforwardAmounts = {};

        // Get all categories that had money in previous month
        const allPrevCategories = new Set([
            ...Object.keys(prevMonthBalances),
            ...Object.keys(prevMonthBudgets)
        ]);

        allPrevCategories.forEach(categoryId => {
            const prevAllocated = prevMonthBudgets[categoryId]?.allocated || 0;
            const prevAvailable = prevMonthBalances[categoryId]?.available || prevAllocated;

            // Calculate spending in previous month
            const [prevYear, prevMonth] = prevMonthKey.split('-').map(Number);
            const prevMonthTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return t.categoryId === parseInt(categoryId) &&
                    transactionDate.getFullYear() === prevYear &&
                    transactionDate.getMonth() + 1 === prevMonth &&
                    t.amount < 0;
            });

            const prevMonthSpent = prevMonthTransactions.reduce((total, t) => total + Math.abs(t.amount), 0);
            const netAmount = prevAvailable - prevMonthSpent;

            // YNAB Rule: Only positive balances carry forward
            // Negative balances (overspending) reduce overall "To Be Allocated" instead
            if (netAmount > 0) {
                carryforwardAmounts[categoryId] = netAmount;
            }
            // If netAmount < 0, the overspending is handled by calculateUncoveredOverspending()
        });

        // Update current month balances with carryforward
        setMonthlyBalances(prev => ({
            ...prev,
            [targetMonth]: {
                ...prev[targetMonth],
                ...Object.entries(carryforwardAmounts).reduce((acc, [catId, amount]) => {
                    acc[catId] = {
                        ...prev[targetMonth]?.[catId],
                        available: (prev[targetMonth]?.[catId]?.available || 0) + amount,
                        carryover: amount
                    };
                    return acc;
                }, {})
            }
        }));

        return carryforwardAmounts;
    }, [monthlyBalances, monthlyBudgets, transactions]);

    /**
     * Auto-carryforward when navigating to a new month (YNAB behavior)
     */
    const navigateToMonthWithCarryover = useCallback((monthKey) => {
        setCurrentBudgetMonth(monthKey);

        // Check if this month needs carryforward (hasn't been set up yet)
        const targetMonthBalances = monthlyBalances[monthKey] || {};
        const hasExistingData = Object.keys(targetMonthBalances).length > 0;

        if (!hasExistingData) {
            // Automatically carry forward from previous month
            setTimeout(() => {
                carryForwardBalances(monthKey);
            }, 100); // Small delay to ensure state has updated
        }
    }, [setCurrentBudgetMonth, monthlyBalances, carryForwardBalances]);

    /**
     * Get category's month-specific data (YNAB-style)
     */
    const getCategoryMonthData = useCallback((categoryId) => {
        const budget = getCurrentMonthBudget()[categoryId] || { allocated: 0, notes: '' };
        const balance = getCurrentMonthBalances()[categoryId] || { available: 0, carryover: 0 };

        // For future months, only show allocated amounts, no carryover or spending
        if (isCurrentMonthFuture()) {
            return {
                allocated: budget.allocated,
                available: budget.allocated, // In future months, available = allocated (no spending yet)
                spent: 0, // No spending in future months
                remaining: budget.allocated, // Same as available
                carryover: 0, // No carryover from future
                notes: budget.notes,
                isOverspent: false // Can't overspend in future
            };
        }

        // For current/past months, calculate spent this month from transactions
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const [year, month] = currentBudgetMonth.split('-').map(Number);
            return t.categoryId === categoryId &&
                transactionDate.getFullYear() === year &&
                transactionDate.getMonth() + 1 === month &&
                t.amount < 0; // Only outgoing transactions
        });

        const spentThisMonth = monthTransactions.reduce((total, t) => total + Math.abs(t.amount), 0);

        return {
            allocated: budget.allocated,
            available: balance.available,
            carryover: balance.carryover || 0,
            spent: spentThisMonth,
            remaining: balance.available - spentThisMonth,
            notes: budget.notes,
            isOverspent: (balance.available - spentThisMonth) < 0
        };
    }, [getCurrentMonthBudget, getCurrentMonthBalances, transactions, currentBudgetMonth, isCurrentMonthFuture]);

    /**
     * Get month summary statistics (YNAB-style)
     */
    const getMonthSummary = useMemo(() => {
        const budget = getCurrentMonthBudget();
        const balances = getCurrentMonthBalances();

        const totalAllocated = Object.values(budget).reduce((sum, cat) => sum + (cat.allocated || 0), 0);

        // For future months, available = allocated (no carryover, no spending)
        if (isCurrentMonthFuture()) {
            return {
                allocated: totalAllocated,
                available: totalAllocated,
                carryover: 0,
                spent: 0,
                remaining: totalAllocated,
                toBeAllocated: calculateMonthlyToBeAllocated()
            };
        }

        // For current/past months, calculate normally
        const totalAvailable = Object.values(balances).reduce((sum, cat) => sum + (cat.available || 0), 0);
        const totalCarryover = Object.values(balances).reduce((sum, cat) => sum + (cat.carryover || 0), 0);

        // Calculate spent this month
        const [year, month] = currentBudgetMonth.split('-').map(Number);
        const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === year &&
                transactionDate.getMonth() + 1 === month &&
                t.amount < 0;
        });
        const totalSpent = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            allocated: totalAllocated,
            available: totalAvailable,
            carryover: totalCarryover,
            spent: totalSpent,
            remaining: totalAvailable - totalSpent,
            toBeAllocated: calculateMonthlyToBeAllocated()
        };
    }, [getCurrentMonthBudget, getCurrentMonthBalances, transactions, currentBudgetMonth, calculateMonthlyToBeAllocated, isCurrentMonthFuture]);

    return {
        // Month navigation
        currentBudgetMonth,
        setCurrentBudgetMonth,
        getMonthDisplayName,
        navigateToMonth: navigateToMonthWithCarryover, // Use carryover version
        navigateToNextMonth,
        navigateToPrevMonth,
        getAvailableMonths,

        // Budget operations
        allocateToCategory,
        moveMoney,
        calculateMonthlyToBeAllocated,
        carryForwardBalances,

        // Data access
        getCurrentMonthBudget,
        getCurrentMonthBalances,
        getCategoryMonthData,
        getMonthSummary,
        calculateUncoveredOverspending, // NEW: For debugging/display

        // Settings
        budgetMonthSettings,
        setBudgetMonthSettings,

        // Storage state
        monthlyBudgets,
        monthlyBalances
    };
};