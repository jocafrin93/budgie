// src/components/budget/UnifiedEnvelopeBudgetView.jsx
import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Plus
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { TbTrash } from 'react-icons/tb';

// UI Components
import {
    Badge,
    Card,
    Table,
    TBody,
    Td,
    Th,
    THead,
    Tr
} from 'components/ui';

// Shared Table Components
import { ColumnFilter } from 'components/shared/table/ColumnFilter';
import { PaginationSection } from 'components/shared/table/PaginationSection';
import { TableSortIcon } from 'components/shared/table/TableSortIcon';

// Custom Components
import MoneyMovementModal from './MoneyMovementModal';
import MonthlyBudgetNavigator from './MonthlyBudgetNavigator';
import UnifiedCategoryForm from './UnifiedCategoryForm';
import UnifiedItemForm from './UnifiedItemForm';

// Utils
import { frequencyOptions } from '../../utils/constants';

const UnifiedEnvelopeBudgetView = ({
    // Data
    categories = [],
    planningItems = [],
    toBeAllocated = 0,
    accounts = [],

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

    // Monthly budgeting
    monthlyBudgeting = null,

    // Optional
    onShowPaydayWorkflow,
    recentPaycheck = null,

    // Paycheck configuration
    payFrequency,
    getAllUpcomingPaycheckDates
}) => {
    // State
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [tableSettings, setTableSettings] = useState({
        enableColumnFilters: false,
        enableSorting: true,
        enableRowDense: false,
        enableFullScreen: false
    });

    // Helper functions
    const monthSummary = monthlyBudgeting?.getMonthSummary || {
        toBeAllocated: toBeAllocated,
        allocated: categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0),
        available: categories.reduce((sum, cat) => sum + (cat.available || 0), 0),
        spent: 0,
        remaining: 0,
        carryover: 0
    };

    const getCategoryMonthData = useCallback((categoryId) => {
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
    }, [monthlyBudgeting, categories]);

    // Pay period urgency calculation
    const getPayPeriodUrgency = useCallback((dateString) => {
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
    }, []);

    const getPayPeriodColor = useCallback((urgency) => {
        switch (urgency) {
            case 'current-period':
                return 'text-error bg-error/20 border border-error hover';
            case 'next-period':
                return 'text-warning bg-warning/20 border border-warning hover';
            case 'future':
                return 'text-info bg-info/20 border border-info hover';
            default:
                return 'text-base-content/60 bg-base-200 border border-base-300 hover';
        }
    }, []);

    const formatDueDate = useCallback((dateString) => {
        if (!dateString) return null;

        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate();
        return `${monthStr} ${dayStr}`;
    }, []);

    // Conservative paycheck info (from original)
    const getConservativePaycheckInfo = useCallback((payFreq) => {
        switch (payFreq) {
            case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
            case 'biweekly':
            case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
            case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
            case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
            default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        }
    }, []);

    // Amount display calculation (restored from original)
    const getAmountDisplayInfo = useCallback((item) => {
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
            paycheckInfo,
            frequency: item.frequency,
            displayFrequency: frequencyOptions.find(opt => opt.value === item.frequency)?.label || item.frequency
        };
    }, [payFrequency, getAllUpcomingPaycheckDates, getConservativePaycheckInfo]);

    // Get category data
    const getCategoryData = useCallback((category) => {
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

            const displayInfo = getAmountDisplayInfo(singleData);
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
                const displayInfo = getAmountDisplayInfo(item);
                return total + Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
            }, 0);

            const totalMonthlyNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item);
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
    }, [planningItems, getAmountDisplayInfo, getPayPeriodUrgency, formatDueDate]);

    // Prepare table data with sub-rows
    const tableData = useMemo(() => {
        const budgetCategories = categories.filter(cat =>
            cat.type !== 'income' && !cat.hiddenFromBudget
        );

        return budgetCategories.map(category => {
            const categoryData = getCategoryData(category);

            // Create sub-rows for multiple categories
            const subRows = categoryData.type === 'multiple'
                ? categoryData.items.map(item => ({
                    id: `item-${item.id}`,
                    type: 'item',
                    item,
                    categoryId: category.id,
                    displayInfo: getAmountDisplayInfo(item)
                }))
                : [];

            return {
                id: category.id,
                type: 'category',
                category,
                categoryData,
                subRows
            };
        });
    }, [categories, getCategoryData, getAmountDisplayInfo]);

    // Column definitions
    const columns = useMemo(() => [
        {
            id: 'expander',
            header: () => null,
            cell: ({ row }) => {
                if (row.original.type === 'item') return null;

                const categoryData = row.original.categoryData;
                if (categoryData.type === 'single') return null;

                return row.getCanExpand() ? (
                    <button
                        {...{
                            onClick: row.getToggleExpandedHandler(),
                            style: { cursor: 'pointer' },
                        }}
                        className="p-1 hover rounded"
                    >
                        {row.getIsExpanded() ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                ) : null;
            },
            enableSorting: false,
            enableColumnFilter: false,
            size: 40,
        },
        {
            accessorKey: 'name',
            header: () => (
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        Category
                        <button
                            onClick={() => setShowAddCategory(true)}
                            className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                            title="Add new category"
                            type="button"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </span>
                </div>
            ),
            cell: ({ row }) => {
                if (row.original.type === 'item') {
                    const item = row.original.item;
                    const displayInfo = row.original.displayInfo;
                    return (
                        <div className="ml-8 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => {
                                        setEditingItem(item);
                                        setShowItemForm(true);
                                    }}
                                    className="font-medium text-base-content text-sm hover transition-colors text-left"
                                >
                                    {item.name}
                                </button>
                                <div className="text-xs text-base-content/60">
                                    ${item.amount} {displayInfo.displayFrequency}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onToggleItemActive(item.id, !item.isActive)}
                                    className={`p-1 rounded transition-colors ${item.isActive
                                        ? 'text-success hover:text-success'
                                        : 'text-base-content/60 hover:text-base-content'
                                        }`}
                                    title={item.isActive ? 'Mark as planning only' : 'Mark as active'}
                                >
                                    {item.isActive ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={() => onDeleteItem(item)}
                                    className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                                    title="Delete item"
                                >
                                    <TbTrash className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                }

                // Category row
                const category = row.original.category;
                const categoryData = row.original.categoryData;

                return (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${category.color || 'bg-base-300'} border border-base-300 shadow-sm`}></div>
                            <button
                                onClick={() => handleEditCategory(category)}
                                className={`font-medium hover transition-colors text-left ${categoryData.type === 'single' && !categoryData.isActive
                                    ? 'text-base-content/60'
                                    : 'text-base-content'
                                    }`}
                            >
                                {category.name}
                            </button>
                            {categoryData.type === 'multiple' && (
                                <svg className="w-3 h-3 text-base-content/60 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {categoryData.type === 'single' && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (fundCategory) {
                                                const monthData = getCategoryMonthData(category.id);
                                                // Use monthData to determine smart funding amount
                                                const currentAvailable = monthData.available || 0;
                                                const needed = Math.max(0, categoryData.perPaycheckNeed - currentAvailable);
                                                if (needed > 0) {
                                                    fundCategory(category.id, needed);
                                                }
                                            }
                                        }}
                                        className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                                        title="Fund this category"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onToggleCategoryActive(category.id, !(category.isActive ?? true))}
                                        className={`p-1 rounded transition-colors ${(category.isActive ?? true)
                                            ? 'text-success hover:text-success'
                                            : 'text-base-content/60 hover:text-base-content'
                                            }`}
                                        title={(category.isActive ?? true) ? 'Mark as planning only' : 'Mark as active'}
                                    >
                                        {(category.isActive ?? true) ? (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </>
                            )}
                            {categoryData.type === 'multiple' && (
                                <button
                                    onClick={() => {
                                        setPreselectedCategory(category);
                                        setShowItemForm(true);
                                    }}
                                    className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                                    title="Add item"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => onDeleteCategory(category.id)}
                                className="p-1 text-base-content/60 hover:text-base-content rounded transition-colors"
                                title="Delete category"
                            >
                                <TbTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'monthlyNeed',
            header: 'Needed/Month',
            cell: ({ row }) => {
                if (row.original.type === 'item') {
                    const displayInfo = row.original.displayInfo;
                    return (
                        <div className="text-right text-sm text-base-content/60">
                            ${(displayInfo.monthlyAmount || 0).toFixed(2)}
                        </div>
                    );
                }

                const categoryData = row.original.categoryData;
                return (
                    <div className={`text-right font-medium ${categoryData.type === 'single' && !categoryData.isActive
                        ? 'text-base-content/60'
                        : 'text-base-content'
                        }`}>
                        ${categoryData.monthlyNeed.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'perPaycheckNeed',
            header: 'Per Paycheck',
            cell: ({ row }) => {
                if (row.original.type === 'item') {
                    const displayInfo = row.original.displayInfo;
                    return (
                        <div className="text-right text-sm text-base-content/60">
                            ${(displayInfo.perPaycheckAmount || 0).toFixed(2)}
                            {displayInfo.paychecksUntilDue && (
                                <div className="text-xs text-base-content/60 mt-1">
                                    {displayInfo.paychecksUntilDue} left
                                </div>
                            )}
                        </div>
                    );
                }

                const categoryData = row.original.categoryData;
                return (
                    <div className={`text-right font-medium ${categoryData.type === 'single' && !categoryData.isActive
                        ? 'text-base-content/60'
                        : 'text-base-content/60'
                        }`}>
                        ${categoryData.perPaycheckNeed.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'available',
            header: 'Available',
            cell: ({ row }) => {
                if (row.original.type === 'item') {
                    const item = row.original.item;
                    return (
                        <div className="text-right text-sm font-medium text-base-content">
                            ${(item.allocated || 0).toFixed(2)}
                        </div>
                    );
                }

                const category = row.original.category;
                const isOverspent = (category.available || 0) < 0;

                return (
                    <div className="text-right">
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${isOverspent
                                ? 'text-error bg-error/10'
                                : 'text-success bg-success/10'
                                }`}
                            onClick={() => handleMoveMoneyClick(category)}
                        >
                            ${Math.abs(category.available || 0).toFixed(2)}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'dueDate',
            header: 'Due Date',
            cell: ({ row }) => {
                if (row.original.type === 'item') {
                    const item = row.original.item;
                    if (!item.dueDate) return null;

                    const urgency = getPayPeriodUrgency(item.dueDate);
                    const display = formatDueDate(item.dueDate);

                    return (
                        <div className="text-right">
                            <Badge
                                variant="soft"
                                className={`text-xs ${getPayPeriodColor(urgency)}`}
                            >
                                <Calendar className="w-3 h-3 mr-1" />
                                {display}
                            </Badge>
                        </div>
                    );
                }

                const categoryData = row.original.categoryData;
                if (!categoryData.dueDateInfo) return null;

                return (
                    <div className="text-right">
                        <Badge
                            variant="soft"
                            className={`text-xs ${getPayPeriodColor(categoryData.dueDateInfo.urgency)}`}
                        >
                            <Calendar className="w-3 h-3 mr-1" />
                            {categoryData.dueDateInfo.display}
                            {categoryData.dueDateInfo.additionalCount > 0 && (
                                <span className="ml-1">+{categoryData.dueDateInfo.additionalCount}</span>
                            )}
                        </Badge>
                    </div>
                );
            },
        },
    ], [getPayPeriodUrgency, formatDueDate, getPayPeriodColor, onToggleItemActive, onDeleteItem, onToggleCategoryActive, onDeleteCategory, fundCategory, getCategoryMonthData]);

    // Initialize table
    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getSubRows: row => row.subRows,
        initialState: {
            pagination: {
                pageSize: 50,
            },
        },
        meta: {
            setTableSettings,
        },
        state: {
            tableSettings,
        },
    });

    // State for editing categories
    const [showEditCategory, setShowEditCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // State for money movement
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedCategoryForMove, setSelectedCategoryForMove] = useState(null);

    // Handle form submissions
    const handleItemFormSubmit = (itemData) => {
        if (editingItem) {
            onEditItem({ ...itemData, id: editingItem.id });
        } else {
            onAddItem(itemData);
        }
        setShowItemForm(false);
        setEditingItem(null);
        setPreselectedCategory(null);
    };

    const handleItemFormClose = () => {
        setShowItemForm(false);
        setEditingItem(null);
        setPreselectedCategory(null);
    };

    const handleCategoryFormSubmit = (categoryData, addAnother = false) => {
        if (editingCategory) {
            onEditCategory({ ...categoryData, id: editingCategory.id });
            setShowEditCategory(false);
            setEditingCategory(null);
        } else {
            onAddCategory(categoryData);
            if (!addAnother) {
                setShowAddCategory(false);
            }
        }
    };

    const handleCategoryFormClose = () => {
        setShowAddCategory(false);
        setShowEditCategory(false);
        setEditingCategory(null);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowEditCategory(true);
    };

    const handleMoveMoneyClick = (category) => {
        setSelectedCategoryForMove(category);
        setShowMoveModal(true);
    };

    const handleMoneyMove = (sourceId, destinationId, amount) => {
        if (transferFunds) {
            transferFunds(sourceId, destinationId, amount);
        }
        setShowMoveModal(false);
        setSelectedCategoryForMove(null);
    };

    return (
        <div className="space-y-6">
            {/* Monthly Budget Navigator */}
            <MonthlyBudgetNavigator
                currentBudgetMonth="current"
                getMonthDisplayName={() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                navigateToNextMonth={() => { }}
                navigateToPrevMonth={() => { }}
                navigateToMonth={() => { }}
                getAvailableMonths={() => []}
                getMonthSummary={() => monthSummary}
                onCarryForward={null}
            />

            {/* Enhanced Budget Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table
                        hoverable
                        zebra
                        dense={tableSettings.enableRowDense}
                        className="min-w-full"
                    >
                        <THead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <Th
                                            key={header.id}
                                            className="relative"
                                            style={{ width: header.getSize() }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className={`flex items-center space-x-2 ${header.column.getCanSort()
                                                        ? 'cursor-pointer select-none'
                                                        : ''
                                                        }`}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <TableSortIcon column={header.column} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column Filter */}
                                            {header.column.getCanFilter() &&
                                                tableSettings.enableColumnFilters && (
                                                    <div className="mt-2">
                                                        <ColumnFilter column={header.column} />
                                                    </div>
                                                )}
                                        </Th>
                                    ))}
                                </Tr>
                            ))}
                        </THead>

                        <TBody>
                            {table.getRowModel().rows.map((row) => (
                                <Tr
                                    key={row.id}
                                    className={`hover ${row.original.type === 'item' ? 'bg-base-100' : ''
                                        }`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <Td key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="border-t border-base-300 px-4 py-3">
                    <PaginationSection table={table} />
                </div>
            </Card>

            {/* Item Form Modal */}
            {showItemForm && (
                <UnifiedItemForm
                    isOpen={showItemForm}
                    onClose={handleItemFormClose}
                    onSubmit={handleItemFormSubmit}
                    categories={categories}
                    editingItem={editingItem}
                    preselectedCategory={preselectedCategory}
                />
            )}

            {/* Category Form Modal */}
            {showAddCategory && (
                <UnifiedCategoryForm
                    category={null}
                    onSave={handleCategoryFormSubmit}
                    onCancel={handleCategoryFormClose}
                    accounts={accounts}
                    currentPay={0}
                />
            )}

            {/* Edit Category Form Modal */}
            {showEditCategory && (
                <UnifiedCategoryForm
                    category={editingCategory}
                    onSave={handleCategoryFormSubmit}
                    onCancel={handleCategoryFormClose}
                    accounts={accounts}
                    currentPay={0}
                />
            )}

            {/* Money Movement Modal */}
            {showMoveModal && selectedCategoryForMove && (
                <MoneyMovementModal
                    amount={selectedCategoryForMove.available || 0}
                    sourceCategory={selectedCategoryForMove}
                    categories={categories}
                    onMove={handleMoneyMove}
                    onClose={() => {
                        setShowMoveModal(false);
                        setSelectedCategoryForMove(null);
                    }}
                />
            )}
        </div>
    );
};

export default UnifiedEnvelopeBudgetView;
