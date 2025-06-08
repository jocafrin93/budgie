// hooks/usePaycheckTimeline.js
import { useMemo } from 'react';
import { calculateFundingTimeline, calculateUrgencyScore, getUrgencyIndicator } from '../utils/paycheckTimelineUtils';

export const usePaycheckTimeline = ({
    expenses,
    savingsGoals,
    paySchedule,
    accounts,
    expenseAllocations,
    goalAllocations
}) => {

    const timelineData = useMemo(() => {
        // Return empty data if required props are missing
        if (!paySchedule || !accounts || !paySchedule.startDate || !expenseAllocations || !goalAllocations) {
            return {
                all: [],
                byUrgency: [],
                critical: [],
                upcoming: [],
                onTrack: [],
                noDeadline: [],
                summary: {
                    totalItems: 0,
                    withDeadlines: 0,
                    critical: 0,
                    onTrack: 0,
                    fullyFunded: 0
                }
            };
        }
        // Calculate timelines for expenses
        const expenseTimelines = expenses.map(expense => {
            const allocation = expenseAllocations.find(alloc => alloc.id === expense.id);
            const biweeklyAmount = allocation?.biweeklyAmount || 0;

            const timeline = calculateFundingTimeline(
                expense,
                paySchedule,
                accounts,
                biweeklyAmount
            );

            const urgencyScore = calculateUrgencyScore(timeline);
            const urgencyIndicator = getUrgencyIndicator(urgencyScore);

            return {
                id: expense.id,
                type: 'expense',
                name: expense.name,
                timeline,
                urgencyScore,
                urgencyIndicator,
                allocation: biweeklyAmount,
                item: expense
            };
        });

        // Calculate timelines for goals
        const goalTimelines = savingsGoals.map(goal => {
            const allocation = goalAllocations.find(alloc => alloc.id === goal.id);
            const biweeklyAmount = allocation?.biweeklyAmount || 0;

            const timeline = calculateFundingTimeline(
                goal,
                paySchedule,
                accounts,
                biweeklyAmount
            );

            const urgencyScore = calculateUrgencyScore(timeline);
            const urgencyIndicator = getUrgencyIndicator(urgencyScore);

            return {
                id: goal.id,
                type: 'goal',
                name: goal.name,
                timeline,
                urgencyScore,
                urgencyIndicator,
                allocation: biweeklyAmount,
                item: goal
            };
        });

        // Combine and sort by urgency
        const allTimelines = [...expenseTimelines, ...goalTimelines];
        const sortedByUrgency = allTimelines
            .filter(item => item.timeline.hasDeadline)
            .sort((a, b) => b.urgencyScore - a.urgencyScore);

        // Categorize items
        const criticalItems = sortedByUrgency.filter(item => item.urgencyScore >= 80);
        const upcomingItems = sortedByUrgency.filter(item => item.urgencyScore >= 30 && item.urgencyScore < 80);
        const onTrackItems = sortedByUrgency.filter(item => item.urgencyScore < 30);
        const noDeadlineItems = allTimelines.filter(item => !item.timeline.hasDeadline);

        return {
            all: allTimelines,
            byUrgency: sortedByUrgency,
            critical: criticalItems,
            upcoming: upcomingItems,
            onTrack: onTrackItems,
            noDeadline: noDeadlineItems,
            summary: {
                totalItems: allTimelines.length,
                withDeadlines: sortedByUrgency.length,
                critical: criticalItems.length,
                onTrack: onTrackItems.filter(item => item.timeline.isOnTrack).length,
                fullyFunded: allTimelines.filter(item => item.timeline.isFullyFunded).length
            }
        };
    }, [expenses, savingsGoals, paySchedule, accounts, expenseAllocations, goalAllocations]);

    // Helper function to get timeline for specific item
    const getTimelineForItem = (itemId, itemType) => {
        return timelineData.all.find(item => item.id === itemId && item.type === itemType);
    };

    // Helper function to get next critical deadline
    const getNextCriticalDeadline = () => {
        return timelineData.critical[0] || timelineData.upcoming[0] || null;
    };

    // Helper function to check if allocations need adjustment
    const getAllocationSuggestions = () => {
        return timelineData.critical.map(item => ({
            ...item,
            suggestedAllocation: item.timeline.requiredAllocation,
            currentShortfall: item.timeline.requiredAllocation - item.allocation
        }));
    };

    return {
        timelines: timelineData,
        getTimelineForItem,
        getNextCriticalDeadline,
        getAllocationSuggestions
    };
};