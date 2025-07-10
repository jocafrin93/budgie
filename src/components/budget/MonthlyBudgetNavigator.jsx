import { useBreakpointsContext } from 'app/contexts/breakpoint/context';
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
    const { mdAndDown } = useBreakpointsContext();
    const monthSummary = getMonthSummary ? getMonthSummary() : null;
    const availableMonths = getAvailableMonths ? getAvailableMonths() : [];

    // Get short month name for mobile
    const getShortMonthName = (monthString) => {
        if (!getMonthDisplayName) return 'Current Month';
        const fullName = getMonthDisplayName(monthString);
        if (mdAndDown) {
            // Convert "January 2024" to "Jan '24"
            const parts = fullName.split(' ');
            if (parts.length === 2) {
                const monthName = parts[0].substring(0, 3);
                const year = parts[1].substring(2);
                return `${monthName} '${year}`;
            }
        }
        return fullName;
    };

    if (mdAndDown) {
        // Mobile layout - simplified and stacked
        return (
            <Card className="p-3">
                {/* Top row: Month navigation */}
                <div className="flex items-center justify-between mb-3">
                    <Button
                        onClick={navigateToPrevMonth}
                        variant="secondary"
                        size="sm"
                        className="p-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                            {getShortMonthName(currentBudgetMonth)}
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

                {/* Bottom row: Summary and action */}
                {(monthSummary || onCarryForward) && (
                    <div className="flex items-center justify-between">
                        {monthSummary && (
                            <div className="flex items-center gap-3 text-xs">
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Allocated</div>
                                    <div className="font-medium text-gray-900 dark:text-gray-50">
                                        ${monthSummary.allocated?.toFixed(0) || '0'}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-500 dark:text-gray-400">Remaining</div>
                                    <div className={`font-medium ${(monthSummary.remaining || 0) >= 0
                                        ? 'text-success'
                                        : 'text-error'
                                        }`}>
                                        ${monthSummary.remaining?.toFixed(0) || '0'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {onCarryForward && (
                            <Button
                                onClick={onCarryForward}
                                variant="primary"
                                size="sm"
                                className="text-xs px-2 py-1"
                            >
                                Carry
                            </Button>
                        )}
                    </div>
                )}

                {/* Month Selector (if needed) */}
                {availableMonths.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <select
                            value={currentBudgetMonth}
                            onChange={(e) => navigateToMonth && navigateToMonth(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
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
    }

    // Desktop layout - original design
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
                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
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
                                <div className="text-gray-500 dark:text-gray-400">Allocated</div>
                                <div className="font-medium text-gray-900 dark:text-gray-50">
                                    ${monthSummary.allocated?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Spent</div>
                                <div className="font-medium text-gray-900 dark:text-gray-50">
                                    ${monthSummary.spent?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-gray-500 dark:text-gray-400">Remaining</div>
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <select
                        value={currentBudgetMonth}
                        onChange={(e) => navigateToMonth && navigateToMonth(e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
