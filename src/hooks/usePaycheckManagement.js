// src/hooks/usePaycheckManagement.js
import { useCallback, useEffect } from 'react';
import { useSimpleStorage } from './useSimpleStorage';

/**
 * Custom hook for managing multiple paychecks
 * Supports variable amounts, different frequencies, and distribution to multiple accounts
 */
export const usePaycheckManagement = (accounts = []) => {
  // Helper function to validate amounts
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    // Cap at reasonable maximum (e.g., $100,000) and minimum (-$100,000)
    return Math.min(Math.max(amount, -100000), 100000);
  };

  // Paychecks state - force empty array to remove mock data
  const [paychecks, setPaychecks] = useSimpleStorage(
    'budgetCalc_paychecks',
    [] // Always start with empty array - no mock data
  );

  // Clean up any mock data that might be stored in cloud storage
  useEffect(() => {
    console.log('🔍 PAYCHECK CLEANUP - Checking for mock data:', paychecks);

    if (paychecks && Array.isArray(paychecks) && paychecks.length > 0) {
      console.log('🔍 PAYCHECK CLEANUP - Found paychecks:', paychecks.length);

      // Check for multiple patterns of mock data
      const hasMockData = paychecks.some(paycheck => {
        const isMockPattern1 = paycheck.name === "Main Paycheck" && paycheck.baseAmount === 2000 && paycheck.id === 1;
        const isMockPattern2 = paycheck.name === "Main Paycheck" && paycheck.baseAmount === 2000;
        const isMockPattern3 = paycheck.baseAmount === 2000 && paycheck.frequency === "biweekly" && paycheck.id === 1;

        console.log('🔍 PAYCHECK CLEANUP - Checking paycheck:', {
          name: paycheck.name,
          baseAmount: paycheck.baseAmount,
          id: paycheck.id,
          frequency: paycheck.frequency,
          isMockPattern1,
          isMockPattern2,
          isMockPattern3
        });

        return isMockPattern1 || isMockPattern2 || isMockPattern3;
      });

      console.log('🔍 PAYCHECK CLEANUP - Has mock data:', hasMockData);

      if (hasMockData) {
        console.log('🧹 DETECTED MOCK PAYCHECK DATA - CLEARING IT NOW!');
        console.log('🧹 Current paychecks before clearing:', paychecks);
        setPaychecks([]);
        console.log('🧹 Paychecks cleared - should be empty now');
      }
    } else {
      console.log('🔍 PAYCHECK CLEANUP - No paychecks found or empty array');
    }
  }, [paychecks, setPaychecks]); // Include dependencies but this will only run when paychecks change

  /**
   * Add a new paycheck
   */
  const addPaycheck = useCallback((paycheckData) => {
    const newId = Math.max(0, ...paychecks.map(p => p.id)) + 1;

    const newPaycheck = {
      id: newId,
      name: paycheckData.name || `Paycheck ${newId}`,
      frequency: paycheckData.frequency || "biweekly",
      startDate: paycheckData.startDate || new Date().toISOString().split('T')[0],
      baseAmount: validateAmount(paycheckData.baseAmount || 0),
      variableAmount: paycheckData.variableAmount || false,
      accountDistribution: paycheckData.accountDistribution || [
        {
          accountId: accounts.length > 0 ? accounts[0].id : 1,
          amount: validateAmount(paycheckData.baseAmount || 0),
          distributionType: "fixed",
          distributionValue: validateAmount(paycheckData.baseAmount || 0)
        }
      ],
      historyEntries: [],
      isActive: true
    };

    setPaychecks(prev => [...prev, newPaycheck]);
    return newPaycheck;
  }, [paychecks, setPaychecks, accounts]);

  /**
   * Update an existing paycheck
   */
  const updatePaycheck = useCallback((paycheckId, paycheckData) => {
    setPaychecks(prev =>
      prev.map(paycheck =>
        paycheck.id === paycheckId
          ? { ...paycheck, ...paycheckData }
          : paycheck
      )
    );
  }, [setPaychecks]);

  /**
   * Delete a paycheck
   */
  const deletePaycheck = useCallback((paycheckId) => {
    // Don't allow deleting the last paycheck
    if (paychecks.length <= 1) {
      console.warn("Cannot delete the only paycheck");
      return false;
    }

    setPaychecks(prev => prev.filter(p => p.id !== paycheckId));
    return true;
  }, [paychecks, setPaychecks]);

  /**
   * Toggle a paycheck's active status
   */
  const togglePaycheckActive = useCallback((paycheckId) => {
    setPaychecks(prev =>
      prev.map(paycheck =>
        paycheck.id === paycheckId
          ? { ...paycheck, isActive: !paycheck.isActive }
          : paycheck
      )
    );
  }, [setPaychecks]);

  /**
   * Record a received paycheck with actual amount
   */
  const recordPaycheckReceived = useCallback((paycheckId, date, actualAmount, notes = "") => {
    setPaychecks(prev =>
      prev.map(paycheck => {
        if (paycheck.id === paycheckId) {
          const historyEntry = {
            date: date,
            actualAmount: validateAmount(actualAmount),
            notes: notes
          };

          return {
            ...paycheck,
            historyEntries: [historyEntry, ...paycheck.historyEntries]
          };
        }
        return paycheck;
      })
    );
  }, [setPaychecks]);

  /**
   * Get frequency options for paychecks
   */
  const getFrequencyOptions = useCallback(() => {
    return [
      { value: 'weekly', label: 'Weekly', paychecksPerMonth: 4.33 },
      { value: 'biweekly', label: 'Every 2 Weeks', paychecksPerMonth: 2.17 },
      { value: 'semimonthly', label: 'Twice a Month', paychecksPerMonth: 2 },
      { value: 'monthly', label: 'Monthly', paychecksPerMonth: 1 }
    ];
  }, []);

  /**
   * Get paychecks per year based on frequency
   */
  const getPaychecksPerYear = useCallback((frequency) => {
    switch (frequency) {
      case 'weekly': return 52;
      case 'biweekly': return 26;
      case 'semimonthly': return 24;
      case 'monthly': return 12;
      default: return 26; // Default to biweekly
    }
  }, []);

  // Helper function to get today's date in local timezone (avoiding timezone issues)
  const getTodayLocal = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper function to add days to a date
  const addDays = useCallback((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }, []);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = useCallback((date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper function to create a date from YYYY-MM-DD string in local timezone
  const createLocalDate = useCallback((dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }, []);

  // Helper function to check if a date is today or in the future
  const isUpcoming = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate >= today;
  };

  // Helper function to calculate days until a date
  const daysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * Generate the next N paycheck dates for a specific paycheck
   */
  const generatePaycheckDates = useCallback((paycheckId, numberOfDates = 12) => {
    const paycheck = paychecks.find(p => p.id === paycheckId);
    if (!paycheck) return [];

    const dates = [];
    let currentDate;

    try {
      // Use createLocalDate to avoid timezone issues
      currentDate = createLocalDate(paycheck.startDate);
    } catch {
      // Fallback if date parsing fails
      currentDate = new Date();
    }

    for (let i = 0; i < numberOfDates; i++) {
      dates.push(new Date(currentDate));

      switch (paycheck.frequency) {
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'biweekly':
          currentDate = addDays(currentDate, 14);
          break;
        case 'semimonthly':
          // 1st and 15th of each month
          if (currentDate.getDate() < 15) {
            currentDate.setDate(15);
          } else {
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          break;
        case 'monthly':
          // Same day next month
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          // Default to biweekly
          currentDate = addDays(currentDate, 14);
      }
    }

    return dates;
  }, [paychecks, addDays, createLocalDate]);

  /**
   * Calculate total monthly income from all active paychecks
   */
  const calculateTotalMonthlyIncome = useCallback(() => {
    return paychecks
      .filter(p => p.isActive)
      .reduce((total, paycheck) => {
        const frequencyOptions = getFrequencyOptions();
        const option = frequencyOptions.find(o => o.value === paycheck.frequency);
        const paychecksPerMonth = option ? option.paychecksPerMonth : 2.17; // Default to biweekly

        return total + (validateAmount(paycheck.baseAmount) * paychecksPerMonth);
      }, 0);
  }, [paychecks, getFrequencyOptions]);

  /**
   * Get all upcoming paycheck dates across all active paychecks
   * Returns dates sorted chronologically with paycheck information
   * Uses timezone-safe date handling
   */
  const getAllUpcomingPaycheckDates = useCallback((numberOfMonths = 3) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + numberOfMonths);

    const allDates = [];

    paychecks
      .filter(p => p.isActive)
      .forEach(paycheck => {
        // Get more dates than we need to ensure we cover the time period
        const dates = generatePaycheckDates(paycheck.id, Math.ceil(getPaychecksPerYear(paycheck.frequency) / 12 * numberOfMonths) + 2);

        dates.forEach(date => {
          const paycheckDate = new Date(date);
          paycheckDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

          if (paycheckDate >= today && paycheckDate <= endDate) {
            const daysFromToday = daysUntil(paycheckDate);

            allDates.push({
              date: paycheckDate,
              paycheck: { ...paycheck },
              formattedDate: formatDate(paycheckDate),
              daysUntil: daysFromToday,
              isToday: daysFromToday === 0,
              isThisWeek: daysFromToday <= 7,
              isThisMonth: paycheckDate.getMonth() === today.getMonth() && paycheckDate.getFullYear() === today.getFullYear()
            });
          }
        });
      });

    // Sort dates chronologically
    return allDates.sort((a, b) => a.date - b.date);
  }, [paychecks, generatePaycheckDates, getPaychecksPerYear, formatDate]);

  /**
   * Get upcoming paycheck dates for a specific account
   * Returns only paychecks that distribute money to the specified account
   * @param {number|string} accountId - The account ID to filter by
   * @param {number} numberOfMonths - Number of months to look ahead
   * @returns {Array} Array of paycheck dates for the specified account
   */
  const getUpcomingPaycheckDatesForAccount = useCallback((accountId, numberOfMonths = 3) => {
    if (!accountId) return [];

    const allPaychecks = getAllUpcomingPaycheckDates(numberOfMonths);

    return allPaychecks.filter(paycheckEntry => {
      // Check if this paycheck distributes money to the specified account
      if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
        return paycheckEntry.paycheck.accountDistribution.some(dist =>
          String(dist.accountId) === String(accountId)
        );
      }
      return false;
    });
  }, [getAllUpcomingPaycheckDates]);

  /**
   * Get the next paycheck date across all active paychecks
   * Returns the soonest upcoming paycheck
   */
  const getNextPaycheckDate = useCallback(() => {
    const upcomingPaychecks = getAllUpcomingPaycheckDates(1);
    return upcomingPaychecks.length > 0 ? upcomingPaychecks[0] : null;
  }, [getAllUpcomingPaycheckDates]);

  /**
   * Get paychecks for a specific date range
   * Useful for calendar integration and budget planning
   */
  const getPaychecksInDateRange = useCallback((startDate, endDate) => {
    const start = createLocalDate(startDate);
    const end = createLocalDate(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const paychecksInRange = [];

    paychecks
      .filter(p => p.isActive)
      .forEach(paycheck => {
        // Calculate how many paychecks we might need to cover the date range
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const estimatedPaychecks = Math.ceil(daysDiff / (getPaychecksPerYear(paycheck.frequency) / 365)) + 2;

        const dates = generatePaycheckDates(paycheck.id, estimatedPaychecks);

        dates.forEach(date => {
          const paycheckDate = new Date(date);
          paycheckDate.setHours(0, 0, 0, 0);

          if (paycheckDate >= start && paycheckDate <= end) {
            paychecksInRange.push({
              date: paycheckDate,
              paycheck: { ...paycheck },
              formattedDate: formatDate(paycheckDate),
              daysFromStart: Math.ceil((paycheckDate - start) / (1000 * 60 * 60 * 24))
            });
          }
        });
      });

    return paychecksInRange.sort((a, b) => a.date - b.date);
  }, [paychecks, generatePaycheckDates, getPaychecksPerYear, createLocalDate, formatDate]);

  /**
   * Calculate expected income for a specific month
   * Takes into account all active paychecks and their schedules
   */
  const calculateMonthlyExpectedIncome = useCallback((year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0); // Last day of the month
    const endDateString = formatDate(endDate);

    const monthlyPaychecks = getPaychecksInDateRange(startDate, endDateString);

    return monthlyPaychecks.reduce((total, paycheckEntry) => {
      return total + paycheckEntry.paycheck.baseAmount;
    }, 0);
  }, [getPaychecksInDateRange, formatDate]);

  /**
   * Force clear all paycheck data (including cloud storage)
   */
  const clearAllPaycheckData = useCallback(() => {
    console.log('🧹 FORCE CLEARING ALL PAYCHECK DATA');
    setPaychecks([]);

    // Also clear localStorage as backup
    localStorage.removeItem('budgetCalc_paychecks');
    localStorage.removeItem('budgetCalc_paySchedule');
    localStorage.removeItem('budgetCalc_currentPay');

    console.log('🧹 All paycheck data cleared');
  }, [setPaychecks]);

  // Expose clearAllPaycheckData globally for debugging
  if (typeof window !== 'undefined') {
    window.clearPaycheckData = clearAllPaycheckData;
  }

  return {
    paychecks,
    setPaychecks,
    addPaycheck,
    updatePaycheck,
    deletePaycheck,
    togglePaycheckActive,
    recordPaycheckReceived,
    getFrequencyOptions,
    getPaychecksPerYear,
    generatePaycheckDates,
    calculateTotalMonthlyIncome,
    getAllUpcomingPaycheckDates,
    getUpcomingPaycheckDatesForAccount,
    getNextPaycheckDate,
    getPaychecksInDateRange,
    calculateMonthlyExpectedIncome,
    clearAllPaycheckData,
    // Utility functions for timezone-safe date handling
    getTodayLocal,
    isUpcoming,
    daysUntil
  };
};
