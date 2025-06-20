/**
 * src/utils/moneyUtils.js
 * Utility functions for currency formatting, rounding, and financial calculations
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: 'USD')
 * @param {boolean} showCents - Whether to show cents (default: true)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', showCents = true) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0
    }).format(amount);
};

/**
 * Round a number to a specific increment
 * @param {number} value - The value to round
 * @param {number} increment - The increment to round to (0 for no rounding)
 * @returns {number} Rounded value
 */
export const roundToIncrement = (value, increment) => {
    if (!increment || increment <= 0) return value;
    return Math.ceil(value / increment) * increment;
};

/**
 * Calculate percentage of a value
 * @param {number} value - The value to calculate percentage of
 * @param {number} total - The total value
 * @param {number} decimals - Number of decimal places to round to
 * @returns {number} Percentage value
 */
export const calculatePercentage = (value, total, decimals = 1) => {
    if (!total || total === 0) return 0;
    const percentage = (value / total) * 100;
    return parseFloat(percentage.toFixed(decimals));
};

/**
 * Convert a dollar amount to a percentage of income
 * @param {number} amount - The dollar amount
 * @param {number} income - The income amount
 * @param {number} decimals - Number of decimal places to round to
 * @returns {number} Percentage of income
 */
export const dollarToPercentage = (amount, income, decimals = 1) => {
    return calculatePercentage(amount, income, decimals);
};

/**
 * Convert a percentage of income to a dollar amount
 * @param {number} percentage - The percentage value
 * @param {number} income - The income amount
 * @returns {number} Dollar amount
 */
export const percentageToDollar = (percentage, income) => {
    if (!percentage || !income) return 0;
    return (percentage / 100) * income;
};

/**
 * Calculate buffer amount based on a percentage
 * @param {number} amount - The base amount
 * @param {number} bufferPercentage - The buffer percentage
 * @returns {number} Buffer amount
 */
export const calculateBufferAmount = (amount, bufferPercentage) => {
    if (!amount || !bufferPercentage) return 0;
    return amount * (bufferPercentage / 100);
};

/**
 * Calculate remaining amount after allocations
 * @param {number} total - The total amount
 * @param {number} allocated - The allocated amount
 * @returns {number} Remaining amount
 */
export const calculateRemaining = (total, allocated) => {
    return total - allocated;
};

/**
 * Calculate biweekly allocation based on frequency
 * @param {number} amount - The amount
 * @param {string} frequency - The frequency (weekly, bi-weekly, monthly, etc.)
 * @param {Object} frequencyOptions - The frequency options with weeksPerYear values
 * @param {number} roundingOption - The rounding option (0 for no rounding)
 * @returns {number} Biweekly allocation amount
 */
export const calculateBiweeklyAllocation = (amount, frequency, frequencyOptions, roundingOption = 0) => {
    if (!amount || amount <= 0) return 0;
    
    // Handle per-paycheck frequency
    if (frequency === 'per-paycheck') {
        if (roundingOption === 0) return amount;
        return roundToIncrement(amount, roundingOption);
    }
    
    // Find frequency data
    const freqData = frequencyOptions.find(f => f && f.value === frequency);
    if (!freqData || !freqData.weeksPerYear || freqData.weeksPerYear <= 0) {
        console.warn(`Invalid frequency data for ${frequency}:`, freqData);
        return 0;
    }
    
    const yearlyAmount = amount * freqData.weeksPerYear;
    const biweeklyAmount = yearlyAmount / 26;
    
    if (roundingOption === 0) return biweeklyAmount;
    return roundToIncrement(biweeklyAmount, roundingOption);
};

/**
 * Calculate monthly amount based on frequency
 * @param {number} amount - The amount
 * @param {string} frequency - The frequency (weekly, bi-weekly, monthly, etc.)
 * @param {Object} frequencyOptions - The frequency options with weeksPerYear values
 * @returns {number} Monthly amount
 */
export const calculateMonthlyAmount = (amount, frequency, frequencyOptions) => {
    if (!amount || amount <= 0) return 0;
    
    // Handle monthly frequency
    if (frequency === 'monthly') return amount;
    
    // Find frequency data
    const freqData = frequencyOptions.find(f => f && f.value === frequency);
    if (!freqData || !freqData.weeksPerYear || freqData.weeksPerYear <= 0) {
        console.warn(`Invalid frequency data for ${frequency}:`, freqData);
        return 0;
    }
    
    const yearlyAmount = amount * freqData.weeksPerYear;
    return yearlyAmount / 12;
};

/**
 * Convert between different pay frequencies
 * @param {number} amount - The amount to convert
 * @param {string} fromFrequency - The source frequency
 * @param {string} toFrequency - The target frequency
 * @param {Object} frequencyOptions - The frequency options with weeksPerYear values
 * @returns {number} Converted amount
 */
export const convertFrequency = (amount, fromFrequency, toFrequency, frequencyOptions) => {
    if (!amount || amount <= 0) return 0;
    
    // If frequencies are the same, return the original amount
    if (fromFrequency === toFrequency) return amount;
    
    // Find frequency data
    const fromFreqData = frequencyOptions.find(f => f && f.value === fromFrequency);
    const toFreqData = frequencyOptions.find(f => f && f.value === toFrequency);
    
    if (!fromFreqData || !fromFreqData.weeksPerYear || fromFreqData.weeksPerYear <= 0 ||
        !toFreqData || !toFreqData.weeksPerYear || toFreqData.weeksPerYear <= 0) {
        console.warn(`Invalid frequency data for conversion from ${fromFrequency} to ${toFrequency}`);
        return 0;
    }
    
    // Convert to yearly first, then to target frequency
    const yearlyAmount = amount * fromFreqData.weeksPerYear;
    return yearlyAmount / toFreqData.weeksPerYear;
};