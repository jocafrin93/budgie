// hooks/usePaycheckTimeline.js
import { useItemTimelines } from './useItemTimelines';
import { usePaycheckDates } from './usePaycheckDates';
import { useUrgencyScoring } from './useUrgencyScoring';

/**
 * Hook for calculating paycheck timelines and urgency scores
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.planningItems - Planning items (unified data model)
 * @param {Array} params.activeBudgetAllocations - Active budget allocations (unified data model)
 * @param {Array} params.expenses - Expenses (legacy data model)
 * @param {Array} params.savingsGoals - Savings goals (legacy data model)
 * @param {Object} params.paySchedule - Pay schedule configuration
 * @param {Array} params.accounts - Accounts
 * @param {Array} params.expenseAllocations - Expense allocations
 * @param {Array} params.goalAllocations - Goal allocations
 * @returns {Object} Timeline data and helper functions
 */
export const usePaycheckTimeline = (params) => {
  // Provide default values to prevent undefined errors
  const safeParams = {
    planningItems: [],
    activeBudgetAllocations: [],
    expenses: [],
    savingsGoals: [],
    accounts: [],
    expenseAllocations: [],
    goalAllocations: [],
    paySchedule: {
      frequency: 'bi-weekly',
      startDate: new Date().toISOString().split('T')[0],
      splitPaycheck: false,
      primaryAmount: 0,
      secondaryAmount: 0,
      primaryAccountId: 1,
      secondaryAccountId: 1,
      secondaryDaysEarly: 0
    },
    ...params
  };

  // Generate paycheck dates
  const { paycheckDates, getRelevantPaychecksForItem } = usePaycheckDates({
    paySchedule: safeParams.paySchedule
  });

  // Calculate item timelines with all required parameters
  const timelineItems = useItemTimelines({
    ...safeParams,
    paycheckDates,
    getRelevantPaychecksForItem
  });

  // Categorize items by urgency
  const {
    categorizedItems: timelines,
    getTimelineForItem,
    getNextCriticalDeadline,
    getAllocationSuggestions,
    getCategoryUrgency
  } = useUrgencyScoring({
    timelineItems
  });

  return {
    timelines,
    getTimelineForItem,
    getNextCriticalDeadline,
    getAllocationSuggestions,
    getCategoryUrgency
  };
};