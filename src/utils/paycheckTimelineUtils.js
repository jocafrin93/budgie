// utils/paycheckTimelineUtils.js

/**
 * Generate paycheck dates based on frequency and schedule
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
 * Calculate funding timeline for an expense or goal
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
 */
const getTimelineMessage = ({
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
 */
const getFrequencyLabel = (frequency) => {
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
 */
export const calculateUrgencyScore = (timeline) => {
    if (!timeline.hasDeadline || timeline.isFullyFunded) return 0;

    if (!timeline.isOnTrack) return 100; // Maximum urgency if behind

    // Calculate urgency based on remaining time
    const urgencyRatio = timeline.paychecksNeeded / Math.max(timeline.availablePaychecks, 1);
    return Math.min(100, urgencyRatio * 100);
};

/**
 * Get urgency indicator
 */
export const getUrgencyIndicator = (urgencyScore) => {
    if (urgencyScore >= 80) return { emoji: '🔴', label: 'Critical', color: 'text-red-600' };
    if (urgencyScore >= 60) return { emoji: '🟡', label: 'High', color: 'text-yellow-600' };
    if (urgencyScore >= 30) return { emoji: '🟢', label: 'Medium', color: 'text-green-600' };
    return { emoji: '⚪', label: 'Low', color: 'text-gray-600' };
};