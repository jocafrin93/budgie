import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const MonthlyBudgetNavigator = ({
    currentBudgetMonth,
    getMonthDisplayName,
    navigateToNextMonth,
    navigateToPrevMonth,
    navigateToMonth,
    getAvailableMonths,
    getMonthSummary,
    onCarryForward
}) => {
    const monthSummary = getMonthSummary ? getMonthSummary() : null;
    const availableMonths = getAvailableMonths ? getAvailableMonths() : [];

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                {/* Left: Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={navigateToPrevMonth}
                        variant="secondary"
                        size="sm"
                        className="p-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-dark-300" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">
                            {getMonthDisplayName ? getMonthDisplayName(currentBudgetMonth) : 'Current Month'}
                        </h3>
                    </div>

                    <Button
                        onClick={navigateToNextMonth}
                        variant="secondary"
                        size="sm"
                        className="p-2"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* Right: Month Summary & Actions */}
                <div className="flex items-center gap-4">
                    {monthSummary && (
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-dark-400">Allocated</div>
                                <div className="font-medium text-gray-900 dark:text-dark-50">
                                    ${monthSummary.allocated?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-dark-400">Spent</div>
                                <div className="font-medium text-gray-900 dark:text-dark-50">
                                    ${monthSummary.spent?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-dark-400">Remaining</div>
                                <div className={`font-medium ${(monthSummary.remaining || 0) >= 0
                                        ? 'text-success'
                                        : 'text-error'
                                    }`}>
                                    ${monthSummary.remaining?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                        </div>
                    )}

                    {onCarryForward && (
                        <Button
                            onClick={onCarryForward}
                            variant="primary"
                            size="sm"
                        >
                            Carry Forward
                        </Button>
                    )}
                </div>
            </div>

            {/* Month Selector Dropdown (if needed) */}
            {availableMonths.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-600">
                    <select
                        value={currentBudgetMonth}
                        onChange={(e) => navigateToMonth && navigateToMonth(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {availableMonths.map(month => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </Card>
    );
};

export default MonthlyBudgetNavigator;
