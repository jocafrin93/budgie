/**
 * src/utils/progressUtils.js
 * Utility functions for calculating funding progress and related metrics
 */

import { getRelevantPaychecks } from './dateUtils';

/**
 * Calculate funding timeline for an expense or goal
 * @param {Object} item - The expense or goal item
 * @param {Object} paySchedule - The pay schedule configuration
 * @param {Array} accounts - Array of account objects
 * @param {number} biweeklyAllocation - The biweekly allocation amount
 * @returns {Object} Funding timeline information
 */
export const calculateFundingTimeline = (item, paySchedule, accounts, biweeklyAllocation) => {
    const deadlineDate = item.dueDate || item.targetDate;
    if (!deadlineDate) {
        return {
            hasDeadline: false,
            message: 'No deadline set',
            status: 'ongoing'
        };
    }

    const relevantPaychecks = getRelevantPaychecks(deadlineDate, item.accountId, paySchedule, accounts);
    const totalNeeded = item.targetAmount || item.amount;
    const alreadySaved = item.alreadySaved || 0;
    const remainingNeeded = Math.max(0, totalNeeded - alreadySaved);

    if (remainingNeeded <= 0) {
        return {
            hasDeadline: true,
            isFullyFunded: true,
            message: 'Fully funded!',
            status: 'complete',
            overfunded: alreadySaved - totalNeeded
        };
    }

    // Calculate how many paychecks needed at current allocation rate
    const paychecksNeeded = Math.ceil(remainingNeeded / biweeklyAllocation);
    const availablePaychecks = relevantPaychecks.length;

    // Find the funding completion date
    let fundingDate = null;
    let runningTotal = alreadySaved;

    for (let i = 0; i < Math.min(paychecksNeeded, availablePaychecks); i++) {
        runningTotal += biweeklyAllocation;
        if (runningTotal >= totalNeeded) {
            fundingDate = relevantPaychecks[i].date;
            break;
        }
    }

    const isOnTrack = paychecksNeeded <= availablePaychecks;
    const lastPaycheckDate = relevantPaychecks[availablePaychecks - 1]?.date;

    // Calculate required allocation to hit deadline
    const requiredAllocation = availablePaychecks > 0 ? remainingNeeded / availablePaychecks : 0;

    return {
        hasDeadline: true,
        isFullyFunded: false,
        totalNeeded,
        alreadySaved,
        remainingNeeded,
        paychecksNeeded,
        availablePaychecks,
        fundingDate,
        lastPaycheckDate,
        isOnTrack,
        requiredAllocation,
        currentAllocation: biweeklyAllocation,
        status: isOnTrack ? 'on-track' : 'behind',
        message: getTimelineMessage({
            isOnTrack,
            paychecksNeeded,
            availablePaychecks,
            fundingDate,
            lastPaycheckDate,
            requiredAllocation,
            currentAllocation: biweeklyAllocation,
            paySchedule
        })
    };
};

/**
 * Generate user-friendly timeline message
 * @param {Object} params - Parameters for generating the message
 * @returns {string} User-friendly timeline message
 */
export const getTimelineMessage = ({
    isOnTrack,
    paychecksNeeded,
    availablePaychecks,
    fundingDate,
    lastPaycheckDate,
    requiredAllocation,
    currentAllocation,
    paySchedule
}) => {
    const frequencyLabel = getFrequencyLabel(paySchedule.frequency);

    if (isOnTrack && fundingDate) {
        return `Ready in ${paychecksNeeded} ${frequencyLabel}${paychecksNeeded === 1 ? '' : 's'} (${fundingDate.toLocaleDateString()})`;
    }

    if (!isOnTrack && lastPaycheckDate) {
        const shortfall = requiredAllocation - currentAllocation;
        return `Behind schedule - need $${requiredAllocation.toFixed(2)}/${frequencyLabel.slice(0, -1)} (currently $${currentAllocation.toFixed(2)}) - shortfall: $${shortfall.toFixed(2)}/${frequencyLabel.slice(0, -1)}`;
    }

    return 'Unable to calculate timeline';
};

/**
 * Get friendly frequency label
 * @param {string} frequency - The frequency value
 * @returns {string} Friendly label for the frequency
 */
export const getFrequencyLabel = (frequency) => {
    switch (frequency) {
        case 'weekly': return 'paycheck';
        case 'bi-weekly': return 'paycheck';
        case 'semi-monthly': return 'pay period';
        case 'monthly': return 'payment';
        default: return 'paycheck';
    }
};

/**
 * Calculate urgency score (0-100, higher = more urgent)
 * @param {Object} timeline - The funding timeline
 * @returns {number} Urgency score (0-100)
 */
export const calculateUrgencyScore = (timeline) => {
    if (!timeline.hasDeadline || timeline.isFullyFunded) return 0;

    if (!timeline.isOnTrack) return 100; // Maximum urgency if behind

    // Calculate urgency based on remaining time
    const urgencyRatio = timeline.paychecksNeeded / Math.max(timeline.availablePaychecks, 1);
    return Math.min(100, urgencyRatio * 100);
};

/**
 * Get urgency indicator based on urgency score
 * @param {number} urgencyScore - The urgency score (0-100)
 * @returns {Object} Urgency indicator with emoji, label, and color
 */
export const getUrgencyIndicator = (urgencyScore) => {
    if (urgencyScore >= 80) return { emoji: '🔴', label: 'Critical', color: 'text-red-600' };
    if (urgencyScore >= 60) return { emoji: '🟡', label: 'High', color: 'text-yellow-600' };
    if (urgencyScore >= 30) return { emoji: '🟢', label: 'Medium', color: 'text-green-600' };
    return { emoji: '⚪', label: 'Low', color: 'text-theme-secondary' };
};

/**
 * Calculate funding progress percentage
 * @param {number} alreadySaved - Amount already saved
 * @param {number} targetAmount - Target amount
 * @returns {number} Progress percentage (0-100)
 */
export const calculateFundingProgress = (alreadySaved, targetAmount) => {
    if (!targetAmount || targetAmount <= 0) return 0;
    return Math.min(100, (alreadySaved / targetAmount) * 100);
};

/**
 * Check if an item is fully funded
 * @param {number} alreadySaved - Amount already saved
 * @param {number} targetAmount - Target amount
 * @returns {boolean} True if fully funded
 */
export const isFullyFunded = (alreadySaved, targetAmount) => {
    if (!targetAmount || targetAmount <= 0) return false;
    return alreadySaved >= targetAmount;
};

/**
 * Calculate remaining amount needed
 * @param {number} alreadySaved - Amount already saved
 * @param {number} targetAmount - Target amount
 * @returns {number} Remaining amount needed
 */
export const calculateRemainingNeeded = (alreadySaved, targetAmount) => {
    return Math.max(0, targetAmount - alreadySaved);
};

/**
 * Get funding status text
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} Funding status text
 */
export const getFundingStatusText = (progress) => {
    if (progress >= 100) return 'Fully Funded';
    if (progress >= 75) return 'Almost There';
    if (progress >= 50) return 'Halfway There';
    if (progress >= 25) return 'Getting Started';
    return 'Just Beginning';
};