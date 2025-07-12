// src/components/budget/UpcomingPaychecks.jsx
import { useEffect, useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import { useScheduledTransactions } from '../../hooks/useScheduledTransactions';
import { Button } from '../ui/Button/index.jsx';
import { Card } from '../ui/Card/index.jsx';
import { Timeline, TimelineItem } from '../ui/Timeline/index.jsx';

/**
 * Component to display upcoming paychecks and scheduled transactions
 * Shows calendar grid on desktop, timeline on mobile
 */
const UpcomingPaychecks = ({
    accounts = [],
    onStartPaydayWorkflow,
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
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [calendarData, setCalendarData] = useState([]);

    // Update upcoming paychecks and transactions when data changes
    useEffect(() => {
        const upcoming = getAllUpcomingPaycheckDates(3); // Get next 3 months
        setUpcomingPaychecks(upcoming.slice(0, maxPaychecks));

        const scheduledTxns = getUpcomingScheduledTransactions();
        setUpcomingTransactions(scheduledTxns.slice(0, 10)); // Limit to 10 transactions

        const monthly = calculateTotalMonthlyIncome();
        setMonthlyIncome(monthly);
    }, [paychecks, getAllUpcomingPaycheckDates, calculateTotalMonthlyIncome, maxPaychecks, getUpcomingScheduledTransactions]);

    // Generate calendar data for desktop view
    useEffect(() => {
        const generateCalendarData = () => {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

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

                // Find paychecks for this day
                const dayPaychecks = upcomingPaychecks.filter(paycheck => {
                    const paycheckDate = new Date(paycheck.date).toISOString().split('T')[0];
                    return paycheckDate === dateStr;
                });

                // Find scheduled transactions for this day
                const dayTransactions = upcomingTransactions.filter(txn => {
                    const txnDate = new Date(txn.nextDueDate || txn.dueDate).toISOString().split('T')[0];
                    return txnDate === dateStr;
                });

                week.push({
                    day,
                    date,
                    isToday: dateStr === today.toISOString().split('T')[0],
                    paychecks: dayPaychecks,
                    transactions: dayTransactions
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
        };

        generateCalendarData();
    }, [upcomingPaychecks, upcomingTransactions]);

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

    // Combine and sort paychecks and transactions for timeline
    const timelineItems = [...upcomingPaychecks.map(p => ({ ...p, type: 'paycheck' })),
    ...upcomingTransactions.map(t => ({ ...t, type: 'transaction', date: t.nextDueDate || t.dueDate }))];
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
        <Card className="p-6 bg-base-100">
            {showHeader && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-base-content">Upcoming Events</h3>
                        <p className="text-sm text-base-content/60 hidden md:block">
                            Calendar view of paychecks and scheduled transactions
                        </p>
                        <p className="text-sm text-base-content/60 md:hidden">
                            Timeline of paychecks and scheduled transactions
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

            {/* Desktop Calendar View */}
            <div className="hidden md:block">
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
                                    className={`min-h-[80px] p-1 border border-alert ${dayData ? 'bg-base-100' : 'bg-base-300'
                                        }`}
                                    style={dayData?.isToday ? {
                                        borderWidth: '2px',
                                        borderColor: 'rgb(var(--color-accent))',
                                        boxShadow: '0 0 0 1px rgb(var(--color-primary) / 0.3)'
                                    } : {}}
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
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Timeline View */}
            <div className="md:hidden">
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
                                            {onStartPaydayWorkflow && item.type === 'paycheck' && isNext && (item.daysUntil || 0) <= 1 && (
                                                <Button
                                                    onClick={() => onStartPaydayWorkflow(item)}
                                                    color="success"
                                                    variant="filled"
                                                    size="sm"
                                                >
                                                    💰 Start Payday
                                                </Button>
                                            )}
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
