import { useMemo } from 'react';
import { usePaycheckTimeline } from './usePaycheckTimeline';

export const useBudgetCalculations = ({
    expenses,
    savingsGoals,
    currentPay,
    roundingOption,
    bufferPercentage,
    frequencyOptions,
    paySchedule,
    accounts,
}) => {
    const calculations = useMemo(() => {
        const calculateBiweeklyAllocation = (expense) => {
            if (expense.priorityState === 'paused' || expense.priorityState === 'complete') return 0;

            const { amount, frequency, alreadySaved = 0 } = expense;
            const remainingAmount = Math.max(0, amount - alreadySaved);

            if (remainingAmount <= 0) return 0;

            if (frequency === 'per-paycheck') {
                if (roundingOption === 0) return remainingAmount;
                return Math.ceil(remainingAmount / roundingOption) * roundingOption;
            }

            const freqData = frequencyOptions.find(f => f.value === frequency);
            if (!freqData) return 0;

            const yearlyAmount = amount * freqData.weeksPerYear;
            const biweeklyAmount = yearlyAmount / 26;
            const adjustedBiweeklyAmount = (remainingAmount / amount) * biweeklyAmount;

            if (roundingOption === 0) return adjustedBiweeklyAmount;
            return Math.ceil(adjustedBiweeklyAmount / roundingOption) * roundingOption;
        };

        const calculateGoalBiweeklyAllocation = (goal) => {
            if (goal.priorityState === 'paused' || goal.priorityState === 'complete') return 0;

            const { targetAmount, monthlyContribution, alreadySaved = 0 } = goal;
            const remainingAmount = Math.max(0, targetAmount - alreadySaved);

            if (remainingAmount <= 0) return 0;

            const monthlyAmount = monthlyContribution;
            const biweeklyAmount = (monthlyAmount * 12) / 26;

            if (roundingOption === 0) return biweeklyAmount;
            return Math.ceil(biweeklyAmount / roundingOption) * roundingOption;
        };

        const expenseAllocations = expenses.map(expense => {
            const biweeklyAmount = calculateBiweeklyAllocation(expense);
            const remainingNeeded = Math.max(0, expense.amount - (expense.alreadySaved || 0));
            const fundingProgress = expense.amount > 0
                ? ((expense.alreadySaved || 0) / expense.amount) * 100
                : 0;
            const isFullyFunded = fundingProgress >= 100;

            return {
                ...expense,
                biweeklyAmount,
                percentage: (biweeklyAmount / currentPay) * 100,
                remainingNeeded,
                fundingProgress,
                isFullyFunded,
            };
        });

        const goalAllocations = savingsGoals.map(goal => {
            const biweeklyAmount = calculateGoalBiweeklyAllocation(goal);
            const remainingNeeded = Math.max(0, goal.targetAmount - (goal.alreadySaved || 0));
            const fundingProgress = goal.targetAmount > 0
                ? ((goal.alreadySaved || 0) / goal.targetAmount) * 100
                : 0;
            const isFullyFunded = fundingProgress >= 100;

            return {
                ...goal,
                biweeklyAmount,
                percentage: (biweeklyAmount / currentPay) * 100,
                remainingNeeded,
                fundingProgress,
                isFullyFunded,
            };
        });

        const totalExpenseAllocation = expenseAllocations.reduce((sum, exp) => sum + exp.biweeklyAmount, 0);
        const totalGoalAllocation = goalAllocations.reduce((sum, goal) => sum + goal.biweeklyAmount, 0);
        const totalBiweeklyAllocation = totalExpenseAllocation + totalGoalAllocation;

        const bufferAmount = totalBiweeklyAllocation * (bufferPercentage / 100);
        const totalWithBuffer = totalBiweeklyAllocation + bufferAmount;
        const remainingIncome = currentPay - totalWithBuffer;
        const allocationPercentage = (totalWithBuffer / currentPay) * 100;

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
            acc[categoryId].total += expenseData.biweeklyAmount;

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
            categorizedExpenses[categoryId].total += goalData.biweeklyAmount;
        });

        // Calculate percentages for categories
        Object.keys(categorizedExpenses).forEach(categoryId => {
            const category = categorizedExpenses[categoryId];
            category.percentage = (category.total / currentPay) * 100;
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

    // Always call the hook, but handle missing data inside it
    const timelineData = usePaycheckTimeline({
        expenses,
        savingsGoals,
        paySchedule,
        accounts,
        expenseAllocations: calculations.expenseAllocations,
        goalAllocations: calculations.goalAllocations,
    });

    return {
        ...calculations,
        timelines: timelineData,
    };
};