/**
 * src/utils/budgetDisplayUtils.js
 * Utility functions for enhanced budget table display
 */

import { getOccurrencesPerMonth } from './frequencyUtils';

/**
 * Convert frequency value to user-friendly display text
 * @param {string} frequency - The frequency value
 * @returns {string} User-friendly frequency text
 */
export const getFrequencyDisplayText = (frequency) => {
    switch (frequency) {
        case 'weekly': return 'weekly';
        case 'bi-weekly': return 'every 2 weeks';
        case 'every-3-weeks': return 'every 3 weeks';
        case 'monthly': return 'monthly';
        case 'every-5-weeks': return 'every 5 weeks';
        case 'every-6-weeks': return 'every 6 weeks';
        case 'every-7-weeks': return 'every 7 weeks';
        case 'bi-monthly': return 'every 2 months';
        case 'quarterly': return 'every 3 months';
        case 'semi-annually': return 'every 6 months';
        case 'annually': return 'yearly';
        case 'per-paycheck': return 'per paycheck';
        case 'once': return 'one time';
        default: return frequency;
    }
};

/**
 * Calculate monthly equivalent amount from frequency-based amount
 * @param {number} amount - The amount at the given frequency
 * @param {string} frequency - The frequency value
 * @returns {number} Monthly equivalent amount
 */
export const calculateMonthlyAmount = (amount, frequency) => {
    if (!amount || amount <= 0) return 0;
    const occurrencesPerMonth = getOccurrencesPerMonth(frequency);
    return amount * occurrencesPerMonth;
};

/**
 * Calculate paychecks remaining until due date
 * @param {string} dueDate - The due date in YYYY-MM-DD format
 * @param {Array} upcomingPaychecks - Array of upcoming paycheck dates
 * @param {number|string} accountId - Optional account ID to filter paychecks
 * @returns {number} Number of paychecks remaining until due date
 */
export const calculatePaychecksUntilDue = (dueDate, upcomingPaychecks = [], accountId = null) => {
    if (!dueDate || !upcomingPaychecks.length) return 0;

    // Parse due date safely to avoid timezone issues - FIXED VERSION
    const parseDateSafely = (dateInput) => {
        if (!dateInput) return null;

        let dateObj;
        if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle YYYY-MM-DD format
            const [year, month, day] = dateInput.split('-').map(Number);
            dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else if (typeof dateInput === 'string' && dateInput.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            // Handle MM/DD/YYYY format
            const [month, day, year] = dateInput.split('/').map(Number);
            dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else {
            // Fallback to regular Date constructor
            dateObj = new Date(dateInput);
        }

        // Set to start of day to avoid time comparison issues
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    };

    const dueDateObj = parseDateSafely(dueDate);
    if (!dueDateObj) return 0;

    // Filter paychecks by account if specified - SIMPLIFIED LOGIC
    let relevantPaychecks = upcomingPaychecks;
    if (accountId !== null) {
        relevantPaychecks = upcomingPaychecks.filter(paycheckEntry => {
            // Simple check: does this paycheck distribute ANY money to the specified account?
            if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
                return paycheckEntry.paycheck.accountDistribution.some(dist =>
                    String(dist.accountId) === String(accountId)
                );
            }
            return false;
        });
    }

    // Count paychecks that occur before the due date (not including the due date)
    return relevantPaychecks.filter(paycheck => {
        const paycheckDate = parseDateSafely(paycheck.date);
        return paycheckDate && paycheckDate < dueDateObj; // Only count paychecks BEFORE the due date
    }).length;
};

/**
 * Format amount and frequency for display
 * @param {number} amount - The amount
 * @param {string} frequency - The frequency value
 * @returns {string} Formatted display string (e.g., "$320 every 7 weeks")
 */
export const formatAmountWithFrequency = (amount, frequency) => {
    if (!amount || amount <= 0) return '';
    const formattedAmount = `$${amount.toFixed(2)}`;
    const frequencyText = getFrequencyDisplayText(frequency);
    return `${formattedAmount} ${frequencyText}`;
};
