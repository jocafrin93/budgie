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
            
          // If we have an allocation, use its values
          if (allocation) {
            const targetAmount = parseFloat(goal.targetAmount) || 0;
            const alreadySaved = parseFloat(goal.alreadySaved) || 0;
            const remainingNeeded = calculateRemainingNeeded(targetAmount, alreadySaved);
            const fundingProgress = calculateFundingProgress(targetAmount, alreadySaved);
            const fullyFunded = isFullyFunded(fundingProgress);
            
            return {
              ...goal,
              biweeklyAmount: allocation.perPaycheckAmount || 0,
              percentage: calculatePercentage(allocation.perPaycheckAmount, currentPay),
              remainingNeeded,
              fundingProgress,
              isFullyFunded: fullyFunded,
            };
          }
        }
        
        // Fall back to calculating from scratch
        const biweeklyAmount = calculateGoalBiweeklyAllocation(goal, roundingOption);
        const targetAmount = parseFloat(goal.targetAmount) || 0;
        const alreadySaved = parseFloat(goal.alreadySaved) || 0;
        const remainingNeeded = calculateRemainingNeeded(targetAmount, alreadySaved);
        const fundingProgress = calculateFundingProgress(targetAmount, alreadySaved);
        const fullyFunded = isFullyFunded(fundingProgress);

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