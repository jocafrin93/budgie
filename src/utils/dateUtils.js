/**
 * src/utils/dateUtils.js
 * Utility functions for date calculations and formatting
 */

/**
 * Generate paycheck dates based on frequency and schedule
 * @param {Object} paySchedule - The pay schedule configuration
 * @param {number} monthsAhead - How many months ahead to generate dates for
 * @returns {Array} Array of paycheck objects with dates and amounts
 */
export const generatePaycheckDates = (paySchedule, monthsAhead = 12) => {
    const { startDate, frequency, splitPaycheck, primaryAmount, secondaryAmount, secondaryDaysEarly } = paySchedule;
    const start = new Date(startDate);
    const paychecks = [];

    // Calculate how many paychecks to generate based on frequency
    const totalPaychecks = frequency === 'bi-weekly' ? 26 * (monthsAhead / 12) :
        frequency === 'weekly' ? 52 * (monthsAhead / 12) :
            frequency === 'semi-monthly' ? 24 * (monthsAhead / 12) :
                frequency === 'monthly' ? 12 * (monthsAhead / 12) : 26;

    for (let i = 0; i < totalPaychecks; i++) {
        let paycheckDate;

        switch (frequency) {
            case 'weekly':
                paycheckDate = new Date(start.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
                break;
            case 'bi-weekly':
                paycheckDate = new Date(start.getTime() + (i * 14 * 24 * 60 * 60 * 1000));
                break;
            case 'semi-monthly':
                // 1st and 15th of each month
                const monthsFromStart = Math.floor(i / 2);
                const isFirstHalf = i % 2 === 0;
                paycheckDate = new Date(start.getFullYear(), start.getMonth() + monthsFromStart, isFirstHalf ? 1 : 15);
                break;
            case 'monthly':
                paycheckDate = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
                break;
            default:
                paycheckDate = new Date(start.getTime() + (i * 14 * 24 * 60 * 60 * 1000)); // Default to bi-weekly
        }

        const primaryDate = new Date(paycheckDate);
        const secondaryDate = splitPaycheck ?
            new Date(paycheckDate.getTime() - (secondaryDaysEarly * 24 * 60 * 60 * 1000)) :
            null;

        paychecks.push({
            index: i,
            primaryDate,
            secondaryDate,
            primaryAmount: splitPaycheck ? primaryAmount : primaryAmount + (secondaryAmount || 0),
            secondaryAmount: splitPaycheck ? secondaryAmount : 0,
            isSplit: splitPaycheck
        });
    }

    return paychecks;
};

/**
 * Get relevant paychecks for a specific account up to a target date
 * @param {string|Date} targetDate - The target date to get paychecks up to
 * @param {number|string} accountId - The account ID to get paychecks for
 * @param {Object} paySchedule - The pay schedule configuration
 * @param {Array} accounts - Array of account objects
 * @returns {Array} Array of paycheck objects relevant to the account and target date
 */
export const getRelevantPaychecks = (targetDate, accountId, paySchedule, accounts) => {
    if (!targetDate) return [];

    const allPaychecks = generatePaycheckDates(paySchedule);
    const target = new Date(targetDate);

    return allPaychecks
        .filter(paycheck => {
            // Determine which date to use based on account
            const relevantDate = (accountId === paySchedule.secondaryAccountId && paycheck.secondaryDate)
                ? paycheck.secondaryDate
                : paycheck.primaryDate;

            return relevantDate <= target;
        })
        .map(paycheck => ({
            date: (accountId === paySchedule.secondaryAccountId && paycheck.secondaryDate)
                ? paycheck.secondaryDate
                : paycheck.primaryDate,
            amount: (accountId === paySchedule.secondaryAccountId && paycheck.secondaryDate)
                ? paycheck.secondaryAmount
                : paycheck.primaryAmount,
            type: (accountId === paySchedule.secondaryAccountId && paycheck.secondaryDate)
                ? 'secondary'
                : 'primary',
            index: paycheck.index
        }));
};

/**
 * Format a date as a string in the local format
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options for toLocaleDateString
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    });
};

/**
 * Calculate the number of days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of days between the dates
 */
export const daysBetween = (date1, date2) => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    // Convert to UTC to avoid timezone issues
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    
    // Calculate difference in days
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isDateInPast = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    // Set both dates to midnight for comparison
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate < today;
};

/**
 * Add months to a date
 * @param {Date|string} date - The date to add months to
 * @param {number} months - Number of months to add
 * @returns {Date} New date with months added
 */
export const addMonths = (date, months) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setMonth(dateObj.getMonth() + months);
    return dateObj;
};