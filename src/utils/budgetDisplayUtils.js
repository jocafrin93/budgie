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

    // Parse due date safely
    let dueDateObj;
    if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDate.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day); // month is 0-indexed
    } else {
        dueDateObj = new Date(dueDate);
    }

    // Filter paychecks by account if specified
    let relevantPaychecks = upcomingPaychecks;
    if (accountId !== null) {
        relevantPaychecks = upcomingPaychecks.filter(paycheckEntry => {
            // Check if this paycheck distributes money to the specified account
            if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
                return paycheckEntry.paycheck.accountDistribution.some(dist =>
                    String(dist.accountId) === String(accountId)
                );
            }
            return false;
        });
    }

    // Count paychecks that occur before or on the due date
    return relevantPaychecks.filter(paycheck => {
        const paycheckDate = new Date(paycheck.date);
        return paycheckDate <= dueDateObj;
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
