// src/components/budget/UpcomingPaychecks.jsx
import { useEffect, useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { Card } from '../ui/Card/index.jsx';
import { Timeline, TimelineItem } from '../ui/Timeline/index.jsx';
import { getGradientStyle } from '../../utils/gradientUtils';
import { getDaysBetweenOccurrences } from '../../utils/frequencyUtils';

/**
 * Component to display upcoming paychecks and scheduled transactions
 * Shows calendar grid on desktop, timeline on mobile
 */
const UpcomingPaychecks = ({
    accounts = [],
    categories = [],
    planningItems = [],
    showHeader = true,
    maxPaychecks = 5
}) => {
    const {
        paychecks,
        getAllUpcomingPaycheckDates,
        calculateTotalMonthlyIncome
    } = usePaycheckManagement(accounts);

    const { getUpcomingScheduledTransactions } = useScheduledTransactions();

    const [upcomingPaychecks, setUpcomingPaychecks] = useState([]);
    const [upcomingTransactions, setUpcomingTransactions] = useState([]);
    const [upcomingBudgetItems, setUpcomingBudgetItems] = useState([]);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [calendarData, setCalendarData] = useState([]);
    const [showAllDueDates, setShowAllDueDates] = useState(true); // Toggle between scheduled transactions only vs all due dates

    // Update upcoming paychecks and transactions when data changes
    useEffect(() => {
        try {
            const upcoming = getAllUpcomingPaycheckDates ? getAllUpcomingPaycheckDates(3) : [];
            setUpcomingPaychecks(Array.isArray(upcoming) ? upcoming.slice(0, maxPaychecks) : []);

            const scheduledTxns = getUpcomingScheduledTransactions ? getUpcomingScheduledTransactions() : [];
            setUpcomingTransactions(Array.isArray(scheduledTxns) ? scheduledTxns.slice(0, 10) : []);

            const monthly = calculateTotalMonthlyIncome ? calculateTotalMonthlyIncome() : 0;
            setMonthlyIncome(typeof monthly === 'number' ? monthly : 0);
        } catch (error) {
            console.error('Error updating upcoming items:', error);
            setUpcomingPaychecks([]);
            setUpcomingTransactions([]);
            setMonthlyIncome(0);
        }
    }, [paychecks, getAllUpcomingPaycheckDates, calculateTotalMonthlyIncome, maxPaychecks, getUpcomingScheduledTransactions]);

    // Extract budget items with due dates
    useEffect(() => {
        try {
            const budgetItems = [];
            const today = new Date();
            const futureLimit = new Date();
            futureLimit.setMonth(futureLimit.getMonth() + 2); // Show items up to 2 months ahead

            // Get scheduled transaction dates to avoid duplicates
            const scheduledTransactionDates = new Set();
            upcomingTransactions.forEach(txn => {
                const txnDate = txn.scheduledDate || txn.nextDueDate || txn.dueDate || txn.date;
                if (txnDate) {
                    // Create a unique key combining date and name/description for duplicate detection
                    const dateStr = new Date(txnDate).toISOString().split('T')[0];
                    const name = txn.description || txn.payee || '';
                    scheduledTransactionDates.add(`${dateStr}-${name.toLowerCase()}`);
                }
            });

            // Helper function to generate recurring occurrences
            const generateRecurringOccurrences = (baseItem, startDate, frequency, name, amount, category, color) => {
                const occurrences = [];
                let currentDate = new Date(startDate);

                // Skip past dates to find the next occurrence
                while (currentDate < today) {
                    const daysBetween = getDaysBetweenOccurrences(frequency || 'monthly');
                    currentDate.setDate(currentDate.getDate() + daysBetween);
                }

                // Generate future occurrences within the limit
                let occurrenceCount = 0;
                while (currentDate <= futureLimit && occurrenceCount < 10) { // Limit to 10 occurrences
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const duplicateKey = `${dateStr}-${name.toLowerCase()}`;

                    // Only add if not already covered by a scheduled transaction
                    if (!scheduledTransactionDates.has(duplicateKey)) {
                        const daysUntil = Math.ceil((currentDate - today) / (1000 * 60 * 60 * 24));
                        occurrences.push({
                            id: `${baseItem.id}-occurrence-${occurrenceCount}`,
                            type: 'budget-item',
                            itemType: baseItem.itemType,
                            name: name,
                            amount: amount,
                            dueDate: dateStr,
                            date: dateStr,
                            daysUntil,
                            category: category,
                            color: color || 'bg-primary-500',
                            frequency: frequency,
                            isRecurring: true
                        });
                    }

                    // Move to next occurrence
                    const daysBetween = getDaysBetweenOccurrences(frequency || 'monthly');
                    currentDate.setDate(currentDate.getDate() + daysBetween);
                    occurrenceCount++;
                }

                return occurrences;
            };

            // Process categories with due dates
            categories.forEach(category => {
                if (category.dueDate) {
                    const frequency = category.frequency || 'monthly';

                    if (frequency === 'once') {
                        // Handle one-time items
                        const dueDate = new Date(category.dueDate);
                        if (dueDate >= today && dueDate <= futureLimit) {
                            const dateStr = dueDate.toISOString().split('T')[0];
                            const duplicateKey = `${dateStr}-${category.name.toLowerCase()}`;

                            if (!scheduledTransactionDates.has(duplicateKey)) {
                                const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                budgetItems.push({
                                    id: `category-${category.id}`,
                                    type: 'budget-item',
                                    itemType: 'category',
                                    name: category.name,
                                    amount: category.amount,
                                    dueDate: category.dueDate,
                                    date: category.dueDate,
                                    daysUntil,
                                    category: category,
                                    color: category.color || 'bg-primary-500',
                                    isRecurring: false
                                });
                            }
                        }
                    } else {
                        // Handle recurring items
                        const occurrences = generateRecurringOccurrences(
                            { id: `category-${category.id}`, itemType: 'category' },
                            category.dueDate,
                            frequency,
                            category.name,
                            category.amount,
                            category,
                            category.color
                        );
                        budgetItems.push(...occurrences);
                    }
                }
            });

            // Process planning items with due dates (only active items)
            planningItems
                .filter(item => item.isActive !== false) // Only include active items
                .forEach(item => {
                    if (item.dueDate) {
                        const frequency = item.frequency || 'monthly';
                        const itemName = item.name || item.description || '';
                        const parentCategory = categories.find(cat => cat.id === item.categoryId);

                        if (frequency === 'once') {
                            // Handle one-time items
                            const dueDate = new Date(item.dueDate);
                            if (dueDate >= today && dueDate <= futureLimit) {
                                const dateStr = dueDate.toISOString().split('T')[0];
                                const duplicateKey = `${dateStr}-${itemName.toLowerCase()}`;

                                if (!scheduledTransactionDates.has(duplicateKey)) {
                                    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                    budgetItems.push({
                                        id: `item-${item.id}`,
                                        type: 'budget-item',
                                        itemType: 'planning-item',
                                        name: itemName,
                                        amount: item.amount,
                                        dueDate: item.dueDate,
                                        date: item.dueDate,
                                        daysUntil,
                                        category: parentCategory,
                                        color: parentCategory?.color || 'bg-primary-500',
                                        isRecurring: false
                                    });
                                }
                            }
                        } else {
                            // Handle recurring items
                            const occurrences = generateRecurringOccurrences(
                                { id: `item-${item.id}`, itemType: 'planning-item' },
                                item.dueDate,
                                frequency,
                                itemName,
                                item.amount,
                                parentCategory,
                                parentCategory?.color
                            );
                            budgetItems.push(...occurrences);
                        }
                    }
                });

            // Sort by date
            budgetItems.sort((a, b) => new Date(a.date) - new Date(b.date));
            setUpcomingBudgetItems(budgetItems);
        } catch (error) {
            console.error('Error processing budget items:', error);
            setUpcomingBudgetItems([]);
        }
    }, [categories, planningItems, upcomingTransactions]);

    // Generate calendar data for desktop view
    useEffect(() => {
        const generateCalendarData = () => {
            try {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                // Get today's date in local timezone for accurate comparison
                const todayLocal = new Date();
                const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

                // Get first day of month and number of days
                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startingDayOfWeek = firstDay.getDay();

                // Create calendar grid
                const calendar = [];
                let week = [];

                // Add empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                    week.push(null);
                }

                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(currentYear, currentMonth, day);
                    const dateStr = date.toISOString().split('T')[0];

                    // Find paychecks for this day (with safety checks)
                    const dayPaychecks = Array.isArray(upcomingPaychecks) ? upcomingPaychecks.filter(paycheck => {
                        try {
                            if (!paycheck || !paycheck.date) return false;
                            const paycheckDate = new Date(paycheck.date).toISOString().split('T')[0];
                            return paycheckDate === dateStr;
                        } catch (e) {
                            console.warn('Error processing paycheck date:', e);
                            return false;
                        }
                    }) : [];

                    // Find scheduled transactions for this day (with safety checks)
                    // Only show scheduled transactions when NOT showing all due dates
                    const dayTransactions = !showAllDueDates && Array.isArray(upcomingTransactions) ? upcomingTransactions.filter(txn => {
                        try {
                            if (!txn) return false;
                            // Check multiple possible date fields for scheduled transactions
                            const txnDate = txn.scheduledDate || txn.nextDueDate || txn.dueDate || txn.date;
                            if (!txnDate) return false;
                            const normalizedDate = new Date(txnDate).toISOString().split('T')[0];
                            return normalizedDate === dateStr;
                        } catch (e) {
                            console.warn('Error processing transaction date:', e);
                            return false;
                        }
                    }) : [];

                    // Find budget items for this day (if showAllDueDates is enabled)
                    const dayBudgetItems = showAllDueDates && Array.isArray(upcomingBudgetItems) ? upcomingBudgetItems.filter(item => {
                        try {
                            if (!item || !item.date) return false;
                            const itemDate = new Date(item.date).toISOString().split('T')[0];
                            return itemDate === dateStr;
                        } catch (e) {
                            console.warn('Error processing budget item date:', e);
                            return false;
                        }
                    }) : [];

                    week.push({
                        day,
                        date,
                        isToday: dateStr === todayStr,
                        paychecks: dayPaychecks,
                        transactions: dayTransactions,
                        budgetItems: dayBudgetItems
                    });

                    // Start new week on Sunday
                    if (week.length === 7) {
                        calendar.push(week);
                        week = [];
                    }
                }

                // Add remaining days to last week
                if (week.length > 0) {
                    while (week.length < 7) {
                        week.push(null);
                    }
                    calendar.push(week);
                }

                setCalendarData(calendar);
            } catch (error) {
                console.error('Error generating calendar data:', error);
                setCalendarData([]);
            }
        };

        generateCalendarData();
    }, [upcomingPaychecks, upcomingTransactions, upcomingBudgetItems, showAllDueDates]);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Format date for display
    const formatDateForDisplay = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get timeline item color based on urgency
    const getTimelineColor = (daysUntil) => {
        if (daysUntil === 0) {
            return 'success';
        } else if (daysUntil <= 3) {
            return 'primary';
        } else if (daysUntil <= 7) {
            return 'warning';
        } else {
            return 'neutral';
        }
    };

    // Get days until text
    const getDaysUntilText = (daysUntil) => {
        if (daysUntil === 0) return 'Today! 🎉';
        if (daysUntil === 1) return 'Tomorrow';
        if (daysUntil <= 7) return `In ${daysUntil} days`;
        return `In ${daysUntil} days`;
    };

    // Get account name by ID
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'Unknown Account';
    };

    // Get timeline item title
    const getTimelineTitle = (item, isNext = false) => {
        const prefix = isNext ? '💰 Next: ' : '';
        if (item.paycheck) {
            return `${prefix}${item.paycheck.name}`;
        } else {
            return `${prefix}${item.description || item.payee || 'Transaction'}`;
        }
    };

    // Combine and sort paychecks, transactions, and budget items for timeline
    const timelineItems = [
        ...upcomingPaychecks.map(p => ({ ...p, type: 'paycheck' })),
        // Only include scheduled transactions when NOT showing all due dates
        ...(!showAllDueDates ? upcomingTransactions.map(t => ({
            ...t,
            type: 'transaction',
            date: t.scheduledDate || t.nextDueDate || t.dueDate || t.date
        })) : []),
        ...(showAllDueDates ? upcomingBudgetItems : [])
    ];
    timelineItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (paychecks.length === 0 && upcomingTransactions.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold mb-2 text-base-content">No Upcoming Items</h3>
                    <p className="text-base-content/60 mb-4">
                        Set up your paychecks and scheduled transactions to see upcoming dates.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-3 sm:p-6 bg-base-200">
            {showHeader && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-base-content">Upcoming Events</h3>
                        <p className="text-sm text-base-content/60 hidden md:block">
                            {showAllDueDates
                                ? 'Calendar view of paychecks and all items with due dates'
                                : 'Calendar view of paychecks and scheduled transactions'
                            }
                        </p>
                        <p className="text-sm text-base-content/60 md:hidden">
                            {showAllDueDates
                                ? 'Timeline of paychecks and all items with due dates'
                                : 'Timeline of paychecks and scheduled transactions'
                            }
                        </p>
                    </div>

                    {/* Monthly Income Summary */}
                    <div className="text-right">
                        <div className="text-sm text-base-content/60">Monthly Income</div>
                        <div className="text-xl font-bold text-secondary">
                            {formatCurrency(monthlyIncome)}
                        </div>
                    </div>
                </div>
            )}

            {/* View Toggle Control */}
            <div className="mb-4 flex justify-center">
                <div className="bg-base-100 rounded-lg p-1 border border-base-300">
                    <button
                        onClick={() => setShowAllDueDates(false)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${!showAllDueDates
                            ? 'bg-primary text-primary-content shadow-sm'
                            : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                            }`}
                    >
                        📅 Scheduled Only
                    </button>
                    <button
                        onClick={() => setShowAllDueDates(true)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${showAllDueDates
                            ? 'bg-primary text-primary-content shadow-sm'
                            : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                            }`}
                    >
                        🗓️ All Due Dates
                    </button>
                </div>
            </div>

            {/* Desktop Calendar View - Hidden on small screens */}
            <div className="hidden lg:block">
                {calendarData.length > 0 && (
                    <div className="space-y-4">
                        {/* Calendar Header */}
                        <div className="text-center">
                            <h4 className="text-lg font-semibold text-base-content">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h4>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-base-content/60 border-b border-base-300">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {calendarData.flat().map((dayData, index) => (
                                <div
                                    key={index}
                                    className={`min-h-[80px] p-1 border ${dayData?.isToday
                                        ? 'border-primary border-2 bg-primary/5'
                                        : dayData
                                            ? 'border-base-300 bg-base-100'
                                            : 'border-base-300 bg-base-200'
                                        }`}
                                >
                                    {dayData && (
                                        <>
                                            <div className={`text-sm font-medium mb-1 ${dayData.isToday ? 'text-primary' : 'text-base-content'
                                                }`}>
                                                {dayData.day}
                                            </div>

                                            {/* Paychecks */}
                                            {dayData.paychecks.map((paycheck, idx) => (
                                                <div key={`paycheck-${idx}`} className="text-xs bg-secondary text-secondary-content px-1 py-0.5 rounded mb-1 truncate">
                                                    💰 {paycheck.paycheck.name}
                                                </div>
                                            ))}

                                            {/* Scheduled Transactions */}
                                            {dayData.transactions.map((txn, idx) => (
                                                <div key={`txn-${idx}`} className="text-xs bg-accent text-accent-content px-1 py-0.5 rounded mb-1 truncate">
                                                    📅 {txn.description || txn.payee || 'Transaction'}
                                                </div>
                                            ))}

                                            {/* Budget Items (when showAllDueDates is enabled) */}
                                            {dayData.budgetItems && dayData.budgetItems.map((item, idx) => {
                                                // Get gradient style using the utility function
                                                const gradientStyle = getGradientStyle(item.color);
                                                const hasGradient = Object.keys(gradientStyle).length > 0;

                                                return (
                                                    <div
                                                        key={`budget-${idx}`}
                                                        className={`text-xs px-1 py-0.5 rounded mb-1 truncate text-white ${!hasGradient ? (item.color || 'bg-info') : ''}`}
                                                        style={hasGradient ? gradientStyle : {}}
                                                    >
                                                        💳 {item.name}
                                                        {item.amount && (
                                                            <span className="block text-xs opacity-90">
                                                                {formatCurrency(item.amount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Timeline View */}
            <div className="lg:hidden">
                {timelineItems.length > 0 ? (
                    <Timeline variant="filled" pointSize="12px" lineWidth="2px">
                        {timelineItems.slice(0, maxPaychecks).map((item, index) => {
                            const isNext = index === 0;
                            const timelineColor = getTimelineColor(item.daysUntil || 0);

                            return (
                                <TimelineItem
                                    key={`${item.type}-${item.id || index}-${item.date}`}
                                    title={getTimelineTitle(item, isNext)}
                                    time={item.date}
                                    color={timelineColor}
                                    isPing={isNext && (item.daysUntil || 0) <= 1}
                                >
                                    <div className="space-y-3">
                                        {/* Main Item Info */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {item.type === 'paycheck' ? (
                                                    <>
                                                        <div className="font-bold text-secondary text-lg">
                                                            {formatCurrency(item.paycheck.baseAmount)}
                                                        </div>
                                                        <div className="text-sm text-base-content/60">
                                                            {formatDateForDisplay(item.date)} • {getDaysUntilText(item.daysUntil)}
                                                        </div>
                                                    </>
                                                ) : item.type === 'budget-item' ? (
                                                    <>
                                                        <div className="font-bold text-info text-lg">
                                                            💳 {item.name}
                                                        </div>
                                                        <div className="text-sm text-base-content/60">
                                                            {formatDateForDisplay(item.date)} • {getDaysUntilText(item.daysUntil)}
                                                        </div>
                                                        {item.amount && (
                                                            <div className="text-sm font-medium text-base-content">
                                                                {formatCurrency(item.amount)}
                                                            </div>
                                                        )}
                                                        {item.category && (
                                                            <div className="text-xs text-base-content/60">
                                                                Category: {item.category.name}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="font-bold text-warning text-lg">
                                                            📅 {item.description || item.payee || 'Transaction'}
                                                        </div>
                                                        <div className="text-sm text-base-content/60">
                                                            {formatDateForDisplay(item.date)}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Payday Action Button */}
                                            {/* {onStartPaydayWorkflow && item.type === 'paycheck' && isNext && (item.daysUntil || 0) <= 1 && (
                                                <button
                                                    onClick={() => onStartPaydayWorkflow(item)}
                                                    className="btn btn-success btn-sm"
                                                >
                                                    💰 Start Payday
                                                </button>
                                            )} */}
                                        </div>

                                        {/* Account Distribution for paychecks */}
                                        {item.type === 'paycheck' && item.paycheck.accountDistribution && item.paycheck.accountDistribution.length > 1 && (
                                            <div className="bg-base-200 rounded-lg p-3">
                                                <div className="text-xs font-medium text-base-content/70 mb-2">
                                                    Account Distribution:
                                                </div>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {item.paycheck.accountDistribution.map((dist, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-base-content/80">{getAccountName(dist.accountId)}</span>
                                                            <span className="font-medium text-base-content">{formatCurrency(dist.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Next Item Special Styling */}
                                        {isNext && (
                                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                                                <div className="text-xs text-primary font-medium">
                                                    🎯 Next item - {item.type === 'paycheck' ? getDaysUntilText(item.daysUntil) : 'Scheduled'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-base-content/60 mb-2">📅</div>
                        <p className="text-base-content/60">
                            No upcoming items found.
                        </p>
                    </div>
                )}
            </div>

            {/* Today's Date Reference */}
            <div className="mt-6 pt-4 border-t border-base-300">
                <div className="text-xs text-base-content/60 text-center">
                    Today: {formatDateForDisplay(new Date())} • Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
            </div>
        </Card>
    );
};

export default UpcomingPaychecks;
