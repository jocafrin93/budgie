import React, { useState } from 'react';
import { generateCalendarEvents } from '../utils/calendarUtils';

const CalendarView = ({
    darkMode,
    currentPay,
    paySchedule,
    savingsGoals,
    expenses,
    categories,
    frequencyOptions,
    accounts,
}) => {
    const [calendarView, setCalendarView] = useState('timeline');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        });
    };

    const getEventIcon = (type, isFirstOccurrence = true, isRecurring = false) => {
        switch (type) {
            case 'paycheck':
                return '💰';
            case 'goal-deadline':
                return '🎯';
            case 'expense-due':
                return isRecurring ? '🔄' : '⏰';
            case 'recurring-transaction':
                return '🔄';
            default:
                return '📅';
        }
    };

    const getEventColor = (type, subtype, warning = false) => {
        if (warning) return 'border-red-400 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100';

        if (type === 'paycheck') {
            return subtype === 'secondary'
                ? 'border-blue-400 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                : 'border-green-400 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100';
        }
        switch (type) {
            case 'goal-deadline':
                return 'border-purple-400 bg-purple-400 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100';
            case 'expense-due':
                return 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100';
            case 'recurring-transaction':
                return 'border-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-100';
            default:
                return 'border-gray-400 bg-theme-tertiary dark:bg-theme-tertiary/30';
        }
    };

    // Grid calendar functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getEventsForDate = (date, events) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const generateCalendarGrid = (events) => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayEvents = getEventsForDate(date, events);
            const isToday = date.toDateString() === new Date().toDateString();

            days.push({
                date,
                day,
                events: dayEvents,
                isToday,
            });
        }

        return days;
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const resetToCurrentMonth = () => {
        setCurrentMonth(new Date());
    };

    // Generate the actual events
    const calendarEvents = generateCalendarEvents(
        paySchedule,
        currentPay,
        savingsGoals,
        expenses,
        categories,
        frequencyOptions,
        accounts
    );

    // Legend component (shared between both views)
    const Legend = () => (
        <div className="flex flex-wrap gap-4 text-sm border-t border-theme-primary pt-4 mt-4 text-theme-secondary bg-theme-primary">
            <div className="flex items-center">
                <span className="mr-1">💰</span>
                <span>Paycheck</span>
            </div>
            <div className="flex items-center">
                <span className="mr-1">🎯</span>
                <span>Goal Deadline</span>
            </div>
            <div className="flex items-center">
                <span className="mr-1">⏰</span>
                <span>Single Expense</span>
            </div>
            <div className="flex items-center">
                <span className="mr-1">🔄</span>
                <span>Recurring Item</span>
            </div>
        </div>
    );


    if (calendarView === 'grid') {
        const calendarDays = generateCalendarGrid(calendarEvents);
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h4 className="font-medium text-theme-primary">Calendar View</h4>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCalendarView('grid')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${calendarView === 'grid'
                                    ? 'bg-purple-400 text-theme-primary'
                                    : 'bg-theme-secondary text-theme-secondary hover:bg-theme-hover'
                                    }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setCalendarView('timeline')}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${calendarView === 'timeline'
                                    ? 'bg-purple-400 text-theme-primary'
                                    : 'bg-theme-secondary text-theme-secondary hover:bg-theme-hover'
                                    }`}
                            >
                                Timeline
                            </button>
                        </div>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded hover:bg-theme-hover transition-colors text-theme-primary"
                    >
                        ←
                    </button>
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-theme-primary">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h3>
                        <button
                            onClick={resetToCurrentMonth}
                            className="text-sm hover:underline text-theme-blue"
                        >
                            Today
                        </button>
                    </div>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded hover:bg-theme-hover transition-colors text-theme-primary"
                    >
                        →
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {dayNames.map(day => (
                        <div
                            key={day}
                            className="p-2 text-center font-medium text-sm text-theme-secondary"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((dayData, index) => (
                        <div
                            key={index}
                            className={`min-h-24 p-1 border border-theme-primary ${dayData
                                ? dayData.isToday
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                                    : 'bg-theme-primary text-theme-primary'
                                : 'bg-theme-secondary'
                                }`}
                        >
                            {dayData && (
                                <>
                                    <div
                                        className={`text-sm font-medium ${dayData.isToday
                                            ? 'text-blue-600 dark:text-blue-300'
                                            : 'text-theme-primary'
                                            }`}
                                    >
                                        {dayData.day}
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {dayData.events.slice(0, 3).map((event, eventIndex) => (
                                            <div
                                                key={eventIndex}
                                                className={`text-xs p-1 rounded truncate ${getEventColor(
                                                    event.type,
                                                    event.subtype,
                                                    event.warning
                                                )}`}
                                            >
                                                <span className="mr-1">
                                                    {getEventIcon(event.type, event.occurrenceNumber === 1, event.isRecurring)}
                                                </span>
                                                {event.title.replace(/ \(#\d+\)/, '')}
                                            </div>
                                        ))}
                                        {dayData.events.length > 3 && (
                                            <div className="text-xs text-theme-tertiary">
                                                +{dayData.events.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <Legend />
            </div>
        );
    }

    // Timeline view
    const groupedEvents = calendarEvents.reduce((acc, event) => {
        const dateKey = event.date.toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h4 className="font-medium text-theme-primary">Timeline View</h4>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCalendarView('grid')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${calendarView === 'grid'
                                ? 'bg-purple-400 text-theme-primary'
                                : 'bg-theme-secondary text-theme-secondary hover:bg-theme-hover'
                                }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setCalendarView('timeline')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${calendarView === 'timeline'
                                ? 'bg-purple-400 text-theme-primary'
                                : 'bg-theme-secondary text-theme-secondary hover:bg-theme-hover'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>
                </div>
                <div className="text-sm text-theme-secondary">Next few months</div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedDates.slice(0, 20).map(dateKey => {
                    const date = new Date(dateKey);
                    const dayEvents = groupedEvents[dateKey];
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={dateKey}
                            className={`border-l-4 pl-4 ${isToday
                                ? 'border-blue-500'
                                : 'border-theme-primary'
                                }`}
                        >
                            <div className={`font-medium text-sm ${isToday
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-theme-primary'
                                }`}>
                                {formatDate(date)} {isToday && '(Today)'}
                            </div>

                            <div className="space-y-2 mt-2">
                                {dayEvents.map((event, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded border-l-4 ${getEventColor(
                                            event.type,
                                            event.subtype,
                                            event.warning
                                        )}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="mr-2 text-lg">
                                                    {getEventIcon(event.type, event.occurrenceNumber === 1, event.isRecurring)}
                                                </span>
                                                <div>
                                                    <div className="font-medium">{event.title.replace(/ \(#\d+\)/, '')}</div>
                                                    <div className="text-sm">{event.description}</div>
                                                </div>
                                                {event.warning && <span className="ml-2 text-red-500">⚠️</span>}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">${event.amount.toLocaleString()}</div>
                                                {event.paychecksLeft !== undefined && (
                                                    <div className="text-xs">{event.paychecksLeft} paychecks left</div>
                                                )}
                                            </div>
                                        </div>
                                        {event.category && (
                                            <div className="text-xs text-theme-tertiary mt-1">Category: {event.category}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Legend />
        </div>
    );
};

export default CalendarView;