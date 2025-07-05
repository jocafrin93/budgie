// src/hooks/useGoalAllocations.js
import { useMemo } from 'react';
import { getSavingsGoalsFromPlanningItems } from '../utils/dataModelUtils';
import {
  calculateGoalBiweeklyAllocation,
  calculatePercentage
} from '../utils/moneyUtils';
import {
  calculateFundingProgress,
  calculateRemainingNeeded,
  isFullyFunded
} from '../utils/progressUtils';

/**
 * Hook for calculating savings goal allocations
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.planningItems - Planning items (unified data model)
 * @param {Array} params.activeBudgetAllocations - Active budget allocations (unified data model)
 * @param {Array} params.savingsGoals - Savings goals (legacy data model)
 * @param {number} params.currentPay - Current pay amount
 * @param {number} params.roundingOption - Rounding option
 * @returns {Object} Goal allocations and total
 */
export const useGoalAllocations = ({
  planningItems = [],
  activeBudgetAllocations = [],
  savingsGoals = [],
  currentPay = 0,
  roundingOption = 0,
}) => {
  return useMemo(() => {
    // Determine which data model to use
    const useUnifiedModel = planningItems.length > 0;

    // If using unified model, derive savings goals
    const effectiveSavingsGoals = useUnifiedModel
      ? getSavingsGoalsFromPlanningItems(planningItems)
      : savingsGoals;

    // Validate inputs
    if (!Array.isArray(effectiveSavingsGoals)) {
      console.warn('Invalid input array to useGoalAllocations');
      return { goalAllocations: [], totalGoalAllocation: 0 };
    }

    if (currentPay <= 0) {
      console.warn('Invalid currentPay:', currentPay);
      return { goalAllocations: [], totalGoalAllocation: 0 };
    }

    // Process goals with error handling
    const goalAllocations = effectiveSavingsGoals.map(goal => {
      try {
        // Parse and calculate important values first
        const targetAmount = parseFloat(goal.targetAmount) || 0;
        const alreadySaved = parseFloat(goal.alreadySaved) || 0;
        const remainingNeeded = calculateRemainingNeeded(targetAmount, alreadySaved);
        const fundingProgress = calculateFundingProgress(targetAmount, alreadySaved);
        const fullyFunded = isFullyFunded(fundingProgress);

        // If using unified model and we have active allocations, use those values
        if (useUnifiedModel && activeBudgetAllocations.length > 0) {
          // Find the corresponding planning item
          const planningItem = planningItems.find(item =>
            item.type === 'savings-goal' && item.id === goal.id
          );

          // Find the corresponding allocation
          const allocation = planningItem && planningItem.isActive
            ? activeBudgetAllocations.find(alloc => alloc.planningItemId === goal.id)
            : null;

          // If we have an allocation, use its values but adjust for remaining needed
          if (allocation) {
            let adjustedBiweeklyAmount = allocation.perPaycheckAmount || 0;

            // If fully funded, set to 0
            if (fullyFunded) {
              adjustedBiweeklyAmount = 0;
            }
            // For partially funded goals, adjust the per-paycheck amount based on remaining needed
            else if (remainingNeeded < targetAmount) {
              // Calculate the proportion of the target amount that still needs to be funded
              const remainingProportion = remainingNeeded / targetAmount;
              // Scale the per-paycheck amount by this proportion
              adjustedBiweeklyAmount = adjustedBiweeklyAmount * remainingProportion;
            }

            return {
              ...goal,
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
          // Create a modified goal object with the remaining amount
          const modifiedGoal = {
            ...goal,
            targetAmount: remainingNeeded,
            monthlyContribution: goal.monthlyContribution
          };

          // Calculate biweekly amount based on the remaining needed
          biweeklyAmount = calculateGoalBiweeklyAllocation(modifiedGoal, roundingOption);
        }

        return {
          ...goal,
          biweeklyAmount,
          percentage: calculatePercentage(biweeklyAmount, currentPay),
          remainingNeeded,
          fundingProgress,
          isFullyFunded: fullyFunded,
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

    // Calculate total goal allocation
    const totalGoalAllocation = goalAllocations.reduce(
      (sum, goal) => sum + (goal.biweeklyAmount || 0),
      0
    );

    return {
      goalAllocations,
      totalGoalAllocation
    };
  }, [planningItems, activeBudgetAllocations, savingsGoals, currentPay, roundingOption]);
};