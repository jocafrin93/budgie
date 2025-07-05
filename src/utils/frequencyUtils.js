/**
 * src/utils/frequencyUtils.js
 * Utility functions for handling payment frequencies and related calculations
 */

/**
 * Get a friendly label for a frequency
 * @param {string} frequency - The frequency value
 * @returns {string} Friendly label for the frequency
 */
export const getFrequencyLabel = (frequency) => {
    switch (frequency) {
        case 'weekly': return 'paycheck';
        case 'bi-weekly': return 'paycheck';
        case 'semi-monthly': return 'pay period';
        case 'monthly': return 'payment';
        case 'once': return 'one-time payment';
        case 'every-3-weeks': return 'payment';
        case 'every-6-weeks': return 'payment';
        case 'every-7-weeks': return 'payment';
        case 'every-8-weeks': return 'payment';
        case 'quarterly': return 'payment';
        case 'annually': return 'payment';
        case 'per-paycheck': return 'paycheck';
        default: return 'paycheck';
    }
};

/**
 * Get the number of occurrences per year for a frequency
 * @param {string} frequency - The frequency value
 * @returns {number} Number of occurrences per year
 */
export const getOccurrencesPerYear = (frequency) => {
    switch (frequency) {
        case 'weekly': return 52;
        case 'bi-weekly': return 26;
        case 'semi-monthly': return 24;
        case 'monthly': return 12;
        case 'every-3-weeks': return 17.33;
        case 'every-6-weeks': return 8.67;
        case 'every-7-weeks': return 7.43;
        case 'every-8-weeks': return 6.5;
        case 'quarterly': return 4;
        case 'annually': return 1;
        case 'per-paycheck': return 26; // Assuming bi-weekly by default
        case 'once': return 1;
        default: return 26; // Default to bi-weekly
    }
};

/**
 * Get the number of occurrences per month for a frequency
 * @param {string} frequency - The frequency value
 * @returns {number} Number of occurrences per month
 */
export const getOccurrencesPerMonth = (frequency) => {
    switch (frequency) {
        case 'weekly': return 4.33;
        case 'bi-weekly': return 2.17;
        case 'semi-monthly': return 2;
        case 'monthly': return 1;
        case 'every-3-weeks': return 1.44;
        case 'every-6-weeks': return 0.72;
        case 'every-7-weeks': return 0.62;
        case 'every-8-weeks': return 0.54;
        case 'quarterly': return 0.33;
        case 'annually': return 0.08;
        case 'per-paycheck': return 2.17; // Assuming bi-weekly by default
        case 'once': return 0.08; // Roughly once per year
        default: return 2.17; // Default to bi-weekly
    }
};

/**
 * Get the number of days between occurrences for a frequency
 * @param {string} frequency - The frequency value
 * @returns {number} Number of days between occurrences
 */
export const getDaysBetweenOccurrences = (frequency) => {
    switch (frequency) {
        case 'weekly': return 7;
        case 'bi-weekly': return 14;
        case 'semi-monthly': return 15; // Approximate
        case 'monthly': return 30; // Approximate
        case 'every-3-weeks': return 21;
        case 'every-6-weeks': return 42;
        case 'every-7-weeks': return 49;
        case 'every-8-weeks': return 56;
        case 'quarterly': return 91; // Approximate
        case 'annually': return 365;
        case 'per-paycheck': return 14; // Assuming bi-weekly by default
        case 'once': return 365; // Doesn't really apply
        default: return 14; // Default to bi-weekly
    }
};

/**
 * Get the standard frequency options for the application
 * @returns {Array} Array of frequency options with value, label, and weeksPerYear
 */
export const getFrequencyOptions = () => [
    { value: 'once', label: 'One Time', weeksPerYear: 1 },
    { value: 'weekly', label: 'Weekly', weeksPerYear: 52 },
    { value: 'bi-weekly', label: 'Every 2 Weeks', weeksPerYear: 26 },
    { value: 'monthly', label: 'Monthly', weeksPerYear: 12 },
    { value: 'quarterly', label: 'Quarterly', weeksPerYear: 4 },
    { value: 'semi-annually', label: 'Twice a Year', weeksPerYear: 2 },
    { value: 'annually', label: 'Yearly', weeksPerYear: 1 }
];

/**
 * Get the standard pay frequency options for the application
 * @returns {Array} Array of pay frequency options with value, label, and paychecksPerMonth
 */
export const getPayFrequencyOptions = () => [
    { value: 'weekly', label: 'Weekly', paychecksPerMonth: 4.33 },
    { value: 'bi-weekly', label: 'Bi-weekly', paychecksPerMonth: 2.17 },
    { value: 'semi-monthly', label: 'Semi-monthly (15th & 30th)', paychecksPerMonth: 2.0 },
    { value: 'monthly', label: 'Monthly', paychecksPerMonth: 1.0 }
];

/**
 * Convert an amount from one frequency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromFrequency - The source frequency
 * @param {string} toFrequency - The target frequency
 * @returns {number} The converted amount
 */
export const convertBetweenFrequencies = (amount, fromFrequency, toFrequency) => {
    if (!amount || amount <= 0) return 0;
    if (fromFrequency === toFrequency) return amount;
    
    const fromOccurrences = getOccurrencesPerYear(fromFrequency);
    const toOccurrences = getOccurrencesPerYear(toFrequency);
    
    // Convert to yearly first, then to target frequency
    const yearlyAmount = amount * fromOccurrences;
    return yearlyAmount / toOccurrences;
};

/**
 * Calculate the number of occurrences between two dates based on frequency
 * @param {Date|string} startDate - The start date
 * @param {Date|string} endDate - The end date
 * @param {string} frequency - The frequency value
 * @returns {number} Number of occurrences between the dates
 */
export const getOccurrencesBetweenDates = (startDate, endDate, frequency) => {
    if (!startDate || !endDate) return 0;
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Calculate days between dates
    const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    // Get days between occurrences for this frequency
    const daysBetween = getDaysBetweenOccurrences(frequency);
    
    // Calculate number of occurrences
    return Math.floor(daysDiff / daysBetween) + 1; // +1 to include the start date
};