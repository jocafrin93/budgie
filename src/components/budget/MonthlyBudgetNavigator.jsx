import { useBreakpointsContext } from 'app/contexts/breakpoint/context';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
                    <button
                        onClick={navigateToPrevMonth}
                        className="btn btn-secondary btn-sm p-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-base-content/70" />
                        <h3 className="text-base font-semibold text-base-content">
                            {getShortMonthName(currentBudgetMonth)}
                        </h3>
                    </div>

                    <button
                        onClick={navigateToNextMonth}
                        className="btn btn-secondary btn-sm p-2"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Bottom row: Summary and action */}
                {(monthSummary || onCarryForward) && (
                    <div className="flex items-center justify-between">
                        {monthSummary && (
                            <div className="flex items-center gap-3 text-xs">
                                <div className="text-center">
                                    <div className="text-base-content/60">Allocated</div>
                                    <div className="font-medium text-base-content">
                                        ${monthSummary.allocated?.toFixed(0) || '0'}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-base-content/60">Remaining</div>
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
                            <button
                                onClick={onCarryForward}
                                className="btn btn-primary btn-sm text-xs px-2 py-1"
                            >
                                Carry
                            </button>
                        )}
                    </div>
                )}

                {/* Month Selector (if needed) */}
                {availableMonths.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-base-300">
                        <select
                            value={currentBudgetMonth}
                            onChange={(e) => navigateToMonth && navigateToMonth(e.target.value)}
                            className="w-full px-2 py-1 border border-base-300 rounded bg-base-100 text-base-content text-xs focus:outline-none focus:border-primary"
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
                    <button
                        onClick={navigateToPrevMonth}
                        className="btn btn-secondary btn-sm p-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-base-content/70" />
                        <h3 className="text-lg font-semibold text-base-content">
                            {getMonthDisplayName ? getMonthDisplayName(currentBudgetMonth) : 'Current Month'}
                        </h3>
                    </div>

                    <button
                        onClick={navigateToNextMonth}
                        className="btn btn-secondary btn-sm p-2"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Month Summary & Actions */}
                <div className="flex items-center gap-4">
                    {monthSummary && (
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-base-content/60">Allocated</div>
                                <div className="font-medium text-base-content">
                                    ${monthSummary.allocated?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-base-content/60">Spent</div>
                                <div className="font-medium text-base-content">
                                    ${monthSummary.spent?.toFixed(2) || '0.00'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-base-content/60">Remaining</div>
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
                        <button
                            onClick={onCarryForward}
                            className="btn btn-primary btn-sm"
                        >
                            Rollover
                        </button>
                    )}
                </div>
            </div>

            {/* Month Selector Dropdown (if needed) */}
            {availableMonths.length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-300">
                    <select
                        value={currentBudgetMonth}
                        onChange={(e) => navigateToMonth && navigateToMonth(e.target.value)}
                        className="px-3 py-1 border border-base-300 rounded bg-base-100 text-base-content text-sm focus:outline-none focus:border-primary"
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
