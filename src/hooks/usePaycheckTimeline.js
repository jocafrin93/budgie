// hooks/usePaycheckTimeline.js
import { usePaycheckDates } from './usePaycheckDates';
import { useItemTimelines } from './useItemTimelines';
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
  // Generate paycheck dates
  const { paycheckDates, getRelevantPaychecksForItem } = usePaycheckDates({
    paySchedule: params.paySchedule
  });
  
  // Calculate item timelines
  const timelineItems = useItemTimelines({
    ...params,
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