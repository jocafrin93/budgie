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
            
          // If we have an allocation, use its values
          if (allocation) {
            const amount = parseFloat(expense.amount) || 0;
            const alreadySaved = parseFloat(expense.alreadySaved) || 0;
            const remainingNeeded = calculateRemainingNeeded(amount, alreadySaved);
            const fundingProgress = calculateFundingProgress(amount, alreadySaved);
            const fullyFunded = isFullyFunded(fundingProgress);
            
            return {
              ...expense,
              biweeklyAmount: allocation.perPaycheckAmount || 0,
              percentage: calculatePercentage(allocation.perPaycheckAmount, currentPay),
              remainingNeeded,
              fundingProgress,
              isFullyFunded: fullyFunded,
            };
          }
        }
        
        // Fall back to calculating from scratch
        const biweeklyAmount = calculateBiweeklyAllocation(expense, frequencyOptions, roundingOption);
        const amount = parseFloat(expense.amount) || 0;
        const alreadySaved = parseFloat(expense.alreadySaved) || 0;
        const remainingNeeded = calculateRemainingNeeded(amount, alreadySaved);
        const fundingProgress = calculateFundingProgress(amount, alreadySaved);
        const fullyFunded = isFullyFunded(fundingProgress);

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