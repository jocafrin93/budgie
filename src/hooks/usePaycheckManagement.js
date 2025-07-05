// src/hooks/usePaycheckManagement.js
import { addDays, format, parseISO } from 'date-fns';
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

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
  // Migrate from old paySchedule format if needed
  const migrateFromLegacyPaySchedule = (legacyPaySchedule, legacyCurrentPay) => {
    // Default paycheck to create if no legacy data exists
    const defaultPaycheck = {
      id: 1,
      name: "Main Paycheck",
      frequency: "biweekly",
      startDate: new Date().toISOString().split('T')[0],
      baseAmount: 2000,
      variableAmount: false,
      accountDistribution: [
        {
          accountId: accounts.length > 0 ? accounts[0].id : 1,
          amount: 2000,
          distributionType: "fixed",
          distributionValue: 2000
        }
      ],
      historyEntries: [],
      isActive: true
    };

    // If no legacy data, return default
    if (!legacyPaySchedule && !legacyCurrentPay) {
      return [defaultPaycheck];
    }

    // Create paycheck from legacy data
    const paycheck = {
      id: 1,
      name: "Main Paycheck",
      frequency: legacyPaySchedule?.frequency || "biweekly",
      startDate: legacyPaySchedule?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      baseAmount: legacyCurrentPay || 2000,
      variableAmount: false,
      accountDistribution: [],
      historyEntries: [],
      isActive: true
    };

    // Handle split paycheck if configured in legacy data
    if (legacyPaySchedule?.splitPaycheck && legacyPaySchedule?.primaryAccountId && legacyPaySchedule?.secondaryAccountId) {
      paycheck.accountDistribution = [
        {
          accountId: legacyPaySchedule.primaryAccountId,
          amount: legacyPaySchedule.primaryAmount || (legacyCurrentPay * 0.7),
          distributionType: "fixed",
          distributionValue: legacyPaySchedule.primaryAmount || (legacyCurrentPay * 0.7)
        },
        {
          accountId: legacyPaySchedule.secondaryAccountId,
          amount: legacyPaySchedule.secondaryAmount || (legacyCurrentPay * 0.3),
          distributionType: "fixed",
          distributionValue: legacyPaySchedule.secondaryAmount || (legacyCurrentPay * 0.3)
        }
      ];
    } else {
      // Single account distribution
      paycheck.accountDistribution = [
        {
          accountId: accounts.length > 0 ? accounts[0].id : 1,
          amount: legacyCurrentPay || 2000,
          distributionType: "fixed",
          distributionValue: legacyCurrentPay || 2000
        }
      ];
    }

    return [paycheck];
  };

  // Try to get legacy data for migration
  const oldPaySchedule = localStorage.getItem('budgetCalc_paySchedule');
  const oldCurrentPay = localStorage.getItem('budgetCalc_currentPay');
  const parsedOldPaySchedule = oldPaySchedule ? JSON.parse(oldPaySchedule) : null;
  const parsedOldCurrentPay = oldCurrentPay ? parseFloat(oldCurrentPay) : null;

  // Paychecks state - migrate from old format if needed
  const [paychecks, setPaychecks] = useLocalStorage(
    'budgetCalc_paychecks',
    migrateFromLegacyPaySchedule(parsedOldPaySchedule, parsedOldCurrentPay)
  );

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

  /**
   * Generate the next N paycheck dates for a specific paycheck
   */
  const generatePaycheckDates = useCallback((paycheckId, numberOfDates = 12) => {
    const paycheck = paychecks.find(p => p.id === paycheckId);
    if (!paycheck) return [];

    const dates = [];
    let currentDate;

    try {
      currentDate = parseISO(paycheck.startDate);
    } catch (e) {
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
  }, [paychecks]);

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
   */
  const getAllUpcomingPaycheckDates = useCallback((numberOfMonths = 3) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + numberOfMonths);

    const allDates = [];

    paychecks
      .filter(p => p.isActive)
      .forEach(paycheck => {
        // Get more dates than we need to ensure we cover the time period
        const dates = generatePaycheckDates(paycheck.id, getPaychecksPerYear(paycheck.frequency) / 4 * numberOfMonths);

        dates.forEach(date => {
          if (date >= today && date <= endDate) {
            allDates.push({
              date,
              paycheck: { ...paycheck },
              formattedDate: format(date, 'yyyy-MM-dd')
            });
          }
        });
      });

    // Sort dates chronologically
    return allDates.sort((a, b) => a.date - b.date);
  }, [paychecks, generatePaycheckDates, getPaychecksPerYear]);

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
    getAllUpcomingPaycheckDates
  };
};