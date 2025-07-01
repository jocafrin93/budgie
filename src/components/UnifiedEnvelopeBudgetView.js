// src/components/UnifiedEnvelopeBudgetView.js
import {
    ArrowRight,
    BanknoteArrowDown,
    Box,
    Calendar,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Lock,
    Plus,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Unlock
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { frequencyOptions } from '../utils/constants';
import { CurrencyField } from './form';


// Drag and Drop Constants
const DND_TYPES = {
    PLANNING_ITEM: 'planning_item',
    CATEGORY: 'category'
};

// 
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

    // Optional
    onShowPaydayWorkflow,
    recentPaycheck = null,

    // Paycheck configuration
    payFrequency,
    payFrequencyOptions,
    getAllUpcomingPaycheckDates
}) => {
    // Track expanded categories
    const [expandedCategories, setExpandedCategories] = useState({});

    // State for adding new categories
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('single');

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
        console.log('Sorting by:', column); // Debug log

        if (column === 'manual') {
            // Switch to manual sort mode
            setSortBy('manual');
            setSortDirection('asc');
            return;
        }

        if (sortBy === column) {
            // Toggle direction for same column
            const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            setSortDirection(newDirection);
            console.log('Toggled direction to:', newDirection);
        } else {
            // New column, start with ascending
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

        // Set up neighbor tracking
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

        // Always calculate from original positions
        const newCurrentWidth = Math.max(minWidth, startWidth.current + diff);

        if (neighborColumn.current) {
            const currentChange = newCurrentWidth - startWidth.current;
            const newNeighborWidth = Math.max(minWidth, startNeighborWidth.current - currentChange);

            // Recalculate current if neighbor hit minimum
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

    const handleMouseMove = (e) => {
        if (!isResizing.current || !currentColumn.current) return;

        const diff = e.clientX - startX.current;

        // Define minimum widths
        const minWidths = {
            category: 150,
            needed: 80,
            perPaycheck: 80,
            available: 80,
            dueDate: 100
        };

        const currentMinWidth = minWidths[currentColumn.current] || 80;
        const newWidth = Math.max(currentMinWidth, startWidth.current + diff);

        // EXCEL-STYLE: Find the next resizable column to the right
        const columnOrder = ['category', 'needed', 'perPaycheck', 'available', 'dueDate'];
        const currentIndex = columnOrder.indexOf(currentColumn.current);

        if (currentIndex === -1 || currentIndex === columnOrder.length - 1) {
            // Last column or not found - just resize normally
            setColumnWidths(prev => ({
                ...prev,
                [currentColumn.current]: newWidth
            }));
            return;
        }

        // Find the next column to compensate
        const nextColumnKey = columnOrder[currentIndex + 1];
        const nextMinWidth = minWidths[nextColumnKey] || 80;

        // Calculate how much the current column changed
        const currentChange = newWidth - columnWidths[currentColumn.current];

        // The next column shrinks by the same amount
        const nextColumnNewWidth = Math.max(
            nextMinWidth,
            columnWidths[nextColumnKey] - currentChange
        );

        // If the next column hit its minimum, adjust the current column accordingly
        const actualNextChange = columnWidths[nextColumnKey] - nextColumnNewWidth;
        const adjustedCurrentWidth = columnWidths[currentColumn.current] + actualNextChange;

        setColumnWidths(prev => ({
            ...prev,
            [currentColumn.current]: adjustedCurrentWidth,
            [nextColumnKey]: nextColumnNewWidth
        }));
    };

    // const handleMouseUp = () => {
    //     isResizing.current = false;
    //     currentColumn.current = null;
    //     document.removeEventListener('mousemove', handleMouseMove);
    //     document.removeEventListener('mouseup', handleMouseUp);
    // };

    // Pay period urgency calculation
    const getPayPeriodUrgency = (dateString) => {
        if (!dateString) return null;

        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Mock pay period logic - would use actual pay schedule from app config
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
                return 'text-red-700 bg-red-100 border border-red-200 hover:bg-red-200';
            case 'next-period':
                return 'text-orange-700 bg-orange-100 border border-orange-200 hover:bg-orange-200';
            case 'future':
                return 'text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200';
            default:
                return 'text-gray-600 bg-gray-100 border border-gray-200 hover:bg-gray-200';
        }
    }

    const formatDueDate = (dateString) => {
        if (!dateString) return null;

        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        const dayStr = date.getDate();
        return `${monthStr} ${dayStr}`;
    };

    // Conservative paycheck info (existing logic)
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

    // Amount display calculation (existing logic)
    const getAmountDisplayInfo = (item, payFrequency, payFrequencyOptions) => {
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
            // FIXED: Use actual paycheck dates instead of estimating
            try {
                const upcomingPaychecks = getAllUpcomingPaycheckDates(6); // Get 6 months of paychecks

                // Parse due date as local date to avoid timezone issues
                const dueDateStr = item.dueDate;
                const [year, month, day] = dueDateStr.split('-').map(Number);
                const localDueDate = new Date(year, month - 1, day);

                // Count actual paychecks before the due date
                const paychecksBeforeDue = upcomingPaychecks.filter(p => p.date < localDueDate);
                paychecksUntilDue = paychecksBeforeDue.length;

                // If there are paychecks remaining, calculate per-paycheck amount needed
                if (paychecksUntilDue > 0) {
                    const allocated = item.allocated || 0;
                    const targetAmount = isGoal ?
                        (item.targetAmount || monthlyAmount) : monthlyAmount;
                    const remaining = Math.max(0, targetAmount - allocated);
                    perPaycheckAmount = remaining / paychecksUntilDue;
                }
            } catch (error) {
                console.warn('Error calculating paychecks until due, falling back to estimation:', error);
                // Fallback to original logic if getAllUpcomingPaycheckDates fails
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
            // Fallback when getAllUpcomingPaycheckDates is not available
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

    // Get category data (existing logic)
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

            const displayInfo = getAmountDisplayInfo(singleData, payFrequency, payFrequencyOptions);
            const dueDateInfo = singleData.dueDate ? {
                date: singleData.dueDate,
                urgency: getPayPeriodUrgency(singleData.dueDate),
                display: formatDueDate(singleData.dueDate)
            } : null;
            const isActive = category.isActive ?? true; // Default to true if not set

            // If category is inactive, set needs to 0
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
            // Similar fix for multiple item categories
            const activeItems = categoryItems.filter(item => item.isActive);

            const totalPerPaycheckNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);
                return total + Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
            }, 0);;

            const totalMonthlyNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);
                return total + displayInfo.monthlyAmount;
            }, 0);

            // Calculate due date info for multiple categories
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

    // Then sort the filtered budget categories
    const sortedCategories = useMemo(() => {
        if (sortBy === 'manual') {
            // Return budget categories in their stored order (allows manual reordering)
            return [...budgetCategories];
        }

        // Apply other sorting logic to budgetCategories
        return [...budgetCategories].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'allocated':
                    return (b.allocated || 0) - (a.allocated || 0);
                case 'available':
                    return (b.available || 0) - (a.available || 0);
                case 'need':
                    // You'd need to calculate the need for each category here
                    const aNeed = getCategoryData(a).perPaycheckNeed || 0;
                    const bNeed = getCategoryData(b).perPaycheckNeed || 0;
                    return bNeed - aNeed;
                default:
                    return 0;
            }
        });
    }, [budgetCategories, sortBy]);


    // Handle adding new category
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        if (onAddCategory) {
            onAddCategory({
                name: newCategoryName,
                type: newCategoryType,
                available: 0,
                allocated: 0
            });
        }

        setNewCategoryName('');
        setShowAddCategory(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
                        <BanknoteArrowDown className="w-7 h-7" />
                        Budget
                    </h2>
                    <p className="text-theme-secondary">
                        Enhanced categories with both single and multiple expense types
                    </p>
                </div>


            </div>

            {/* Table Container */}
            <div className="bg-theme-primary rounded-lg shadow-sm border border-theme-primary overflow-hidden">
                {/* Ready to Assign Header */}
                <div className="table-header border-b border-theme-secondary p-4">
                    <div className="justify-between">
                        {/* Left side: Title
                        <div>
                            <h3 className="text-lg font-semibold text-theme-primary">Budget Categories</h3>
                            <p className="text-sm text-theme-secondary">YNAB-style envelope budgeting</p>
                        </div> */}

                        {/* Right side: Ready to Assign section */}
                        <div className="flex flex-col items-center gap-3">
                            {/* Ready to Assign label and amount - centered */}
                            <div className="text-center">
                                <div className="text-lg text-theme-secondary">Ready to Assign</div>
                                <div className={`text-lg font-bold ${toBeAllocated > 0 ? 'text-theme-green' :
                                    toBeAllocated < 0 ? 'text-theme-red' : 'text-theme-secondary'
                                    }`}>
                                    ${toBeAllocated.toFixed(2)}
                                </div>
                            </div>

                            {/* Buttons side-by-side beneath the amount */}
                            <div className="flex items-center gap-2">
                                {recentPaycheck && (
                                    <button
                                        onClick={onShowPaydayWorkflow}
                                        className="btn-success px-4 py-2 rounded-lg text-sm"
                                    >
                                        Allocate Paycheck
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="btn-success flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <table ref={tableRef} className="w-full table-fixed" style={{ minWidth: '800px', maxWidth: '100%' }}>
                        <thead className="table-header border-b border-theme-secondary">
                            <tr>
                                <th className="px-2 py-3 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider w-10 flex-shrink-0">
                                    <button
                                        onClick={() => handleSort('manual')}
                                        className={`p-1.5 rounded-full transition-all duration-200 ${sortBy === 'manual'
                                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                                            : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-300'
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
                                    className="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.category }}
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">Category
                                            <button
                                                onClick={onAddCategory}
                                            >
                                                <Plus className="w-5 h-5 text-theme-tertiary" />
                                            </button>
                                        </span>                                         {sortBy === 'name' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}

                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize "
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // This is the key fix!
                                            handleMouseDown(e, 'category');
                                        }}
                                    />

                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize "
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // This is the key fix!
                                            handleMouseDown(e, 'needed');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize "
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // This is the key fix!
                                            handleMouseDown(e, 'perPaycheck');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize "
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // This is the key fix!
                                            handleMouseDown(e, 'available');
                                        }}
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
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
                                        className="absolute right-0 top-0 w-3 h-full cursor-col-resize "
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // This is the key fix!
                                            handleMouseDown(e, 'dueDate');
                                        }}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-secondary">
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
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="table-header border-t border-theme-secondary p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-theme-secondary">
                            {sortedCategories.length} categories • {planningItems.filter(item => item.isActive).length} active items
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs text-theme-tertiary">Total Allocated</div>
                                <div className="font-medium text-theme-primary">
                                    ${sortedCategories.reduce((total, cat) => total + (cat.allocated || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-theme-tertiary">Total Available</div>
                                <div className="font-medium text-theme-primary">
                                    ${sortedCategories.reduce((total, cat) => total + (cat.available || 0), 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

// Category Table Row Component with all drag-and-drop functionality
const CategoryTableRow = ({
    category,
    categoryData,
    index,
    sortBy,
    isExpanded,
    onToggleExpand,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onToggleCategoryActive,
    onMoveItem,
    onReorderCategories,
    onReorderItems,
    // fundCategory,
    transferFunds,
    getAmountDisplayInfo,
    getPayPeriodColor,
    formatDueDate,
    getPayPeriodUrgency,
    payFrequency,
    categories,

}) => {
    const isOverspent = (category.available || 0) < 0;
    const isManualSortMode = sortBy === 'manual';
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Drag functionality for category reordering
    const [{ isDraggingCategory }, dragCategory] = useDrag({
        type: DND_TYPES.CATEGORY,
        item: {
            id: category.id,
            index,
            type: 'category'
        },
        canDrag: isManualSortMode, // Only allow drag in manual mode
        collect: (monitor) => ({
            isDraggingCategory: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, dropCategory] = useDrop({
        accept: [DND_TYPES.CATEGORY, DND_TYPES.PLANNING_ITEM],
        canDrop: (draggedItem) => {
            if (!isManualSortMode && draggedItem.type === 'category') {
                return false; // Disable category drops when not in manual mode
            }

            if (draggedItem.categoryId !== undefined && draggedItem.type !== 'category') {
                // Planning items can always be moved between categories
                if (draggedItem.categoryId !== category.id && categoryData.type === 'single') {
                    return false;
                }
                return true;
            } else {
                // Category reordering only in manual mode
                return isManualSortMode && draggedItem.id !== category.id;
            }
        },
        drop: (draggedItem) => {
            if (draggedItem.categoryId !== undefined && draggedItem.type !== 'category') {
                // Planning item moves
                if (draggedItem.categoryId !== category.id && onMoveItem) {
                    onMoveItem(draggedItem.id, category.id);
                }
            } else if (isManualSortMode) {
                // Category reordering only in manual mode
                if (draggedItem.id !== category.id && onReorderCategories) {
                    onReorderCategories(draggedItem.index, index);
                }
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    return (
        <>
            {/* Main Category Row */}
            <tr
                ref={dropCategory}
                className={`hover:table-row-hover transition-colors ${isOverspent ? 'bg-theme-secondary border-l-4 border-theme-red' :
                    (categoryData.type === 'single' && !categoryData.isActive) ? 'bg-theme-tertiary border-l-4 border-theme-tertiary opacity-60' :
                        'table-row-even'
                    } ${isDraggingCategory ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-theme-tertiary border-l-4 border-theme-blue' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Expand/Collapse + Drag Handle */}
                <td className="px-1 py-2 min-w-0 w-18">
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {/* Drag Handle */}
                        <div
                            ref={dragCategory}
                            className={`p-0.5 flex-shrink-0 transition-colors ${isManualSortMode
                                ? 'cursor-grab active:cursor-grabbing text-theme-tertiary hover:text-theme-secondary hover:bg-theme-tertiary rounded'
                                : 'cursor-not-allowed text-theme-disabled opacity-50'
                                }`}
                            title={
                                isManualSortMode
                                    ? "Drag to reorder categories"
                                    : "Click the unlock button in header to enable reordering"  // Updated tooltip
                            }
                        >
                            <GripVertical className="w-3 h-3" />
                        </div>

                        {/* Expand/Collapse Button */}
                        <button
                            onClick={onToggleExpand}
                            className="text-theme-tertiary hover:text-theme-secondary p-0.5 flex-shrink-0 hover:bg-theme-tertiary rounded transition-colors"
                            title="Expand/collapse category"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </td>


                {/* Category Name */}
                <td className="px-4 py-2" style={{ minWidth: '280px' }}>
                    <div className="flex items-center justify-between"> {/* CHANGED: Added justify-between */}
                        {/* Left side: Color dot + name + icon */}
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${category.color || 'bg-theme-tertiary'} border border-theme-primary shadow-sm`}></div>

                            <button
                                onClick={() => onEditCategory(category)}
                                className={`font-medium hover:text-theme-blue transition-colors text-left ${categoryData.type === 'single' && !categoryData.isActive
                                    ? 'text-theme-tertiary'
                                    : 'text-theme-primary'
                                    }`}
                            >
                                {category.name}
                            </button>
                            {categoryData.type === 'multiple' && (
                                <Box className="w-3 h-3 text-theme-tertiary ml-1" />
                            )}
                        </div>

                        {/* INLINE ACTIONS - appear on hover */}
                        <div className={`flex items-center gap-1 transition-all duration-200 ${isHovered
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 pointer-events-none'
                            }`}>
                            {categoryData.type === 'single' && (
                                <button
                                    onClick={() => onToggleCategoryActive(category.id, !(category.isActive ?? true))}
                                    className={`p-1 rounded transition-colors ${(category.isActive ?? true)
                                        ? 'text-theme-green hover:text-theme-green hover:bg-theme-active'
                                        : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-active'
                                        }`}
                                    title={(category.isActive ?? true) ? 'Mark as planning only' : 'Mark as active'}
                                >
                                    {(category.isActive ?? true) ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            {categoryData.type === 'multiple' && (
                                <button
                                    onClick={() => {
                                        console.log('Adding item to category:', category.name, 'ID:', category.id);
                                        onAddItem({ preselectedCategory: category });
                                    }}
                                    className="p-1 text-theme-secondary hover:text-theme-green hover:bg-theme-active rounded transition-colors"
                                    title="Add item"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => onDeleteCategory(category.id)}
                                className="p-1 text-theme-secondary hover:text-theme-red hover:bg-theme-active rounded transition-colors"
                                title="Delete category"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </td>

                {/* Needed per Month */}
                <td className="px-4 py-2 text-right">
                    <div className={`font-medium ${categoryData.type === 'single' && !categoryData.isActive
                        ? 'text-theme-tertiary'
                        : 'text-theme-primary'
                        }`}>
                        ${categoryData.monthlyNeed.toFixed(2)}
                    </div>
                </td>

                {/* Per Paycheck */}
                <td className="px-4 py-2 text-right">
                    <div className={`font-medium ${categoryData.type === 'single' && !categoryData.isActive
                        ? 'text-theme-tertiary'
                        : 'text-theme-secondary'
                        }`}>
                        ${categoryData.perPaycheckNeed.toFixed(2)}
                    </div>
                </td>

                {/* Available */}
                <td className="px-4 py-2 text-right">
                    <span
                        onClick={() => setShowMoveModal(true)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${isOverspent
                            ? 'text-theme-red bg-theme-secondary border border-theme-red'
                            : 'text-theme-green bg-theme-secondary border border-theme-green'
                            }`}
                        title="Click to move money"
                    >
                        ${(category.available || 0).toFixed(2)}
                    </span>
                </td>

                {/* Due Date */}
                <td className="px-4 py-2 text-center">
                    {categoryData.dueDateInfo ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-default transition-all ${getPayPeriodColor(categoryData.dueDateInfo.urgency)}`}>
                            {categoryData.dueDateInfo.display}
                            {categoryData.dueDateInfo.additionalCount > 0 && (
                                <span className="text-xs opacity-75">
                                    +{categoryData.dueDateInfo.additionalCount}
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-theme-tertiary text-xs">—</span>
                    )}
                </td>



            </tr>

            {/* Expanded Content */}
            {isExpanded && (
                <>
                    {categoryData.type === 'single' ? (
                        /* Single Category - Show additional info */
                        <tr className="bg-theme-secondary">
                            <td className="px-4 py-2 min-w-0 w-16"></td>
                            <td colSpan="5" className="px-4 py-2"> {/* CHANGED: was colSpan="6" */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-theme-secondary">
                                            <span className="font-medium">Paychecks remaining:</span> {categoryData.paychecksUntilDue || '—'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        /* Multiple Category - Show items */
                        <>
                            {categoryData.items.map((item, itemIndex) => (
                                <ItemTableRow
                                    key={item.id}
                                    item={item}
                                    itemIndex={itemIndex}
                                    category={category}
                                    onEditItem={onEditItem}
                                    onDeleteItem={onDeleteItem}
                                    onToggleItemActive={onToggleItemActive}
                                    onReorderItems={onReorderItems}
                                    getAmountDisplayInfo={getAmountDisplayInfo}
                                    getPayPeriodColor={getPayPeriodColor}
                                    formatDueDate={formatDueDate}
                                    getPayPeriodUrgency={getPayPeriodUrgency}
                                    payFrequency={payFrequency}
                                />
                            ))}

                            {/* Add Item Row */}
                            <tr className="bg-theme-tertiary">
                                <td className="px-4 py-1 min-w-0 w-16"></td>
                                <td colSpan="5" className="px-4 py-1"> {/* CHANGED: was colSpan="6" */}
                                    <button
                                        onClick={() => {
                                            console.log('Adding item to category:', category.name, 'ID:', category.id);
                                            onAddItem({ preselectedCategory: category });
                                        }}
                                        className="flex items-center gap-2 text-sm text-theme-blue hover:text-theme-blue ml-8"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Item to {category.name}
                                    </button>
                                </td>
                            </tr>
                        </>
                    )}
                </>
            )}

            {/* Money Movement Modal */}
            {showMoveModal && (
                <MoneyMovementModal
                    amount={category.available || 0}
                    sourceCategory={category}
                    categories={categories}
                    onMove={transferFunds}
                    onClose={() => setShowMoveModal(false)}
                />
            )}
        </>
    );
};

// Item Table Row Component with drag-and-drop
const ItemTableRow = ({
    item,
    itemIndex,
    category,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onReorderItems,
    getAmountDisplayInfo,
    getPayPeriodColor,
    formatDueDate,
    getPayPeriodUrgency,
    payFrequency
}) => {
    // Drag functionality for item reordering and moving
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPES.PLANNING_ITEM,
        item: {
            id: item.id,
            categoryId: item.categoryId,
            index: itemIndex,
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    // Drop functionality for item reordering within category
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPES.PLANNING_ITEM,
        canDrop: (draggedItem) => {
            return draggedItem.categoryId === item.categoryId;
        },
        drop: (draggedItem) => {
            if (draggedItem.id !== item.id && draggedItem.categoryId === item.categoryId) {
                if (onReorderItems) {
                    onReorderItems(category.id, draggedItem.index, itemIndex);
                }
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    // Combine refs
    const combinedRef = (node) => {
        drag(node);
        drop(node);
    };

    const [isHovered, setIsHovered] = useState(false);
    const displayInfo = getAmountDisplayInfo(item, payFrequency);
    const urgency = getPayPeriodUrgency(item.dueDate);

    return (
        <tr
            ref={combinedRef}
            className={`${item.isActive ? 'bg-theme-secondary' : 'bg-theme-active'} border-l-4 ${item.isActive ? 'border-theme-green' : 'border-theme-tertiary'
                } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-theme-quaternary border-theme-blue' : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <td className="px-4 py-2 min-w-0 w-16">
                <div className="flex items-center justify-center flex-shrink-0">
                    <GripVertical className="w-3 h-3 text-theme-tertiary cursor-grab" />
                </div>
            </td>

            <td className="px-4 py-2" style={{ minWidth: '280px' }}>
                <div className="flex items-center justify-between ml-8"> {/* CHANGED: Added justify-between, kept ml-8 for indentation */}
                    {/* Left side: Item info */}
                    <div className="flex-1 min-w-0"> {/* CHANGED: Added flex-1 min-w-0 for proper text truncation */}
                        <button
                            onClick={() => onEditItem(item)}
                            className="font-medium text-theme-primary text-sm hover:text-theme-blue transition-colors text-left"
                        >
                            {item.name}
                        </button>
                        <div className="text-xs text-theme-secondary">
                            ${item.amount} {item.frequency}
                        </div>
                    </div>

                    {/* Right side: Actions aligned to right edge */}
                    <div className={`flex items-center gap-1 transition-all duration-200 ${isHovered
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95 pointer-events-none'
                        }`}>
                        <button
                            onClick={() => onToggleItemActive(item.id, !item.isActive)}
                            className={`p-1 rounded transition-colors ${item.isActive
                                ? 'text-theme-green hover:text-theme-green hover:bg-theme-primary'
                                : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-primary'
                                }`}
                            title={item.isActive ? 'Mark as planning only' : 'Mark as active'}
                        >
                            {item.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1 text-theme-secondary hover:text-theme-red hover:bg-theme-primary rounded transition-colors"
                            title="Delete item"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </td>

            <td className="px-4 py-2 text-right">
                <div className="text-sm text-theme-secondary">
                    ${(displayInfo.monthlyAmount || 0).toFixed(2)}
                </div>
            </td>

            <td className="px-4 py-2 text-right">
                <div className="text-sm text-theme-secondary">
                    ${(displayInfo.perPaycheckAmount || 0).toFixed(2)}
                    {displayInfo.paychecksUntilDue && (
                        <div className="text-xs text-theme-tertiary mt-1">
                            {displayInfo.paychecksUntilDue} left
                        </div>
                    )}
                </div>
            </td>

            <td className="px-4 py-2 text-right">
                <div className="text-sm font-medium text-theme-primary">
                    ${(item.allocated || 0).toFixed(2)}
                </div>
            </td>

            <td className="px-4 py-2 text-center">
                {item.dueDate ? (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getPayPeriodColor(urgency)}`}>
                        {formatDueDate(item.dueDate)}
                    </span>
                ) : (
                    <span className="text-theme-tertiary text-xs">—</span>
                )}
            </td>

            {/* REMOVED: The duplicate Actions column */}
        </tr>
    );
};

// Money Assignment Modal using theme classes
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
            <div className="bg-theme-primary rounded-lg p-6 w-96 shadow-xl border border-theme-secondary">
                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Assign Money to Category</h3>

                <div className="space-y-4">
                    <div className="p-3 bg-theme-secondary border border-theme-secondary rounded-lg">
                        <div className="text-sm text-theme-secondary">Available to assign:</div>
                        <div className="text-2xl font-bold text-theme-green">
                            ${availableAmount.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
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
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            Amount
                        </label>
                        <CurrencyField
                            name="assignAmount"
                            value={assignAmount}
                            onChange={(e) => setAssignAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
                            hideLabel={true}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="btn-secondary px-4 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedCategoryId || !assignAmount || parseFloat(assignAmount) <= 0}
                        className="btn-success px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign Money
                    </button>
                </div>
            </div>
        </div>
    );
};

// Money Movement Modal Component
const MoneyMovementModal = ({ amount, sourceCategory, categories, onMove, onClose }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [moveAmount, setMoveAmount] = useState(Math.abs(amount).toFixed(2));

    const handleMove = () => {
        if (selectedCategoryId && moveAmount) {
            const parsedAmount = parseFloat(moveAmount);
            const source = sourceCategory.id;

            let destination;
            if (selectedCategoryId === 'ready-to-assign') {
                destination = 'toBeAllocated';
            } else {
                destination = parseInt(selectedCategoryId, 10);
            }

            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                onMove(source, destination, parsedAmount);
                onClose();
            }
        }
    };

    const maxAmount = Math.abs(amount);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-theme-primary rounded-lg p-6 w-96 shadow-xl border border-theme-secondary">
                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Move Money</h3>

                <div className="space-y-4">
                    <div className="p-3 bg-theme-secondary border border-theme-secondary rounded-lg">
                        <div className="text-sm text-theme-secondary">Moving from:</div>
                        <div className="font-semibold text-theme-primary">
                            {sourceCategory.name} (${(sourceCategory.available || 0).toFixed(2)} available)
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
                        >
                            <option value="">Select destination...</option>
                            <option value="ready-to-assign">Ready to Assign</option>
                            {categories
                                .filter(cat => cat.id !== sourceCategory.id)
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} (${(cat.available || 0).toFixed(2)} available)
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            Amount
                        </label>
                        <CurrencyField
                            name="moveAmount"
                            value={moveAmount}
                            onChange={(e) => setMoveAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
                            hideLabel={true}
                        />
                        {maxAmount > 0 && (
                            <div className="text-xs text-theme-secondary mt-1">
                                Maximum: ${maxAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="btn-secondary px-4 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={!selectedCategoryId || !moveAmount || parseFloat(moveAmount) <= 0}
                        className="btn-success px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Move Money
                    </button>
                </div>
            </div>
        </div>
    );
};


export default UnifiedEnvelopeBudgetView;