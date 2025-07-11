// src/components/budget/UpcomingPaychecks.jsx
import { useEffect, useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import { Button } from '../ui/Button/index.jsx';
import { Card } from '../ui/Card/index.jsx';

/**
 * Component to display upcoming paychecks with timezone-safe date handling
 * Shows next paycheck, upcoming paychecks, and provides payday workflow integration
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
        getNextPaycheckDate,
        calculateTotalMonthlyIncome
    } = usePaycheckManagement(accounts);

    const [upcomingPaychecks, setUpcomingPaychecks] = useState([]);
    const [nextPaycheck, setNextPaycheck] = useState(null);
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    // Update upcoming paychecks when paychecks change
    useEffect(() => {
        const upcoming = getAllUpcomingPaycheckDates(3); // Get next 3 months
        setUpcomingPaychecks(upcoming.slice(0, maxPaychecks));

        const next = getNextPaycheckDate();
        setNextPaycheck(next);

        const monthly = calculateTotalMonthlyIncome();
        setMonthlyIncome(monthly);
    }, [paychecks, getAllUpcomingPaycheckDates, getNextPaycheckDate, calculateTotalMonthlyIncome, maxPaychecks]);

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

    // Get urgency styling based on days until paycheck
    const getUrgencyStyle = (daysUntil) => {
        if (daysUntil === 0) {
            return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300';
        } else if (daysUntil <= 3) {
            return 'bg-info/10 dark:bg-info/20/20 border-info-300 dark:border-info-700 text-info-800 dark:text-info-300';
        } else if (daysUntil <= 7) {
            return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
        } else {
            return 'bg-gray-100 dark:bg-dark-600 border-gray-300 dark:border-dark-500 text-gray-800 dark:text-dark-200';
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

    if (paychecks.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center">
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-50">No Paychecks Configured</h3>
                    <p className="text-gray-600 dark:text-dark-300 mb-4">
                        Set up your paychecks to see upcoming payment dates and plan your budget.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            {showHeader && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-50">Upcoming Paychecks</h3>
                        <p className="text-sm text-gray-600 dark:text-dark-300">
                            Your next paychecks with timezone-accurate scheduling
                        </p>
                    </div>

                    {/* Monthly Income Summary */}
                    <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-dark-300">Monthly Income</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-dark-50">
                            {formatCurrency(monthlyIncome)}
                        </div>
                    </div>
                </div>
            )}

            {/* Next Paycheck Highlight */}
            {nextPaycheck && (
                <div className={`p-4 rounded-lg border-2 mb-4 ${getUrgencyStyle(nextPaycheck.daysUntil)}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg">Next Paycheck</h4>
                            <p className="text-sm opacity-90">{nextPaycheck.paycheck.name}</p>
                            <p className="text-sm opacity-90">
                                {formatDateForDisplay(nextPaycheck.date)} • {getDaysUntilText(nextPaycheck.daysUntil)}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">
                                {formatCurrency(nextPaycheck.paycheck.baseAmount)}
                            </div>
                            {onStartPaydayWorkflow && nextPaycheck.daysUntil <= 1 && (
                                <Button
                                    onClick={() => onStartPaydayWorkflow(nextPaycheck)}
                                    color="success"
                                    variant="filled"
                                    className="mt-2"
                                >
                                    💰 Start Payday
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Account Distribution Preview */}
                    {nextPaycheck.paycheck.accountDistribution && nextPaycheck.paycheck.accountDistribution.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                            <div className="text-xs opacity-75 mb-1">Distribution:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {nextPaycheck.paycheck.accountDistribution.map((dist, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>{getAccountName(dist.accountId)}</span>
                                        <span className="font-medium">{formatCurrency(dist.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Upcoming Paychecks List */}
            {upcomingPaychecks.length > 1 && (
                <div>
                    <h4 className="font-semibold mb-3 text-gray-900 dark:text-dark-50">All Upcoming Paychecks</h4>
                    <div className="space-y-3">
                        {upcomingPaychecks.map((paycheckEntry, index) => (
                            <div
                                key={`${paycheckEntry.paycheck.id}-${paycheckEntry.formattedDate}`}
                                className={`p-3 rounded-lg border ${index === 0 ? 'border-info-300 dark:border-info bg-info/10 dark:bg-info/20/10' :
                                    'border-gray-200 dark:border-dark-500 bg-gray-50 dark:bg-dark-600'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-dark-50">
                                            {paycheckEntry.paycheck.name}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-dark-300">
                                            {formatDateForDisplay(paycheckEntry.date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-dark-400">
                                            {getDaysUntilText(paycheckEntry.daysUntil)}
                                            {paycheckEntry.isThisWeek && ' • This week'}
                                            {paycheckEntry.isThisMonth && ' • This month'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-dark-50">
                                            {formatCurrency(paycheckEntry.paycheck.baseAmount)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-dark-400">
                                            {paycheckEntry.paycheck.frequency}
                                        </div>
                                    </div>
                                </div>

                                {/* Account Distribution for each paycheck */}
                                {paycheckEntry.paycheck.accountDistribution && paycheckEntry.paycheck.accountDistribution.length > 1 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-500">
                                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-dark-300">
                                            {paycheckEntry.paycheck.accountDistribution.map((dist, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span>{getAccountName(dist.accountId)}</span>
                                                    <span>{formatCurrency(dist.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No upcoming paychecks */}
            {upcomingPaychecks.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-dark-400 mb-2">📅</div>
                    <p className="text-gray-600 dark:text-dark-300">
                        No upcoming paychecks found. Check your paycheck configuration.
                    </p>
                </div>
            )}

            {/* Today's Date Reference */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-500">
                <div className="text-xs text-gray-500 dark:text-dark-400 text-center">
                    Today: {formatDateForDisplay(new Date())} • Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
            </div>
        </Card>
    );
};

export default UpcomingPaychecks;
