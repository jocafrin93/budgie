// src/hooks/usePaycheckDates.js
import { useMemo } from 'react';
import { generatePaycheckDates, getRelevantPaychecks } from '../utils/dateUtils';

/**
 * Hook for generating paycheck dates based on a schedule
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.paySchedule - Pay schedule configuration
 * @returns {Object} Paycheck dates and helper functions
 */
export const usePaycheckDates = ({
  paySchedule = {}
}) => {
  const paycheckDates = useMemo(() => {
    // Generate paycheck dates for the next year
    return generatePaycheckDates(paySchedule);
  }, [paySchedule]);

  /**
   * Get paychecks relevant to a specific account and target date
   * 
   * @param {string} accountId - Account ID
   * @param {string} targetDate - Target date
   * @returns {Array} Relevant paychecks
   */
  const getRelevantPaychecksForItem = (accountId, targetDate) => {
    if (!accountId || !targetDate) return [];
    return getRelevantPaychecks(paycheckDates, accountId, targetDate);
  };

  return {
    paycheckDates,
    getRelevantPaychecksForItem
  };
};