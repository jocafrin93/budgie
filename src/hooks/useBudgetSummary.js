// src/hooks/useBudgetSummary.js
import { useMemo } from 'react';
import { calculateBufferAmount, calculatePercentage } from '../utils/moneyUtils';

/**
 * Hook for calculating budget summary information
 * 
 * @param {Object} params - Parameters
 * @param {number} params.totalExpenseAllocation - Total expense allocation
 * @param {number} params.totalGoalAllocation - Total goal allocation
 * @param {number} params.currentPay - Current pay amount
 * @param {number} params.bufferPercentage - Buffer percentage
 * @returns {Object} Budget summary information
 */
export const useBudgetSummary = ({
  totalExpenseAllocation = 0,
  totalGoalAllocation = 0,
  currentPay = 0,
  bufferPercentage = 0,
}) => {
  return useMemo(() => {
    // Validate inputs
    if (currentPay <= 0) {
      console.warn('Invalid currentPay:', currentPay);
      return {
        totalBiweeklyAllocation: 0,
        bufferAmount: 0,
        totalWithBuffer: 0,
        remainingIncome: 0,
        allocationPercentage: 0,
      };
    }

    // Calculate total biweekly allocation
    const totalBiweeklyAllocation = totalExpenseAllocation + totalGoalAllocation;

    // Calculate buffer amount
    const bufferAmount = calculateBufferAmount(totalBiweeklyAllocation, bufferPercentage);

    // Calculate total with buffer
    const totalWithBuffer = totalBiweeklyAllocation + bufferAmount;

    // Calculate remaining income
    const remainingIncome = currentPay - totalWithBuffer;

    // Calculate allocation percentage
    const allocationPercentage = calculatePercentage(totalWithBuffer, currentPay);

    return {
      totalBiweeklyAllocation,
      bufferAmount,
      totalWithBuffer,
      remainingIncome,
      allocationPercentage,
    };
  }, [totalExpenseAllocation, totalGoalAllocation, currentPay, bufferPercentage]);
};