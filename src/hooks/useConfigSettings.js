// src/hooks/useConfigSettings.js
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing configuration and settings
 * Extracts configuration-related state and operations from App.js
 */
export const useConfigSettings = () => {
  // Pay settings
  const [currentPay, setCurrentPay] = useLocalStorage('budgetCalc_currentPay', 2000);
  const [payFrequency, setPayFrequency] = useLocalStorage('budgetCalc_payFrequency', 'biweekly');
  const [paySchedule, setPaySchedule] = useLocalStorage('budgetCalc_paySchedule', {
    frequency: 'biweekly',
    startDate: new Date().toISOString(),
    dayOfWeek: 5, // Friday
    dayOfMonth: 1,
    excludeWeekends: true
  });
  
  // Budget settings
  const [roundingOption, setRoundingOption] = useLocalStorage('budgetCalc_roundingOption', 'round');
  const [bufferPercentage, setBufferPercentage] = useLocalStorage('budgetCalc_bufferPercentage', 10);
  
  // Theme settings
  const [theme, setTheme] = useLocalStorage('budgetCalc_theme', 'light');
  
  // Frequency options for expenses
  const payFrequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'semimonthly', label: 'Twice a Month' }
  ];
  
  // Frequency options for expenses
  const frequencyOptions = [
    { value: 'once', label: 'One Time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 Weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semiannually', label: 'Twice a Year' },
    { value: 'annually', label: 'Yearly' }
  ];
  
  // Category colors
  const categoryColors = [
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-green-500 to-blue-500',
    'bg-gradient-to-r from-yellow-500 to-red-500',
    'bg-gradient-to-r from-blue-500 to-indigo-500',
    'bg-gradient-to-r from-red-500 to-yellow-500',
    'bg-gradient-to-r from-indigo-500 to-purple-500',
    'bg-gradient-to-r from-pink-500 to-red-500',
    'bg-gradient-to-r from-blue-500 to-green-500',
    'bg-gradient-to-r from-purple-600 to-indigo-600',
    'bg-gradient-to-r from-green-600 to-teal-600'
  ];
  
  /**
   * Update pay settings
   */
  const updatePaySettings = useCallback((settings) => {
    if (settings.currentPay !== undefined) {
      setCurrentPay(settings.currentPay);
    }
    
    if (settings.payFrequency !== undefined) {
      setPayFrequency(settings.payFrequency);
    }
    
    if (settings.paySchedule !== undefined) {
      setPaySchedule(prev => ({
        ...prev,
        ...settings.paySchedule
      }));
    }
  }, [setCurrentPay, setPayFrequency, setPaySchedule]);
  
  /**
   * Update budget settings
   */
  const updateBudgetSettings = useCallback((settings) => {
    if (settings.roundingOption !== undefined) {
      setRoundingOption(settings.roundingOption);
    }
    
    if (settings.bufferPercentage !== undefined) {
      setBufferPercentage(settings.bufferPercentage);
    }
  }, [setRoundingOption, setBufferPercentage]);
  
  /**
   * Update theme
   */
  const updateTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        newTheme.includes('dark') ? '#1f2937' : '#ffffff');
    }
  }, [setTheme]);
  
  /**
   * Get the number of days between paychecks based on frequency
   */
  const getPaycheckFrequencyDays = useCallback(() => {
    switch (payFrequency) {
      case 'weekly':
        return 7;
      case 'biweekly':
        return 14;
      case 'semimonthly':
        return 15; // Approximate
      case 'monthly':
        return 30; // Approximate
      default:
        return 14; // Default to biweekly
    }
  }, [payFrequency]);
  
  /**
   * Get the number of paychecks per year based on frequency
   */
  const getPaychecksPerYear = useCallback(() => {
    switch (payFrequency) {
      case 'weekly':
        return 52;
      case 'biweekly':
        return 26;
      case 'semimonthly':
        return 24;
      case 'monthly':
        return 12;
      default:
        return 26; // Default to biweekly
    }
  }, [payFrequency]);
  
  /**
   * Calculate monthly income based on current pay and frequency
   */
  const calculateMonthlyIncome = useCallback(() => {
    switch (payFrequency) {
      case 'weekly':
        return currentPay * 4.33; // 52 weeks / 12 months
      case 'biweekly':
        return currentPay * 2.17; // 26 paychecks / 12 months
      case 'semimonthly':
        return currentPay * 2; // 24 paychecks / 12 months
      case 'monthly':
        return currentPay; // Already monthly
      default:
        return currentPay * 2.17; // Default to biweekly
    }
  }, [currentPay, payFrequency]);
  
  return {
    // Pay settings
    currentPay,
    setCurrentPay,
    payFrequency,
    setPayFrequency,
    paySchedule,
    setPaySchedule,
    
    // Budget settings
    roundingOption,
    setRoundingOption,
    bufferPercentage,
    setBufferPercentage,
    
    // Theme settings
    theme,
    setTheme,
    
    // Options
    payFrequencyOptions,
    frequencyOptions,
    categoryColors,
    
    // Functions
    updatePaySettings,
    updateBudgetSettings,
    updateTheme,
    getPaycheckFrequencyDays,
    getPaychecksPerYear,
    calculateMonthlyIncome
  };
};