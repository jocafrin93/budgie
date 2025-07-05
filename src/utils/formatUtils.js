/**
 * src/utils/formatUtils.js
 * Utility functions for formatting and display
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
 * Format a percentage value
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {boolean} includeSymbol - Whether to include the % symbol (default: true)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1, includeSymbol = true) => {
    if (value === null || value === undefined || isNaN(value)) {
        return includeSymbol ? '0%' : '0';
    }

    const formattedValue = value.toFixed(decimals);
    return includeSymbol ? `${formattedValue}%` : formattedValue;
};

/**
 * Format a date as a string
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
 * Format a number with commas
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
    if (number === null || number === undefined || isNaN(number)) {
        return '0';
    }

    return number.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Format a frequency for display
 * @param {string} frequency - The frequency value
 * @returns {string} Formatted frequency string
 */
export const formatFrequency = (frequency) => {
    switch (frequency) {
        case 'weekly': return 'Weekly';
        case 'bi-weekly': return 'Bi-weekly';
        case 'every-3-weeks': return 'Every 3 Weeks';
        case 'monthly': return 'Monthly';
        case 'every-5-weeks': return 'Every 5 Weeks';
        case 'every-6-weeks': return 'Every 6 Weeks';
        case 'every-7-weeks': return 'Every 7 Weeks';
        case 'bi-monthly': return 'Every Other Month';
        case 'quarterly': return 'Quarterly';
        case 'semi-annually': return 'Every 6 Months';
        case 'annually': return 'Annually';
        case 'per-paycheck': return 'Per Paycheck';
        // Handle any legacy values
        case 'biweekly': return 'Bi-weekly';
        case 'semiannually': return 'Every 6 Months';
        default: return frequency ? frequency.charAt(0).toUpperCase() + frequency.slice(1) : 'Monthly';
    }
};

/**
 * Format a priority state for display
 * @param {string} priorityState - The priority state value
 * @returns {string} Formatted priority state string
 */
export const formatPriorityState = (priorityState) => {
    switch (priorityState) {
        case 'active': return 'Active';
        case 'paused': return 'Paused';
        case 'complete': return 'Complete';
        default: return priorityState;
    }
};

/**
 * Get a color class based on a value and thresholds
 * @param {number} value - The value to evaluate
 * @param {number} warningThreshold - The warning threshold
 * @param {number} dangerThreshold - The danger threshold
 * @param {boolean} inverse - Whether to inverse the thresholds (default: false)
 * @returns {string} Tailwind CSS color class
 */
export const getColorClass = (value, warningThreshold, dangerThreshold, inverse = false) => {
    if (inverse) {
        if (value <= dangerThreshold) return 'text-red-600';
        if (value <= warningThreshold) return 'text-yellow-600';
        return 'text-green-600';
    } else {
        if (value >= dangerThreshold) return 'text-red-600';
        if (value >= warningThreshold) return 'text-yellow-600';
        return 'text-green-600';
    }
};

/**
 * Truncate a string to a maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @param {string} suffix - The suffix to add if truncated (default: '...')
 * @returns {string} Truncated string
 */
export const truncateString = (str, maxLength, suffix = '...') => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + suffix;
};

/**
 * Format a time period for display
 * @param {number} days - Number of days
 * @returns {string} Formatted time period string
 */
export const formatTimePeriod = (days) => {
    if (days < 0) return 'Past due';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `${days} days`;
    if (days < 14) return '1 week';
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    if (days < 60) return '1 month';
    if (days < 365) return `${Math.floor(days / 30)} months`;
    if (days < 730) return '1 year';
    return `${Math.floor(days / 365)} years`;
};

/**
 * Format a budget item for display in exports or reports
 * @param {Object} item - The budget item
 * @param {string} viewMode - The view mode ('amount' or 'percentage')
 * @param {number} income - The income amount
 * @param {Array} frequencyOptions - The frequency options
 * @returns {string} Formatted budget item string
 */
export const formatBudgetItem = (item, viewMode = 'amount', income = 0, frequencyOptions = []) => {
    const itemType = item.targetAmount ? 'Goal' : 'Expense';
    const itemName = item.name || 'Unnamed Item';
    const amount = item.biweeklyAmount || 0;
    const percentage = income > 0 ? (amount / income) * 100 : 0;
    const frequency = item.frequency ?
        frequencyOptions.find(f => f.value === item.frequency)?.label.toLowerCase() || item.frequency :
        'unknown';
    const isPaused = item.priorityState === 'paused';
    const isComplete = item.isFullyFunded || item.priorityState === 'complete';

    let formattedAmount;
    if (viewMode === 'amount') {
        formattedAmount = `$${amount.toFixed(2)}`;
    } else {
        formattedAmount = `${percentage.toFixed(1)}%`;
    }

    let result = `${itemName}${itemType === 'Goal' ? ' (Goal)' : ''}: ${formattedAmount}/paycheck`;

    if (itemType === 'Expense') {
        result += ` (${item.amount} ${frequency})`;
    }

    if (isPaused) result += ' [PAUSED]';
    if (isComplete) result += itemType === 'Goal' ? ' [COMPLETE]' : ' [FUNDED]';

    return result;
};