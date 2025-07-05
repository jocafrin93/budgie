// src/components/budget/UnifiedEnvelopeBudgetView.jsx
import {
    ArrowRight,
    BanknoteArrowDown,
    Calendar,
    Lock,
    Plus,
    Unlock
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { frequencyOptions } from '../../utils/constants';
import { CurrencyField } from '../form';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import MonthlyBudgetNavigator from './MonthlyBudgetNavigator';


const UnifiedEnvelopeBudgetView = ({
    // Data
    categories = [],
    planningItems = [],
    toBeAllocated = 0,
    // Functions from useEnvelopeBudgeting
    fundCategory,
    transferFunds,

    // Actions
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onToggleCategoryActive,
    onMoveItem,
    onReorderItems,
    onReorderCategories,
    monthlyBudgeting = null,

    // Optional
    onShowPaydayWorkflow,
    recentPaycheck = null,

    // Paycheck configuration
    payFrequency,
    // payFrequencyOptions, // TODO: Will be used when implementing paycheck frequency selector
    getAllUpcomingPaycheckDates
}) => {
    const monthSummary = monthlyBudgeting?.getMonthSummary || {
        toBeAllocated: toBeAllocated,
        allocated: categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0),
        available: categories.reduce((sum, cat) => sum + (cat.available || 0), 0),
        spent: 0,
        remaining: 0,
        carryover: 0
    };

    const getCategoryMonthData = (categoryId) => {
        if (monthlyBudgeting?.getCategoryMonthData) {
            return monthlyBudgeting.getCategoryMonthData(categoryId);
        }
        const category = categories.find(c => c.id === categoryId);
        return {
            allocated: category?.allocated || 0,
            available: category?.available || 0,
            spent: 0,
            remaining: category?.available || 0,
            carryover: 0,
            notes: '',
            isOverspent: false
        };
    };

    // Track expanded categories
    const [expandedCategories, setExpandedCategories] = useState({});


    // State for Ready to Assign money movement
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Sorting state
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Column widths state
    const [columnWidths, setColumnWidths] = useState({
        category: 280,
        needed: 120,
        perPaycheck: 120,
        available: 120,
        dueDate: 130
    });

    // Refs for column resizing
    const startNeighborWidth = useRef(0);
    const neighborColumn = useRef(null);
    const tableRef = useRef(null);
    const isResizing = useRef(false);
    const currentColumn = useRef(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    // Toggle category expansion
    const toggleCategoryExpanded = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // Handle sorting
    const handleSort = (column) => {
        console.log('Sorting by:', column);

        if (column === 'manual') {
            setSortBy('manual');
            setSortDirection('asc');
            return;
        }

        if (sortBy === column) {
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);
            console.log('Toggled direction to:', newDirection);
        } else {
            setSortBy(column);
            setSortDirection('asc');
            console.log('New sort column:', column, 'direction: asc');
        }
    };

    // Column resizing handlers
    const handleMouseDown = (e, columnKey) => {
        e.stopPropagation();
        e.preventDefault();

        isResizing.current = true;
        currentColumn.current = columnKey;
        startX.current = e.clientX;
        startWidth.current = columnWidths[columnKey];

        const rightNeighbor = {
            category: 'needed',
            needed: 'perPaycheck',
            perPaycheck: 'available',
            available: 'dueDate',
            dueDate: null
        };

        neighborColumn.current = rightNeighbor[columnKey];
        startNeighborWidth.current = neighborColumn.current ? columnWidths[neighborColumn.current] : 0;

        document.addEventListener('mousemove', handleMouseMoveSimple);
        document.addEventListener('mouseup', handleMouseUpSimple);
    };

    const handleMouseMoveSimple = (e) => {
        if (!isResizing.current || !currentColumn.current) return;

        const diff = e.clientX - startX.current;
        const minWidth = 80;

        const newCurrentWidth = Math.max(minWidth, startWidth.current + diff);

        if (neighborColumn.current) {
            const currentChange = newCurrentWidth - startWidth.current;
            const newNeighborWidth = Math.max(minWidth, startNeighborWidth.current - currentChange);

            const neighborChange = startNeighborWidth.current - newNeighborWidth;
            const finalCurrentWidth = startWidth.current + neighborChange;

            setColumnWidths(prev => ({
                ...prev,
                [currentColumn.current]: finalCurrentWidth,
                [neighborColumn.current]: newNeighborWidth
            }));
        } else {
            setColumnWidths(prev => ({
                ...prev,
                [currentColumn.current]: newCurrentWidth
            }));
        }
    };

    const handleMouseUpSimple = () => {
        isResizing.current = false;
        currentColumn.current = null;
        neighborColumn.current = null;
        startNeighborWidth.current = 0;
        document.removeEventListener('mousemove', handleMouseMoveSimple);
        document.removeEventListener('mouseup', handleMouseUpSimple);
    };

    // Pay period urgency calculation
    const getPayPeriodUrgency = (dateString) => {
        if (!dateString) return null;

        const [year, month, day] = dateString.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        const daysUntilNextPaycheck = 5;
        const daysUntilPaycheckAfter = daysUntilNextPaycheck + 14;

        if (daysUntilDue <= daysUntilNextPaycheck) {
            return 'current-period';
        } else if (daysUntilDue <= daysUntilPaycheckAfter) {
            return 'next-period';
        } else {
            return 'future';
        }
    };

    const getPayPeriodColor = (urgency) => {
        switch (urgency) {
            case 'current-period':
                return 'text-error bg-error-light border border-error hover:bg-error-lighter';
            case 'next-period':
                return 'text-warning bg-warning-light border border-warning hover:bg-warning-lighter';
            case 'future':
                return 'text-info bg-info-light border border-info hover:bg-info-lighter';
            default:
                return 'text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-500 hover:bg-gray-200 dark:hover:bg-dark-500';
        }
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return null;

        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate();
        return `${monthStr} ${dayStr}`;
    };

    // Conservative paycheck info
    const getConservativePaycheckInfo = (payFreq) => {
        switch (payFreq) {
            case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
            case 'biweekly':
            case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
            case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
            case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
            default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        }
    };

    // Amount display calculation
    const getAmountDisplayInfo = (item, payFrequency) => {
        const isGoal = item.type === 'savings-goal';
        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
        const today = new Date();

        const paycheckInfo = getConservativePaycheckInfo(payFrequency);
        const daysPerPaycheck = Math.ceil(30 / paycheckInfo.average);

        let monthlyAmount = 0;
        let perPaycheckAmount = 0;

        const freqOption = frequencyOptions.find(opt => opt.value === item.frequency);

        if (isGoal) {
            monthlyAmount = item.monthlyContribution || 0;
            perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
        } else {
            const itemAmount = item.amount || 0;

            if (freqOption) {
                monthlyAmount = itemAmount * (freqOption.weeksPerYear / 12);
                if (freqOption.isRegular) {
                    perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
                } else {
                    perPaycheckAmount = monthlyAmount / paycheckInfo.average;
                }
            } else {
                monthlyAmount = itemAmount;
                perPaycheckAmount = itemAmount / paycheckInfo.conservative;
            }
        }

        let paychecksUntilDue = null;
        if (dueDate && getAllUpcomingPaycheckDates) {
            try {
                const upcomingPaychecks = getAllUpcomingPaycheckDates(6);

                const dueDateStr = item.dueDate;
                const [year, month, day] = dueDateStr.split('-').map(Number);
                const localDueDate = new Date(year, month - 1, day);

                const paychecksBeforeDue = upcomingPaychecks.filter(p => p.date < localDueDate);
                paychecksUntilDue = paychecksBeforeDue.length;

                if (paychecksUntilDue > 0) {
                    const allocated = item.allocated || 0;
                    const targetAmount = isGoal ?
                        (item.targetAmount || monthlyAmount) : monthlyAmount;
                    const remaining = Math.max(0, targetAmount - allocated);
                    perPaycheckAmount = remaining / paychecksUntilDue;
                }
            } catch (error) {
                console.warn('Error calculating paychecks until due, falling back to estimation:', error);
                const dueDateStr = item.dueDate;
                const [year, month, day] = dueDateStr.split('-').map(Number);
                const localDueDate = new Date(year, month - 1, day);
                const daysPerPaycheck = Math.ceil(30 / paycheckInfo.average);
                const daysUntilDue = Math.ceil((localDueDate - today) / (24 * 60 * 60 * 1000));
                paychecksUntilDue = Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));

                if (paychecksUntilDue > 0) {
                    const allocated = item.allocated || 0;
                    const targetAmount = isGoal ?
                        (item.targetAmount || monthlyAmount) : monthlyAmount;
                    const remaining = Math.max(0, targetAmount - allocated);
                    perPaycheckAmount = remaining / paychecksUntilDue;
                }
            }
        } else if (dueDate) {
            const dueDateStr = item.dueDate;
            const [year, month, day] = dueDateStr.split('-').map(Number);
            const localDueDate = new Date(year, month - 1, day);
            const daysUntilDue = Math.ceil((localDueDate - today) / (24 * 60 * 60 * 1000));
            paychecksUntilDue = Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));

            if (paychecksUntilDue > 0) {
                const allocated = item.allocated || 0;
                const targetAmount = isGoal ?
                    (item.targetAmount || monthlyAmount) : monthlyAmount;
                const remaining = Math.max(0, targetAmount - allocated);
                perPaycheckAmount = remaining / paychecksUntilDue;
            }
        }

        return {
            monthlyAmount,
            perPaycheckAmount,
            paychecksUntilDue,
            usingConservative: !freqOption || freqOption.isRegular,
            paycheckInfo
        };
    };

    // Get category data
    const getCategoryData = (category) => {
        const categoryItems = planningItems.filter(item => item.categoryId === category.id);
        const categoryType = category.type || (categoryItems.length <= 1 ? 'single' : 'multiple');

        if (categoryType === 'single') {
            let singleData;

            if (category.settings?.amount) {
                singleData = {
                    amount: category.settings.amount,
                    frequency: category.settings.frequency || 'monthly',
                    dueDate: category.settings.dueDate
                };
            } else if (categoryItems[0]) {
                singleData = categoryItems[0];
            } else {
                return {
                    type: 'single',
                    perPaycheckNeed: 0,
                    monthlyNeed: 0,
                    items: [],
                    urgencyInfo: null,
                    needsConfiguration: true,
                    dueDateInfo: null,
                    isActive: category.isActive ?? true
                };
            }

            const displayInfo = getAmountDisplayInfo(singleData, payFrequency);
            const dueDateInfo = singleData.dueDate ? {
                date: singleData.dueDate,
                urgency: getPayPeriodUrgency(singleData.dueDate),
                display: formatDueDate(singleData.dueDate)
            } : null;
            const isActive = category.isActive ?? true;

            const perPaycheckNeed = isActive ? displayInfo.perPaycheckAmount : 0;
            const monthlyNeed = isActive ? displayInfo.monthlyAmount : 0;
            return {
                type: 'single',
                perPaycheckNeed,
                monthlyNeed,
                items: categoryItems,
                paychecksUntilDue: displayInfo.paychecksUntilDue,
                singleData,
                needsConfiguration: false,
                dueDateInfo: isActive ? dueDateInfo : null,
                isActive
            };
        } else {
            const activeItems = categoryItems.filter(item => item.isActive);

            const totalPerPaycheckNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency);
                return total + Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
            }, 0);

            const totalMonthlyNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency);
                return total + displayInfo.monthlyAmount;
            }, 0);

            let dueDateInfo = null;
            const itemsWithDates = activeItems.filter(item => item.dueDate);
            if (itemsWithDates.length > 0) {
                const sortedByDate = itemsWithDates.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                const earliestItem = sortedByDate[0];
                dueDateInfo = {
                    date: earliestItem.dueDate,
                    urgency: getPayPeriodUrgency(earliestItem.dueDate),
                    display: formatDueDate(earliestItem.dueDate),
                    additionalCount: itemsWithDates.length > 1 ? itemsWithDates.length - 1 : 0
                };
            }

            return {
                type: 'multiple',
                perPaycheckNeed: totalPerPaycheckNeed,
                monthlyNeed: totalMonthlyNeed,
                items: categoryItems,
                activeItems,
                dueDateInfo
            };
        }
    };

    const budgetCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.type !== 'income' && !cat.hiddenFromBudget
        );
    }, [categories]);

    const sortedCategories = useMemo(() => {
        if (sortBy === 'manual') {
            return [...budgetCategories];
        }

        return [...budgetCategories].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'allocated':
                    return (b.allocated || 0) - (a.allocated || 0);
                case 'available':
                    return (b.available || 0) - (a.available || 0);
                case 'need': {
                    const aNeed = getCategoryData(a).perPaycheckNeed || 0;
                    const bNeed = getCategoryData(b).perPaycheckNeed || 0;
                    return bNeed - aNeed;
                }
                default:
                    return 0;
            }
        });
    }, [budgetCategories, sortBy, getCategoryData]);

    return (
        <div className="space-y-6">
            {monthlyBudgeting && (
                <MonthlyBudgetNavigator
                    currentBudgetMonth={monthlyBudgeting.currentBudgetMonth}
                    getMonthDisplayName={monthlyBudgeting.getMonthDisplayName}
                    navigateToNextMonth={monthlyBudgeting.navigateToNextMonth}
                    navigateToPrevMonth={monthlyBudgeting.navigateToPrevMonth}
                    navigateToMonth={monthlyBudgeting.navigateToMonth}
                    getAvailableMonths={monthlyBudgeting.getAvailableMonths}
                    getMonthSummary={monthlyBudgeting.getMonthSummary}
                    onCarryForward={monthlyBudgeting.carryForwardBalances}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-50 flex items-center gap-2">
                        <BanknoteArrowDown className="w-7 h-7" />
                        Budget
                    </h2>
                    <p className="text-gray-600 dark:text-dark-300">
                        Enhanced categories with both single and multiple expense types
                    </p>
                </div>
            </div>

            {/* Table Container */}
            <Card className="overflow-hidden">
                {/* Ready to Assign Header */}
                <div className="border-b border-gray-200 dark:border-dark-600 p-4">
                    <div className="justify-between">
                        <div className="flex flex-col items-center gap-3">
                            <div className="text-center">
                                <div className="text-lg text-gray-600 dark:text-dark-300">Ready to Assign</div>
                                <div className={`text-lg font-bold ${monthSummary.toBeAllocated > 0 ? 'text-success' :
                                    monthSummary.toBeAllocated < 0 ? 'text-error' : 'text-gray-600 dark:text-dark-300'
                                    }`}>
                                    ${monthSummary.toBeAllocated.toFixed(2)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {recentPaycheck && (
                                    <Button
                                        onClick={onShowPaydayWorkflow}
                                        variant="success"
                                        size="sm"
                                    >
                                        Allocate Paycheck
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setShowAssignModal(true)}
                                    variant="success"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Assign
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <table ref={tableRef} className="w-full table-fixed" style={{ minWidth: '800px', maxWidth: '100%' }}>
                        <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                            <tr>
                                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider w-10 flex-shrink-0">
                                    <button
                                        onClick={() => handleSort('manual')}
                                        className={`p-1.5 rounded-full transition-all duration-200 ${sortBy === 'manual'
                                            ? 'bg-success text-white hover:bg-success-dark shadow-sm'
                                            : 'bg-error-light text-error hover:bg-error-lighter border border-error'
                                            }`}
                                        title={sortBy === 'manual' ? 'Manual reordering ENABLED' : 'Manual reordering DISABLED - click to enable'}
                                    >
                                        {sortBy === 'manual' ? (
                                            <Unlock className="w-3.5 h-3.5" />
                                        ) : (
                                            <Lock className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 relative"
                                    style={{ width: columnWidths.category }}
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            Category
                                            <button onClick={onAddCategory}>
                                                <Plus className="w-5 h-5 text-gray-400 dark:text-dark-500" />
                                            </button>
                                        </span>
                                        {sortBy === 'name' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'category');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 relative"
                                    style={{ width: columnWidths.needed }}
                                    onClick={() => handleSort('needed')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Needed/Month
                                        {sortBy === 'needed' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'needed');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 relative"
                                    style={{ width: columnWidths.perPaycheck }}
                                    onClick={() => handleSort('perPaycheck')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Per Paycheck
                                        {sortBy === 'perPaycheck' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'perPaycheck');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 relative"
                                    style={{ width: columnWidths.available }}
                                    onClick={() => handleSort('available')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Available
                                        {sortBy === 'available' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'available');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600 relative"
                                    style={{ width: columnWidths.dueDate }}
                                    onClick={() => handleSort('due')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Due Date
                                        {sortBy === 'due' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'dueDate');
                                        }}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-dark-600">
                            {sortedCategories.map((category, index) => (
                                <CategoryTableRow
                                    key={category.id}
                                    category={category}
                                    categoryData={getCategoryData(category)}
                                    index={index}
                                    sortBy={sortBy}
                                    isExpanded={expandedCategories[category.id]}
                                    onToggleExpand={() => toggleCategoryExpanded(category.id)}
                                    onEditCategory={onEditCategory}
                                    onDeleteCategory={onDeleteCategory}
                                    onAddItem={onAddItem}
                                    onEditItem={onEditItem}
                                    onDeleteItem={onDeleteItem}
                                    onToggleCategoryActive={onToggleCategoryActive}
                                    onToggleItemActive={onToggleItemActive}
                                    onMoveItem={onMoveItem}
                                    onReorderCategories={onReorderCategories}
                                    onReorderItems={onReorderItems}
                                    fundCategory={fundCategory}
                                    transferFunds={transferFunds}
                                    getAmountDisplayInfo={getAmountDisplayInfo}
                                    getPayPeriodColor={getPayPeriodColor}
                                    formatDueDate={formatDueDate}
                                    getPayPeriodUrgency={getPayPeriodUrgency}
                                    payFrequency={payFrequency}
                                    categories={categories}
                                    monthlyBudgeting={monthlyBudgeting}
                                    getCategoryMonthData={getCategoryMonthData}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-dark-300">
                            {sortedCategories.length} categories • {planningItems.filter(item => item.isActive).length} active items
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-dark-400">Total Allocated</div>
                                <div className="font-medium text-gray-900 dark:text-dark-50">
                                    ${sortedCategories.reduce((total, cat) => total + (cat.allocated || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-dark-400">Total Available</div>
                                <div className="font-medium text-gray-900 dark:text-dark-50">
                                    ${sortedCategories.reduce((total, cat) => total + (cat.available || 0), 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Money Assignment Modal */}
            {showAssignModal && (
                <AssignMoneyModal
                    availableAmount={toBeAllocated}
                    categories={categories}
                    onAssign={(categoryId, amount) => {
                        if (transferFunds) {
                            transferFunds('toBeAllocated', categoryId, amount);
                        } else if (fundCategory) {
                            fundCategory(categoryId, amount);
                        }
                        setShowAssignModal(false);
                    }}
                    onClose={() => setShowAssignModal(false)}
                />
            )}
        </div>
    );
};

// Placeholder components - these will need to be implemented
const CategoryTableRow = ({ category, categoryData }) => {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-dark-600">
            <td className="px-4 py-2 text-sm text-gray-900 dark:text-dark-50">
                {category.name}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-300">
                ${categoryData.monthlyNeed?.toFixed(2) || '0.00'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-300">
                ${categoryData.perPaycheckNeed?.toFixed(2) || '0.00'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-300">
                ${(category.available || 0).toFixed(2)}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-300">
                {categoryData.dueDateInfo?.display || '—'}
            </td>
        </tr>
    );
};

const AssignMoneyModal = ({ availableAmount, categories, onAssign, onClose }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [assignAmount, setAssignAmount] = useState('');

    const handleAssign = () => {
        if (selectedCategoryId && assignAmount) {
            const parsedAmount = parseFloat(assignAmount);
            if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= availableAmount) {
                onAssign(parseInt(selectedCategoryId, 10), parsedAmount);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-50">Assign Money to Category</h3>

                <div className="space-y-4">
                    <div className="p-3 bg-gray-50 dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-dark-300">Available to assign:</div>
                        <div className="text-2xl font-bold text-success">
                            ${availableAmount.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-dark-50 mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-500 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Select a category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} (${(cat.available || 0).toFixed(2)} available)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-dark-50 mb-1">
                            Amount
                        </label>
                        <CurrencyField
                            name="assignAmount"
                            value={assignAmount}
                            onChange={(e) => setAssignAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-300 dark:border-dark-500 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            hideLabel={true}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedCategoryId || !assignAmount || parseFloat(assignAmount) <= 0}
                        variant="success"
                        size="sm"
                    >
                        Assign Money
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default UnifiedEnvelopeBudgetView;
