// src/hooks/useBudgetCalculations.js
import { useExpenseAllocations } from './useExpenseAllocations';
import { useGoalAllocations } from './useGoalAllocations';
import { useBudgetSummary } from './useBudgetSummary';
import { useCategorizedItems } from './useCategorizedItems';

/**
 * Hook for calculating budget allocations and summaries
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.planningItems - Planning items (unified data model)
 * @param {Array} params.activeBudgetAllocations - Active budget allocations (unified data model)
 * @param {Array} params.expenses - Expenses (legacy data model)
 * @param {Array} params.savingsGoals - Savings goals (legacy data model)
 * @param {number} params.currentPay - Current pay amount
 * @param {number} params.roundingOption - Rounding option
 * @param {number} params.bufferPercentage - Buffer percentage
 * @param {Array} params.frequencyOptions - Frequency options
 * @returns {Object} Budget calculations
 */
export const useBudgetCalculations = (params) => {
  // Calculate expense allocations
  const { expenseAllocations, totalExpenseAllocation } = useExpenseAllocations(params);
  
  // Calculate goal allocations
  const { goalAllocations, totalGoalAllocation } = useGoalAllocations(params);
  
  // Calculate budget summary
  const budgetSummary = useBudgetSummary({
    totalExpenseAllocation,
    totalGoalAllocation,
    currentPay: params.currentPay,
    bufferPercentage: params.bufferPercentage,
  });
  
  // Categorize expenses and goals
  const categorizedExpenses = useCategorizedItems({
    expenseAllocations,
    goalAllocations,
    currentPay: params.currentPay,
  });
  
  // Return combined results
  return {
    expenseAllocations,
    goalAllocations,
    totalExpenseAllocation,
    totalGoalAllocation,
    ...budgetSummary,
    categorizedExpenses,
  };
};

// Helper function for empty calculations (kept for backward compatibility)
export function getEmptyCalculations() {
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