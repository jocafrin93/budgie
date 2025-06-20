// src/hooks/useItemTimelines.js
import { useMemo } from 'react';
import {
  getExpensesFromPlanningItems,
  getSavingsGoalsFromPlanningItems
} from '../utils/dataModelUtils';
import {
  calculateFundingTimeline,
  calculateUrgencyScore,
  getUrgencyIndicator
} from '../utils/progressUtils';

/**
 * Hook for calculating funding timelines for expenses and goals
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.planningItems - Planning items (unified data model)
 * @param {Array} params.activeBudgetAllocations - Active budget allocations (unified data model)
 * @param {Array} params.expenses - Expenses (legacy data model)
 * @param {Array} params.savingsGoals - Savings goals (legacy data model)
 * @param {Array} params.accounts - Accounts
 * @param {Array} params.paycheckDates - Paycheck dates
 * @param {Function} params.getRelevantPaychecksForItem - Function to get relevant paychecks for an item
 * @param {Array} params.expenseAllocations - Expense allocations
 * @param {Array} params.goalAllocations - Goal allocations
 * @param {Object} params.paySchedule - Pay schedule configuration
 * @returns {Object} Item timelines
 */
export const useItemTimelines = ({
  planningItems = [],
  activeBudgetAllocations = [],
  expenses = [],
  savingsGoals = [],
  accounts = [],
  paycheckDates = [],
  getRelevantPaychecksForItem,
  expenseAllocations = [],
  goalAllocations = [],
  paySchedule = {}
}) => {
  return useMemo(() => {
    // Provide safe defaults
    const safeGetRelevantPaychecks = getRelevantPaychecksForItem || (() => []);
    const safePaySchedule = {
      frequency: 'bi-weekly',
      startDate: new Date().toISOString().split('T')[0],
      splitPaycheck: false,
      primaryAmount: 0,
      secondaryAmount: 0,
      primaryAccountId: 1,
      secondaryAccountId: 1,
      secondaryDaysEarly: 0,
      ...paySchedule
    };

    // Determine which data model to use
    const useUnifiedModel = planningItems.length > 0;

    // If using unified model, derive expenses and savings goals
    const effectiveExpenses = useUnifiedModel
      ? getExpensesFromPlanningItems(planningItems)
      : expenses;

    const effectiveSavingsGoals = useUnifiedModel
      ? getSavingsGoalsFromPlanningItems(planningItems)
      : savingsGoals;

    // Initialize timeline items
    const timelineItems = [];

    // Process expenses
    effectiveExpenses.forEach(expense => {
      try {
        // Skip if paused or complete
        if (expense.priorityState === 'paused' || expense.priorityState === 'complete') {
          return;
        }

        // Get allocation data
        const allocation = useUnifiedModel && activeBudgetAllocations.length > 0
          ? activeBudgetAllocations.find(alloc => alloc.planningItemId === expense.id)
          : expenseAllocations.find(alloc => alloc.id === expense.id);

        if (!allocation) {
          timelineItems.push({
            ...expense,
            type: 'expense',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No allocation found'
          });
          return;
        }

        // Skip if no due date
        if (!expense.dueDate) {
          timelineItems.push({
            ...expense,
            type: 'expense',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No due date set'
          });
          return;
        }

        // Get account for this expense
        const account = accounts.find(a => a.id === expense.accountId);
        if (!account) {
          timelineItems.push({
            ...expense,
            type: 'expense',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No account found'
          });
          return;
        }

        // Get relevant paychecks for this expense
        const relevantPaychecks = safeGetRelevantPaychecks(account.id, expense.dueDate);

        // Calculate funding timeline with safe parameters
        const timeline = calculateFundingTimeline({
          amount: expense.amount,
          alreadySaved: expense.alreadySaved || 0,
          dueDate: expense.dueDate,
          biweeklyAmount: allocation.biweeklyAmount || allocation.perPaycheckAmount || 0,
          relevantPaychecks,
          paySchedule: safePaySchedule
        });

        // Calculate urgency score and indicator
        const urgencyScore = calculateUrgencyScore(timeline);
        const urgencyIndicator = getUrgencyIndicator(urgencyScore);

        // Generate message safely
        const message = timeline && timeline.message ? timeline.message : 'Unable to calculate timeline';

        // Create timeline item
        timelineItems.push({
          ...expense,
          type: 'expense',
          timeline,
          urgencyScore,
          urgencyIndicator,
          message
        });
      } catch (error) {
        console.error(`Error processing expense timeline for ${expense?.name}:`, error);
        // Add a safe fallback item
        timelineItems.push({
          ...expense,
          type: 'expense',
          timeline: null,
          urgencyScore: 0,
          urgencyIndicator: { emoji: '⚪', label: 'Error', color: 'text-red-600' },
          message: 'Error calculating timeline'
        });
      }
    });

    // Process savings goals
    effectiveSavingsGoals.forEach(goal => {
      try {
        // Skip if paused or complete
        if (goal.priorityState === 'paused' || goal.priorityState === 'complete') {
          return;
        }

        // Get allocation data
        const allocation = useUnifiedModel && activeBudgetAllocations.length > 0
          ? activeBudgetAllocations.find(alloc => alloc.planningItemId === goal.id)
          : goalAllocations.find(alloc => alloc.id === goal.id);

        if (!allocation) {
          timelineItems.push({
            ...goal,
            type: 'savings-goal',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No allocation found'
          });
          return;
        }

        // Skip if no target date
        if (!goal.targetDate) {
          timelineItems.push({
            ...goal,
            type: 'savings-goal',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No target date set'
          });
          return;
        }

        // Get account for this goal
        const account = accounts.find(a => a.id === goal.accountId);
        if (!account) {
          timelineItems.push({
            ...goal,
            type: 'savings-goal',
            timeline: null,
            urgencyScore: 0,
            urgencyIndicator: { emoji: '⚪', label: 'None', color: 'text-theme-secondary' },
            message: 'No account found'
          });
          return;
        }

        // Get relevant paychecks for this goal
        const relevantPaychecks = safeGetRelevantPaychecks(account.id, goal.targetDate);

        // Calculate funding timeline with safe parameters
        const timeline = calculateFundingTimeline({
          amount: goal.targetAmount,
          alreadySaved: goal.alreadySaved || 0,
          dueDate: goal.targetDate,
          biweeklyAmount: allocation.biweeklyAmount || allocation.perPaycheckAmount || 0,
          relevantPaychecks,
          paySchedule: safePaySchedule
        });

        // Calculate urgency score and indicator
        const urgencyScore = calculateUrgencyScore(timeline);
        const urgencyIndicator = getUrgencyIndicator(urgencyScore);

        // Generate message safely
        const message = timeline && timeline.message ? timeline.message : 'Unable to calculate timeline';

        // Create timeline item
        timelineItems.push({
          ...goal,
          type: 'savings-goal',
          timeline,
          urgencyScore,
          urgencyIndicator,
          message
        });
      } catch (error) {
        console.error(`Error processing goal timeline for ${goal?.name}:`, error);
        // Add a safe fallback item
        timelineItems.push({
          ...goal,
          type: 'savings-goal',
          timeline: null,
          urgencyScore: 0,
          urgencyIndicator: { emoji: '⚪', label: 'Error', color: 'text-red-600' },
          message: 'Error calculating timeline'
        });
      }
    });

    return timelineItems;
  }, [
    planningItems,
    activeBudgetAllocations,
    expenses,
    savingsGoals,
    accounts,
    paycheckDates,
    getRelevantPaychecksForItem,
    expenseAllocations,
    goalAllocations,
    paySchedule
  ]);
};