// FIXED VERSION of useBudgetCalculations.js
import { useMemo } from 'react';

export const useBudgetCalculations = ({
    expenses = [],
    savingsGoals = [],
    currentPay = 0,
    roundingOption = 0,
    bufferPercentage = 0,
    frequencyOptions = [],
}) => {
    const calculations = useMemo(() => {
        // Validate inputs
        if (!Array.isArray(expenses) || !Array.isArray(savingsGoals) || !Array.isArray(frequencyOptions)) {
            console.warn('Invalid input arrays to useBudgetCalculations');
            return getEmptyCalculations();
        }

        if (currentPay <= 0) {
            console.warn('Invalid currentPay:', currentPay);
            return getEmptyCalculations();
        }

        const calculateBiweeklyAllocation = (expense) => {
            // Validate expense object
            if (!expense || typeof expense !== 'object') {
                console.warn('Invalid expense object:', expense);
                return 0;
            }

            // Check required fields and convert to numbers
            const amount = parseFloat(expense.amount) || 0;
            const frequency = expense.frequency;
            const alreadySaved = parseFloat(expense.alreadySaved) || 0;

            if (amount <= 0) {
                console.warn(`Invalid amount for expense ${expense.name}:`, expense.amount);
                return 0;
            }

            if (!frequency) {
                console.warn(`Missing frequency for expense ${expense.name}`);
                return 0;
            }

            // Skip if paused or complete
            if (expense.priorityState === 'paused' || expense.priorityState === 'complete') {
                return 0;
            }

            const remainingAmount = Math.max(0, amount - alreadySaved);

            if (remainingAmount <= 0) return 0;

            // Handle per-paycheck frequency
            if (frequency === 'per-paycheck') {
                if (roundingOption === 0) return remainingAmount;
                return Math.ceil(remainingAmount / roundingOption) * roundingOption;
            }

            // Find frequency data
            const freqData = frequencyOptions.find(f => f && f.value === frequency);
            if (!freqData || !freqData.weeksPerYear || freqData.weeksPerYear <= 0) {
                console.warn(`Invalid frequency data for ${frequency}:`, freqData);
                return 0;
            }

            const yearlyAmount = amount * freqData.weeksPerYear;
            const biweeklyAmount = yearlyAmount / 26;
            const adjustedBiweeklyAmount = (remainingAmount / amount) * biweeklyAmount;

            if (!isFinite(adjustedBiweeklyAmount) || adjustedBiweeklyAmount < 0) {
                console.warn(`Invalid calculation result for ${expense.name}:`, adjustedBiweeklyAmount);
                return 0;
            }

            if (roundingOption === 0) return adjustedBiweeklyAmount;
            return Math.ceil(adjustedBiweeklyAmount / roundingOption) * roundingOption;
        };

        const calculateGoalBiweeklyAllocation = (goal) => {
            // Validate goal object
            if (!goal || typeof goal !== 'object') {
                console.warn('Invalid goal object:', goal);
                return 0;
            }

            // Check required fields and convert to numbers
            const targetAmount = parseFloat(goal.targetAmount) || 0;
            const monthlyContribution = parseFloat(goal.monthlyContribution) || 0;
            const alreadySaved = parseFloat(goal.alreadySaved) || 0;

            if (targetAmount <= 0) {
                console.warn(`Invalid targetAmount for goal ${goal.name}:`, goal.targetAmount);
                return 0;
            }

            if (monthlyContribution <= 0) {
                console.warn(`Invalid monthlyContribution for goal ${goal.name}:`, goal.monthlyContribution);
                return 0;
            }

            // Skip if paused or complete
            if (goal.priorityState === 'paused' || goal.priorityState === 'complete') {
                return 0;
            }

            const remainingAmount = Math.max(0, targetAmount - alreadySaved);

            if (remainingAmount <= 0) return 0;

            const biweeklyAmount = (monthlyContribution * 12) / 26;

            if (!isFinite(biweeklyAmount) || biweeklyAmount < 0) {
                console.warn(`Invalid calculation result for goal ${goal.name}:`, biweeklyAmount);
                return 0;
            }

            if (roundingOption === 0) return biweeklyAmount;
            return Math.ceil(biweeklyAmount / roundingOption) * roundingOption;
        };

        // Process expenses with error handling
        const expenseAllocations = expenses.map(expense => {
            try {
                const biweeklyAmount = calculateBiweeklyAllocation(expense);
                const amount = parseFloat(expense.amount) || 0;
                const alreadySaved = parseFloat(expense.alreadySaved) || 0;
                const remainingNeeded = Math.max(0, amount - alreadySaved);
                const fundingProgress = amount > 0 ? (alreadySaved / amount) * 100 : 0;
                const isFullyFunded = fundingProgress >= 100;

                return {
                    ...expense,
                    biweeklyAmount,
                    percentage: currentPay > 0 ? (biweeklyAmount / currentPay) * 100 : 0,
                    remainingNeeded,
                    fundingProgress,
                    isFullyFunded,
                };
            } catch (error) {
                console.error(`Error processing expense ${expense?.name}:`, error);
                return {
                    ...expense,
                    biweeklyAmount: 0,
                    percentage: 0,
                    remainingNeeded: 0,
                    fundingProgress: 0,
                    isFullyFunded: false,
                };
            }
        });

        // Process goals with error handling
        const goalAllocations = savingsGoals.map(goal => {
            try {
                const biweeklyAmount = calculateGoalBiweeklyAllocation(goal);
                const targetAmount = parseFloat(goal.targetAmount) || 0;
                const alreadySaved = parseFloat(goal.alreadySaved) || 0;
                const remainingNeeded = Math.max(0, targetAmount - alreadySaved);
                const fundingProgress = targetAmount > 0 ? (alreadySaved / targetAmount) * 100 : 0;
                const isFullyFunded = fundingProgress >= 100;

                return {
                    ...goal,
                    biweeklyAmount,
                    percentage: currentPay > 0 ? (biweeklyAmount / currentPay) * 100 : 0,
                    remainingNeeded,
                    fundingProgress,
                    isFullyFunded,
                };
            } catch (error) {
                console.error(`Error processing goal ${goal?.name}:`, error);
                return {
                    ...goal,
                    biweeklyAmount: 0,
                    percentage: 0,
                    remainingNeeded: 0,
                    fundingProgress: 0,
                    isFullyFunded: false,
                };
            }
        });

        const totalExpenseAllocation = expenseAllocations.reduce((sum, exp) => sum + (exp.biweeklyAmount || 0), 0);
        const totalGoalAllocation = goalAllocations.reduce((sum, goal) => sum + (goal.biweeklyAmount || 0), 0);
        const totalBiweeklyAllocation = totalExpenseAllocation + totalGoalAllocation;

        const bufferAmount = totalBiweeklyAllocation * (bufferPercentage / 100);
        const totalWithBuffer = totalBiweeklyAllocation + bufferAmount;
        const remainingIncome = currentPay - totalWithBuffer;
        const allocationPercentage = currentPay > 0 ? (totalWithBuffer / currentPay) * 100 : 0;

        // Calculate categorized expenses
        const categorizedExpenses = expenses.reduce((acc, expense) => {
            const expenseData = expenseAllocations.find(e => e.id === expense.id);
            if (!expenseData) return acc;

            const categoryId = expense.categoryId;
            if (!acc[categoryId]) {
                acc[categoryId] = {
                    expenses: [],
                    goals: [],
                    total: 0,
                    percentage: 0,
                };
            }

            acc[categoryId].expenses.push(expenseData);
            acc[categoryId].total += expenseData.biweeklyAmount || 0;

            return acc;
        }, {});

        // Add goals to categorized expenses
        savingsGoals.forEach(goal => {
            const goalData = goalAllocations.find(g => g.id === goal.id);
            if (!goalData) return;

            const categoryId = goal.categoryId;
            if (!categorizedExpenses[categoryId]) {
                categorizedExpenses[categoryId] = {
                    expenses: [],
                    goals: [],
                    total: 0,
                    percentage: 0,
                };
            }

            categorizedExpenses[categoryId].goals.push(goalData);
            categorizedExpenses[categoryId].total += goalData.biweeklyAmount || 0;
        });

        // Calculate percentages for categories
        Object.keys(categorizedExpenses).forEach(categoryId => {
            const category = categorizedExpenses[categoryId];
            category.percentage = currentPay > 0 ? (category.total / currentPay) * 100 : 0;
        });

        return {
            expenseAllocations,
            goalAllocations,
            totalExpenseAllocation,
            totalGoalAllocation,
            totalBiweeklyAllocation,
            bufferAmount,
            totalWithBuffer,
            remainingIncome,
            allocationPercentage,
            categorizedExpenses,
        };
    }, [expenses, savingsGoals, currentPay, roundingOption, bufferPercentage, frequencyOptions]);

    return calculations;
};

// Helper function for empty calculations
function getEmptyCalculations() {
    return {
        expenseAllocations: [],
        goalAllocations: [],
        totalExpenseAllocation: 0,
        totalGoalAllocation: 0,
        totalBiweeklyAllocation: 0,
        bufferAmount: 0,
        totalWithBuffer: 0,
        remainingIncome: 0,
        allocationPercentage: 0,
        categorizedExpenses: {},
    };
}

