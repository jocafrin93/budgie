// src/components/UnifiedEnvelopeBudgetView.js
import {
    ArrowRight,
    Box,
    Calendar,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Plus,
    Target,
    ToggleLeft,
    ToggleRight,
    Trash2
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { frequencyOptions } from '../utils/constants';
import CurrencyInput from './CurrencyInput';

// Drag and Drop Constants
const DND_TYPES = {
    PLANNING_ITEM: 'planning_item',
    CATEGORY: 'category'
};

/**
 * Table-based Unified EnvelopeBudgetView component with resizable columns
 */
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
    onMoveItem,
    onReorderItems,
    onReorderCategories,

    // Optional
    onShowPaydayWorkflow,
    recentPaycheck = null,

    // Paycheck configuration
    payFrequency,
    payFrequencyOptions
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
        category: 250,
        needed: 120,
        perPaycheck: 120,
        available: 120,
        dueDate: 130
    });

    // Refs for column resizing
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
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    // Column resizing handlers
    const handleMouseDown = (e, columnKey) => {
        isResizing.current = true;
        currentColumn.current = columnKey;
        startX.current = e.clientX;
        startWidth.current = columnWidths[columnKey];

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isResizing.current || !currentColumn.current) return;

        const diff = e.clientX - startX.current;
        const newWidth = Math.max(80, startWidth.current + diff); // Minimum width of 80px

        setColumnWidths(prev => ({
            ...prev,
            [currentColumn.current]: newWidth
        }));
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        currentColumn.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Pay period urgency calculation
    const getPayPeriodUrgency = (dateString) => {
        if (!dateString) return null;

        const dueDate = new Date(dateString);
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
            case 'current-period': return 'text-theme-red bg-theme-secondary';
            case 'next-period': return 'text-theme-yellow bg-theme-tertiary';
            case 'future': return 'text-theme-secondary bg-theme-quaternary';
            default: return 'text-theme-secondary bg-theme-quaternary';
        }
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
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
        if (dueDate) {
            const dueTime = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
            const todayTime = new Date(today.getTime() + today.getTimezoneOffset() * 60000);
            const daysUntilDue = Math.ceil((dueTime - todayTime) / (24 * 60 * 60 * 1000));

            paychecksUntilDue = Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));

            if (paychecksUntilDue > 0) {
                const allocated = item.allocated || 0;
                const targetAmount = isGoal ? (item.targetAmount || monthlyAmount) : monthlyAmount;
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
                    dueDateInfo: null
                };
            }

            const displayInfo = getAmountDisplayInfo(singleData, payFrequency, payFrequencyOptions);
            const dueDateInfo = singleData.dueDate ? {
                date: singleData.dueDate,
                urgency: getPayPeriodUrgency(singleData.dueDate),
                display: formatDueDate(singleData.dueDate)
            } : null;

            return {
                type: 'single',
                perPaycheckNeed: displayInfo.perPaycheckAmount,
                monthlyNeed: displayInfo.monthlyAmount,
                items: categoryItems,
                paychecksUntilDue: displayInfo.paychecksUntilDue,
                singleData,
                needsConfiguration: false,
                dueDateInfo
            };
        } else {
            const activeItems = categoryItems.filter(item => item.isActive);

            const totalPerPaycheckNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);
                return total + Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
            }, 0);

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

    // Sort categories
    const sortedCategories = [...categories].sort((a, b) => {
        const aData = getCategoryData(a);
        const bData = getCategoryData(b);

        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'needed':
                comparison = aData.monthlyNeed - bData.monthlyNeed;
                break;
            case 'perPaycheck':
                comparison = aData.perPaycheckNeed - bData.perPaycheckNeed;
                break;
            case 'available':
                comparison = a.available - b.available;
                break;
            case 'due':
                if (!aData.dueDateInfo && !bData.dueDateInfo) comparison = 0;
                else if (!aData.dueDateInfo) comparison = 1;
                else if (!bData.dueDateInfo) comparison = -1;
                else {
                    const urgencyOrder = { 'current-period': 0, 'next-period': 1, 'future': 2 };
                    const aUrgency = urgencyOrder[aData.dueDateInfo.urgency] || 3;
                    const bUrgency = urgencyOrder[bData.dueDateInfo.urgency] || 3;

                    if (aUrgency !== bUrgency) {
                        comparison = aUrgency - bUrgency;
                    } else {
                        comparison = new Date(aData.dueDateInfo.date) - new Date(bData.dueDateInfo.date);
                    }
                }
                break;
            default:
                comparison = 0;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
    });

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
                    <h2 className="text-2xl font-bold text-theme-primary">Budget</h2>
                    <p className="text-theme-secondary">Unified planning and allocation interface</p>
                </div>

                {recentPaycheck && (
                    <button
                        onClick={onShowPaydayWorkflow}
                        className="btn-success px-4 py-2 rounded-lg"
                    >
                        Allocate Recent Paycheck
                    </button>
                )}
            </div>

            {/* Table Container */}
            <div className="bg-theme-primary rounded-lg shadow-sm border border-theme-primary overflow-hidden">
                {/* Ready to Assign Header */}
                <div className="table-header border-b border-theme-secondary p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-theme-primary">Budget Categories</h3>
                            <p className="text-sm text-theme-secondary">YNAB-style envelope budgeting</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm text-theme-secondary">Ready to Assign</div>
                                <div className={`text-lg font-bold ${toBeAllocated > 0 ? 'text-theme-green' :
                                    toBeAllocated < 0 ? 'text-theme-red' : 'text-theme-secondary'
                                    }`}>
                                    ${toBeAllocated.toFixed(2)}
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="btn-success flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Assign
                            </button>
                            <button
                                onClick={onAddCategory}
                                className="btn-primary flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table ref={tableRef} className="w-full table-fixed">
                        <thead className="table-header border-b border-theme-secondary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider w-16 flex-shrink-0"></th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-hover relative"
                                    style={{ width: columnWidths.category }}
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Category
                                        {sortBy === 'name' && (
                                            <div className={`transform transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`}>
                                                ▲
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-theme-blue"
                                        onMouseDown={(e) => handleMouseDown(e, 'category')}
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
                                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-theme-blue"
                                        onMouseDown={(e) => handleMouseDown(e, 'needed')}
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
                                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-theme-blue"
                                        onMouseDown={(e) => handleMouseDown(e, 'perPaycheck')}
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
                                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-theme-blue"
                                        onMouseDown={(e) => handleMouseDown(e, 'available')}
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
                                        className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-theme-blue"
                                        onMouseDown={(e) => handleMouseDown(e, 'dueDate')}
                                    />
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-theme-secondary uppercase tracking-wider w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-secondary">
                            {sortedCategories.map((category, index) => (
                                <CategoryTableRow
                                    key={category.id}
                                    category={category}
                                    categoryData={getCategoryData(category)}
                                    index={index}
                                    isExpanded={expandedCategories[category.id]}
                                    onToggleExpand={() => toggleCategoryExpanded(category.id)}
                                    onEditCategory={onEditCategory}
                                    onDeleteCategory={onDeleteCategory}
                                    onAddItem={onAddItem}
                                    onEditItem={onEditItem}
                                    onDeleteItem={onDeleteItem}
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
                            {categories.length} categories • {planningItems.filter(item => item.isActive).length} active items
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs text-theme-tertiary">Total Allocated</div>
                                <div className="font-medium text-theme-primary">
                                    ${categories.reduce((total, cat) => total + (cat.allocated || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-theme-tertiary">Total Available</div>
                                <div className="font-medium text-theme-primary">
                                    ${categories.reduce((total, cat) => total + (cat.available || 0), 0).toFixed(2)}
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
    isExpanded,
    onToggleExpand,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onMoveItem,
    onReorderCategories,
    onReorderItems,
    fundCategory,
    transferFunds,
    getAmountDisplayInfo,
    getPayPeriodColor,
    formatDueDate,
    getPayPeriodUrgency,
    payFrequency,
    categories
}) => {
    const isOverspent = (category.available || 0) < 0;

    // State for money movement modal
    const [showMoveModal, setShowMoveModal] = useState(false);

    // Drag functionality for category reordering
    const [{ isDraggingCategory }, dragCategory] = useDrag({
        type: DND_TYPES.CATEGORY,
        item: { id: category.id, index },
        collect: (monitor) => ({
            isDraggingCategory: monitor.isDragging(),
        }),
    });

    // Drop functionality for category reordering and item moves
    const [{ isOver, canDrop }, dropCategory] = useDrop({
        accept: [DND_TYPES.CATEGORY, DND_TYPES.PLANNING_ITEM],
        canDrop: (draggedItem) => {
            if (draggedItem.categoryId !== undefined) {
                // This is a planning item
                if (draggedItem.categoryId !== category.id && categoryData.type === 'single') {
                    return false;
                }
                return true;
            } else {
                // This is a category
                return draggedItem.index !== index;
            }
        },
        drop: (draggedItem) => {
            if (draggedItem.categoryId !== undefined) {
                // Planning item cross-category move
                if (draggedItem.categoryId !== category.id && onMoveItem) {
                    onMoveItem(draggedItem.id, category.id);
                }
            } else {
                // Category reordering
                if (draggedItem.index !== index && onReorderCategories) {
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
                className={`hover:table-row-hover transition-colors ${isOverspent ? 'bg-theme-secondary border-l-4 border-theme-red' : 'table-row-even'
                    } ${isDraggingCategory ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-theme-tertiary border-l-4 border-theme-blue' : ''
                    }`}
            >
                {/* Expand/Collapse + Drag Handle */}
                <td className="px-4 py-2 min-w-0 w-16">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                            ref={dragCategory}
                            className="cursor-grab active:cursor-grabbing text-theme-tertiary hover:text-theme-secondary p-1 flex-shrink-0"
                            title="Drag to reorder categories"
                        >
                            <GripVertical className="w-3 h-3" />
                        </div>
                        <button
                            onClick={onToggleExpand}
                            className="text-theme-tertiary hover:text-theme-secondary p-1 flex-shrink-0"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </td>

                {/* Category Name */}
                <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${category.color || 'bg-theme-tertiary'} border border-theme-primary shadow-sm`}></div>
                        {categoryData.type === 'single' ? (
                            <Target className="w-4 h-4 text-theme-blue" />
                        ) : (
                            <Box className="w-4 h-4 text-theme-blue" />
                        )}
                        <button
                            onClick={() => onEditCategory(category)}
                            className="font-medium text-theme-primary hover:text-theme-blue transition-colors text-left"
                        >
                            {category.name}
                        </button>
                    </div>
                </td>

                {/* Needed per Month */}
                <td className="px-4 py-2 text-right">
                    <div className="font-medium text-theme-primary">
                        ${categoryData.monthlyNeed.toFixed(2)}
                    </div>
                </td>

                {/* Per Paycheck */}
                <td className="px-4 py-2 text-right">
                    <div className="font-medium text-theme-secondary">
                        ${categoryData.perPaycheckNeed.toFixed(2)}
                    </div>
                </td>

                {/* Available */}
                <td className="px-4 py-2 text-right">
                    <button
                        onClick={() => setShowMoveModal(true)}
                        className={`font-bold hover:opacity-80 transition-opacity text-right ${isOverspent ? 'text-theme-red' : 'text-theme-green'
                            }`}
                        title="Click to move money"
                    >
                        ${(category.available || 0).toFixed(2)}
                    </button>
                </td>

                {/* Due Date */}
                <td className="px-4 py-2 text-center">
                    {categoryData.dueDateInfo ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPayPeriodColor(categoryData.dueDateInfo.urgency)}`}>
                            {categoryData.dueDateInfo.display}
                            {categoryData.dueDateInfo.additionalCount > 0 && (
                                <span className="text-xs opacity-75">
                                    +{categoryData.dueDateInfo.additionalCount}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-theme-tertiary text-xs">—</span>
                    )}
                </td>

                {/* Actions */}
                <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                        {categoryData.type === 'multiple' && (
                            <button
                                onClick={() => {
                                    console.log('Adding item to category:', category.name, 'ID:', category.id);
                                    onAddItem({ preselectedCategory: category });
                                }}
                                className="p-1 text-theme-tertiary hover:text-theme-green transition-colors"
                                title="Add item"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDeleteCategory(category.id)}
                            className="p-1 text-theme-tertiary hover:text-theme-red transition-colors"
                            title="Delete category"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded Content */}
            {isExpanded && (
                <>
                    {categoryData.type === 'single' ? (
                        /* Single Category - Show additional info */
                        <tr className="bg-theme-secondary">
                            <td className="px-4 py-2 min-w-0 w-16"></td>
                            <td colSpan="6" className="px-4 py-2">
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
                                <td colSpan="6" className="px-4 py-1">
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

    const displayInfo = getAmountDisplayInfo(item, payFrequency);
    const urgency = getPayPeriodUrgency(item.dueDate);

    return (
        <tr
            ref={combinedRef}
            className={`${item.isActive ? 'bg-theme-secondary' : 'bg-theme-tertiary'} border-l-4 ${item.isActive ? 'border-theme-green' : 'border-theme-tertiary'
                } ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-theme-quaternary border-theme-blue' : ''
                }`}
        >
            <td className="px-4 py-2 min-w-0 w-16">
                <div className="flex items-center justify-center flex-shrink-0">
                    <GripVertical className="w-3 h-3 text-theme-tertiary cursor-grab" />
                </div>
            </td>
            <td className="px-4 py-2">
                <div className="flex items-center gap-3 ml-8">
                    <div>
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
            <td className="px-4 py-2">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onToggleItemActive(item.id, !item.isActive)}
                        className={`p-1 rounded transition-colors ${item.isActive
                            ? 'text-theme-green hover:text-theme-green'
                            : 'text-theme-tertiary hover:text-theme-secondary'
                            }`}
                        title={item.isActive ? 'Mark as planning only' : 'Mark as active'}
                    >
                        {item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1 text-theme-tertiary hover:text-theme-red transition-colors"
                        title="Delete item"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </td>
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
                        <CurrencyInput
                            value={assignAmount}
                            onChange={(e) => setAssignAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
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
                        <div className="text-sm text-theme-secondary">From: {sourceCategory.name}</div>
                        <div className="text-lg font-bold text-theme-primary">
                            ${maxAmount.toFixed(2)} available
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            Amount to Move
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary">$</span>
                            <input
                                type="number"
                                value={moveAmount}
                                onChange={(e) => setMoveAmount(e.target.value)}
                                className="w-full pl-8 pr-16 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
                                step="0.01"
                                max={maxAmount}
                                min="0"
                            />
                            <button
                                onClick={() => setMoveAmount(maxAmount.toFixed(2))}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-theme-tertiary text-theme-secondary rounded text-xs hover:bg-theme-quaternary"
                            >
                                All
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                            To
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-blue"
                        >
                            <option value="">Select destination...</option>
                            <option value="ready-to-assign">Ready to Assign</option>
                            {categories.map(cat => (
                                cat.id !== sourceCategory.id && (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name} (${(cat.available || 0).toFixed(2)} available)
                                    </option>
                                )
                            ))}
                        </select>
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
                        className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Move Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnifiedEnvelopeBudgetView;