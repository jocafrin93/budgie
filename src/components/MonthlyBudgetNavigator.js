// src/components/MonthlyBudgetNavigator.js
import { ArrowLeftRight, Calendar, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useState } from 'react';

export const MonthlyBudgetNavigator = ({
    currentBudgetMonth,
    getMonthDisplayName,
    navigateToNextMonth,
    navigateToPrevMonth,
    navigateToMonth,
    getAvailableMonths,
    getMonthSummary,
    onCarryForward,
    className = ''
}) => {
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    const monthSummary = getMonthSummary;
    const availableMonths = getAvailableMonths();
    const currentMonth = availableMonths.find(m => m.key === currentBudgetMonth);

    const handleMonthSelect = (monthKey) => {
        navigateToMonth(monthKey);
        setShowMonthSelector(false);
    };

    const formatCurrency = (amount) => `${Math.abs(amount).toFixed(2)}`;

    const getStatusColor = (amount) => {
        if (amount > 0) return 'text-theme-green';
        if (amount < 0) return 'text-theme-red';
        return 'text-theme-secondary';
    };

    return (
        <div className={`bg-theme-primary rounded-lg shadow-sm border border-theme-secondary p-4 ${className}`}>
            {/* Main Navigation Bar */}
            <div className="flex items-center justify-between mb-4">
                {/* Month Navigation */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={navigateToPrevMonth}
                        className="p-2 hover:bg-theme-hover rounded-lg transition-colors"
                        title="Previous Month"
                    >
                        <ChevronLeft className="w-5 h-5 text-theme-secondary" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMonthSelector(!showMonthSelector)}
                            className="flex items-center space-x-2 px-4 py-2 bg-theme-secondary hover:bg-theme-hover rounded-lg transition-colors min-w-[200px] justify-center"
                        >
                            <Calendar className="w-4 h-4 text-theme-secondary" />
                            <span className="font-medium text-theme-primary">{getMonthDisplayName(currentBudgetMonth)}</span>
                            <ChevronRight className={`w-4 h-4 text-theme-secondary transition-transform ${showMonthSelector ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Month Selector Dropdown */}
                        {showMonthSelector && (
                            <div className="absolute top-full left-0 mt-1 bg-theme-primary border border-theme-secondary rounded-lg shadow-lg z-50 min-w-[240px]">
                                <div className="py-1 max-h-64 overflow-y-auto">
                                    {availableMonths.map((month) => (
                                        <button
                                            key={month.key}
                                            onClick={() => handleMonthSelect(month.key)}
                                            className={`w-full text-left px-4 py-2 hover:bg-theme-hover flex items-center justify-between ${month.key === currentBudgetMonth ? 'bg-theme-active text-theme-blue font-medium' : 'text-theme-primary'
                                                }`}
                                        >
                                            <span>{month.display}</span>
                                            <div className="flex items-center space-x-1 text-xs">
                                                {month.isCurrent && <span className="bg-theme-green text-white px-2 py-1 rounded">Current</span>}
                                                {month.isPast && <span className="text-theme-tertiary">Past</span>}
                                                {month.isFuture && <span className="text-theme-blue">Future</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={navigateToNextMonth}
                        className="p-2 hover:bg-theme-hover rounded-lg transition-colors"
                        title="Next Month"
                    >
                        <ChevronRight className="w-5 h-5 text-theme-secondary" />
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            className="p-2 hover:bg-theme-hover rounded-lg transition-colors"
                            title="Quick Actions"
                        >
                            <Settings className="w-5 h-5 text-theme-secondary" />
                        </button>

                        {showQuickActions && (
                            <div className="absolute top-full right-0 mt-1 bg-theme-primary border border-theme-secondary rounded-lg shadow-lg z-50 min-w-[200px]">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            onCarryForward?.();
                                            setShowQuickActions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-theme-hover flex items-center space-x-2 text-theme-primary"
                                    >
                                        <ArrowLeftRight className="w-4 h-4" />
                                        <span>Carry Forward Previous</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigateToMonth(availableMonths.find(m => m.isCurrent)?.key);
                                            setShowQuickActions(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-theme-hover flex items-center space-x-2 text-theme-primary"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        <span>Go to Current Month</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Month Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center">
                    <div className="text-xs text-theme-tertiary uppercase tracking-wide">To Be Allocated</div>
                    <div className={`font-bold ${getStatusColor(monthSummary.toBeAllocated)}`}>
                        {monthSummary.toBeAllocated >= 0 ? '+' : ''}{formatCurrency(monthSummary.toBeAllocated)}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-xs text-theme-tertiary uppercase tracking-wide">Allocated</div>
                    <div className="font-bold text-theme-blue">
                        {formatCurrency(monthSummary.allocated)}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-xs text-theme-tertiary uppercase tracking-wide">Available</div>
                    <div className="font-bold text-theme-green">
                        {formatCurrency(monthSummary.available)}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-xs text-theme-tertiary uppercase tracking-wide">Spent</div>
                    <div className="font-bold text-theme-secondary">
                        {formatCurrency(monthSummary.spent)}
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-xs text-theme-tertiary uppercase tracking-wide">Remaining</div>
                    <div className={`font-bold ${getStatusColor(monthSummary.remaining)}`}>
                        {formatCurrency(monthSummary.remaining)}
                    </div>
                </div>
            </div>

            {/* Status Indicators */}
            {monthSummary.carryover > 0 && (
                <div className="mt-3 p-2 bg-theme-active border border-theme-blue rounded text-xs text-theme-blue">
                    <strong>Carried Forward:</strong> {formatCurrency(monthSummary.carryover)} from previous month
                </div>
            )}

            {monthSummary.toBeAllocated < 0 && (
                <div className="mt-3 p-2 bg-theme-active border border-theme-red rounded text-xs text-theme-red">
                    <strong>Over-allocated:</strong> You've allocated {formatCurrency(Math.abs(monthSummary.toBeAllocated))} more than available
                </div>
            )}

            {currentMonth?.isFuture && (
                <div className="mt-3 p-2 bg-theme-active border border-theme-secondary rounded text-xs text-theme-secondary">
                    <strong>Future Month:</strong> This is a future budget month. Allocations are projections.
                </div>
            )}
        </div>
    );
};

export default MonthlyBudgetNavigator;