// src/hooks/useExpenseAllocations.js
import { useMemo } from 'react';
import { getExpensesFromPlanningItems } from '../utils/dataModelUtils';
import {
  calculateBiweeklyAllocation,
  calculatePercentage
} from '../utils/moneyUtils';
import {
  calculateFundingProgress,
  calculateRemainingNeeded,
  isFullyFunded
} from '../utils/progressUtils';

/**
 * Hook for calculating expense allocations
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.planningItems - Planning items (unified data model)
 * @param {Array} params.activeBudgetAllocations - Active budget allocations (unified data model)
 * @param {Array} params.expenses - Expenses (legacy data model)
 * @param {number} params.currentPay - Current pay amount
 * @param {number} params.roundingOption - Rounding option
 * @param {Array} params.frequencyOptions - Frequency options
 * @returns {Object} Expense allocations and total
 */
export const useExpenseAllocations = ({
  planningItems = [],
  activeBudgetAllocations = [],
  expenses = [],
  currentPay = 0,
  roundingOption = 0,
  frequencyOptions = [],
}) => {
  return useMemo(() => {
    // Determine which data model to use
    const useUnifiedModel = planningItems.length > 0;

    // If using unified model, derive expenses
    const effectiveExpenses = useUnifiedModel
      ? getExpensesFromPlanningItems(planningItems)
      : expenses;

    // Validate inputs
    if (!Array.isArray(effectiveExpenses) || !Array.isArray(frequencyOptions)) {
      console.warn('Invalid input arrays to useExpenseAllocations');
      return { expenseAllocations: [], totalExpenseAllocation: 0 };
    }

    if (currentPay <= 0) {
      console.warn('Invalid currentPay:', currentPay);
      return { expenseAllocations: [], totalExpenseAllocation: 0 };
    }

    // Process expenses with error handling
    const expenseAllocations = effectiveExpenses.map(expense => {
      try {
        // Parse and calculate important values first
        const amount = parseFloat(expense.amount) || 0;
        const alreadySaved = parseFloat(expense.alreadySaved) || 0;
        const remainingNeeded = calculateRemainingNeeded(amount, alreadySaved);
        const fundingProgress = calculateFundingProgress(amount, alreadySaved);
        const fullyFunded = isFullyFunded(fundingProgress);

        // If using unified model and we have active allocations, use those values
        if (useUnifiedModel && activeBudgetAllocations.length > 0) {
          // Find the corresponding planning item
          const planningItem = planningItems.find(item =>
            item.type === 'expense' && item.id === expense.id
          );

          // Find the corresponding allocation
          const allocation = planningItem && planningItem.isActive
            ? activeBudgetAllocations.find(alloc => alloc.planningItemId === expense.id)
            : null;

          // If we have an allocation, use its values, but adjust for remaining needed
          if (allocation) {
            let adjustedBiweeklyAmount = allocation.perPaycheckAmount || 0;

            // If fully funded, set to 0
            if (fullyFunded) {
              adjustedBiweeklyAmount = 0;
            }
            // For partially funded expenses, adjust the per-paycheck amount based on remaining needed
            else if (remainingNeeded < amount) {
              // Calculate the proportion of the original amount that still needs to be funded
              const remainingProportion = remainingNeeded / amount;
              // Scale the per-paycheck amount by this proportion
              adjustedBiweeklyAmount = adjustedBiweeklyAmount * remainingProportion;
            }

            return {
              ...expense,
              biweeklyAmount: adjustedBiweeklyAmount,
              percentage: calculatePercentage(adjustedBiweeklyAmount, currentPay),
              remainingNeeded,
              fundingProgress,
              isFullyFunded: fullyFunded,
            };
          }
        }

        // Fall back to calculating from scratch - use remaining needed instead of total amount
        let biweeklyAmount = 0;

        if (remainingNeeded > 0 && !fullyFunded) {
          // Create a modified expense object with the remaining amount
          const modifiedExpense = {
            ...expense,
            amount: remainingNeeded
          };

          // Calculate biweekly amount based on the remaining needed
          biweeklyAmount = calculateBiweeklyAllocation(modifiedExpense, frequencyOptions, roundingOption);
        }

        return {
          ...expense,
          biweeklyAmount,
          percentage: calculatePercentage(biweeklyAmount, currentPay),
          remainingNeeded,
          fundingProgress,
          isFullyFunded: fullyFunded,
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

    // Calculate total expense allocation
    const totalExpenseAllocation = expenseAllocations.reduce(
      (sum, exp) => sum + (exp.biweeklyAmount || 0),
      0
    );

    return {
      expenseAllocations,
      totalExpenseAllocation
    };
  }, [planningItems, activeBudgetAllocations, expenses, currentPay, roundingOption, frequencyOptions]);
};