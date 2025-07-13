import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    BanknoteArrowDown,
    Box,
    Calendar,
    CalendarOff,
    ChevronDown,
    ChevronRight,
    DollarSign,
    Edit,
    GripVertical,
    Plus,
    Search,
    Target,
    ToggleLeft,
    ToggleRight,
    Trash2
} from 'lucide-react';
import React, { useMemo, useState, useCallback } from 'react';
import {
    calculateMonthlyAmount,
    calculatePaychecksUntilDue,
    formatAmountWithFrequency
} from '../../utils/budgetDisplayUtils';
import { getGradientStyle } from '../../utils/gradientUtils';
// import { Button } from '../ui/Button';
import QuickAllocateModal from './QuickAllocateModal';
import TransferModal from './TransferModal';

// Sortable Row Component
const SortableRow = ({ row, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.original.id.toString(),
        disabled: !row.original.isParent || row.original.isAddRow,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Only apply sortable to parent category rows
    if (!row.original.isParent || row.original.isAddRow) {
        return (
            <tr
                className={`${row.original.isAddRow
                    ? 'bg-primary/10'
                    : !row.original.isParent && !row.original.isAddRow
                        ? 'bg-base-100'
                        : row.original.isParent && !row.original.isActive
                            ? 'bg-base-200 opacity-60'
                            : ''
                    }`}
            >
                {children}
            </tr>
        );
    }

    // For sortable rows, we need to clone the children and add drag listeners to the first cell
    const childrenArray = Array.isArray(children) ? children : [children];

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`${row.original.isAddRow
                ? 'bg-primary/10'
                : !row.original.isParent && !row.original.isAddRow
                    ? 'bg-base-100'
                    : row.original.isParent && !row.original.isActive
                        ? 'bg-base-200 opacity-60'
                        : ''
                }`}
        >
            {childrenArray.map((child, index) => {
                // Add drag listeners to the first cell (drag handle column)
                if (index === 0 && row.original.isParent && !row.original.isAddRow) {
                    return React.cloneElement(child, {
                        ...child.props,
                        ...listeners,
                        key: child.key || index
                    });
                }
                return child;
            })}
        </tr>
    );
};

const BudgetCategoriesTable = ({
    data = [],
    accounts = [], // Add accounts prop to calculate available to allocate
    getAllUpcomingPaycheckDates, // Add paycheck management function as prop
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onDataUpdate, // New callback to update parent component's data
    onToggleItemActive
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({}); // Track expanded state by category ID
    const [rowSelection, setRowSelection] = useState({});
    const [transferModal, setTransferModal] = useState({ isOpen: false, targetCategory: null });
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });
    const [isDragging, setIsDragging] = useState(false);

    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Get only parent categories for drag & drop (no sub-items)
    const parentCategories = useMemo(() => {
        return data.filter(category => category.isParent !== false);
    }, [data]);

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setIsDragging(false);

        console.log('🎯 DRAG & DROP DEBUG - handleDragEnd called');
        console.log('📋 Active ID:', active?.id);
        console.log('📋 Over ID:', over?.id);
        console.log('📋 Event details:', { active, over });

        if (!over || active.id === over.id) {
            console.log('❌ No drop target or same position - exiting');
            return;
        }

        console.log('🔄 Processing drag & drop reorder...');

        // Clear any existing sorting to allow manual ordering
        console.log('📊 Current sorting before clear:', sorting);
        setSorting([]);
        console.log('✅ Sorting cleared');

        // Find the old and new indices
        console.log('📋 Parent categories:', parentCategories.map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })));

        // Convert IDs to ensure proper comparison (handle both string and number IDs)
        const activeId = active.id.toString();
        const overId = over.id.toString();

        console.log('🔍 Looking for activeId:', activeId, 'overId:', overId);

        const oldIndex = parentCategories.findIndex(cat => cat.id.toString() === activeId);
        const newIndex = parentCategories.findIndex(cat => cat.id.toString() === overId);

        console.log('📍 Old index:', oldIndex);
        console.log('📍 New index:', newIndex);

        if (oldIndex === -1 || newIndex === -1) {
            console.log('❌ Invalid indices - exiting');
            return;
        }

        // Reorder the categories
        console.log('🔄 Before arrayMove:', parentCategories.map(c => c.name));
        const reorderedCategories = arrayMove(parentCategories, oldIndex, newIndex);
        console.log('🔄 After arrayMove:', reorderedCategories.map(c => c.name));

        // Add sortOrder field to maintain the new order
        const reorderedWithSortOrder = reorderedCategories.map((category, index) => ({
            ...category,
            sortOrder: index
        }));
        console.log('📊 Reordered with sortOrder:', reorderedWithSortOrder.map(c => ({ name: c.name, sortOrder: c.sortOrder })));

        // Update the full data array, not just parent categories
        console.log('📋 Original data length:', data.length);
        const updatedData = data.map(category => {
            const reorderedCategory = reorderedWithSortOrder.find(rc => rc.id === category.id);
            if (reorderedCategory) {
                console.log(`🔄 Updating category ${category.name} with sortOrder ${reorderedCategory.sortOrder}`);
            }
            return reorderedCategory || category;
        });
        console.log('📋 Updated data length:', updatedData.length);
        console.log('📊 Updated data sortOrders:', updatedData.map(c => ({ name: c.name, sortOrder: c.sortOrder })));

        // Update the data through the parent component
        console.log('🔄 Calling onDataUpdate with updated data...');
        console.log('🔍 onDataUpdate callback exists?', !!onDataUpdate);
        console.log('🔍 onDataUpdate callback type:', typeof onDataUpdate);

        if (onDataUpdate) {
            console.log('🚀 ABOUT TO CALL onDataUpdate - this should trigger parent logs');
            // Pass a special flag to indicate this is a reorder operation
            onDataUpdate(updatedData, { type: 'reorder', preserveAllFields: true });
            console.log('✅ onDataUpdate called successfully with reorder flag');
        } else {
            console.log('❌ onDataUpdate callback not provided!');
        }

        // Note: The parent component should handle the data update through onDataUpdate callback
        console.log('✅ Drag & drop reorder complete - data sent to parent component');
    };

    const handleDragStart = (event) => {
        console.log('🚀 DRAG START - handleDragStart called');
        console.log('📋 Drag start event:', event);
        console.log('📋 Active item:', event.active);
        setIsDragging(true);
    };

    // Handle transfer button click
    const handleTransferClick = useCallback((category) => {
        setTransferModal({
            isOpen: true,
            targetCategory: category,
            mode: 'transfer-into'
        });
    }, []);

    // Get upcoming paychecks for countdown calculations - memoize to prevent infinite re-renders
    const upcomingPaychecks = useMemo(() => {
        if (typeof getAllUpcomingPaycheckDates === 'function') {
            return getAllUpcomingPaycheckDates(3);
        }
        return [];
    }, [getAllUpcomingPaycheckDates]); // Depend on the passed function

    // Helper functions
    const formatCurrency = useCallback((amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    }, []);

    const formatDueDate = useCallback((dateString) => {
        if (!dateString) return '—';

        // Handle date string properly to avoid timezone issues
        // If it's in YYYY-MM-DD format, parse it as local date
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Handle MM/DD/YYYY format
        if (typeof dateString === 'string' && dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateString.split('/').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // For other date formats, use standard parsing
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    // Calculate earliest due date and count for multi-item categories
    const getCategoryDateInfo = useCallback((category) => {
        if (!category.subItems || category.subItems.length === 0) {
            // Single category - use its own due date
            return {
                earliestDate: category.dueDate,
                additionalCount: 0,
                sortValue: category.dueDate ? new Date(category.dueDate) : new Date('9999-12-31')
            };
        }

        // Multi-item category - find earliest date among sub-items
        const itemsWithDates = category.subItems
            .filter(item => item.dueDate)
            .map(item => ({
                date: item.dueDate,
                dateObj: typeof item.dueDate === 'string' && item.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? (() => {
                        const [year, month, day] = item.dueDate.split('-').map(Number);
                        return new Date(year, month - 1, day);
                    })()
                    : new Date(item.dueDate)
            }))
            .sort((a, b) => a.dateObj - b.dateObj);

        if (itemsWithDates.length === 0) {
            // No items have due dates
            return {
                earliestDate: null,
                additionalCount: 0,
                sortValue: new Date('9999-12-31') // Sort to bottom
            };
        }

        return {
            earliestDate: itemsWithDates[0].date,
            additionalCount: itemsWithDates.length - 1,
            sortValue: itemsWithDates[0].dateObj
        };
    }, []);

    // Format category due date with count badge
    const formatCategoryDueDate = useCallback((category) => {
        const dateInfo = getCategoryDateInfo(category);

        if (!dateInfo.earliestDate) {
            return <CalendarOff className="w-4 h-4 text-base-content/60" />;
        }

        const formattedDate = formatDueDate(dateInfo.earliestDate);

        if (dateInfo.additionalCount > 0) {
            return `${formattedDate} +${dateInfo.additionalCount}`;
        }

        return formattedDate;
    }, [getCategoryDateInfo, formatDueDate]);

    const getDueDateUrgency = useCallback((dateString) => {
        if (!dateString) return 'none';

        let dueDate;
        // Handle date string properly to avoid timezone issues
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            dueDate = new Date(year, month - 1, day); // month is 0-indexed
        } else {
            dueDate = new Date(dateString);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        dueDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 30) return 'soon';
        return 'future';
    }, []);

    const getUrgencyStyles = useCallback((urgency) => {
        switch (urgency) {
            case 'overdue':
                return 'bg-error-lighter/20 text-error border-error';
            case 'urgent':
                return 'bg-warning-lighter/20 text-warning border-warning';
            case 'soon':
                return 'bg-warning-lighter/20 text-warning border-warning';
            case 'future':
                return 'bg-info/10 text-info border-info';
            default:
                return 'bg-base-200 text-base-content/60 border-base-300';
        }
    }, []);

    // Transform data to include sub-items as separate rows
    const flattenedData = useMemo(() => {
        const result = [];

        console.log('🔍 TABLE COMPONENT DATA DEBUG:');
        console.log('📊 Data prop received by table:', data.map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })));
        console.log('📊 Data prop length:', data.length);
        console.log('📊 First category full data:', data[0]);

        // Sort data by sortOrder if no other sorting is applied, otherwise use original order
        const sortedData = sorting.length === 0
            ? [...data].sort((a, b) => {
                // Use sortOrder if available, otherwise fall back to original index
                const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : data.indexOf(a);
                const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : data.indexOf(b);
                console.log(`🔍 SORT COMPARISON: ${a.name} (sortOrder: ${a.sortOrder}, orderA: ${orderA}) vs ${b.name} (sortOrder: ${b.sortOrder}, orderB: ${orderB}) = ${orderA - orderB}`);
                return orderA - orderB;
            })
            : data;

        console.log('🔍 FLATTENED DATA SORT DEBUG:');
        console.log('📊 Original data order:', data.map(c => ({ name: c.name, sortOrder: c.sortOrder })));
        console.log('📊 Sorted data order:', sortedData.map(c => ({ name: c.name, sortOrder: c.sortOrder })));
        console.log('📊 Sorting state:', sorting);

        sortedData.forEach((category, index) => {
            // Add the main category
            result.push({
                ...category,
                uniqueId: `category-${category.id}`,
                originalIndex: index,
                isParent: true,
                depth: 0,
            });

            // Add sub-items and "Add Item" row if category is expanded
            if (expanded[category.id]) {
                // For goal categories, add a progress row first
                if (category.planningType === 'goal' && category.targetAmount) {
                    const currentAmount = category.alreadySaved || 0;
                    const targetAmount = category.targetAmount || 0;
                    const progressPercentage = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

                    // Calculate days until target date
                    let daysUntilTarget = null;
                    if (category.targetDate) {
                        const today = new Date();
                        const targetDate = new Date(category.targetDate);
                        daysUntilTarget = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                    }

                    // Calculate required per-paycheck contribution
                    let calculatedPerPaycheck = category.perPaycheckContribution || 0;

                    // If no manual per-paycheck amount is set, calculate it based on remaining amount and time
                    if (!calculatedPerPaycheck && category.targetDate && daysUntilTarget > 0) {
                        const remainingAmount = targetAmount - currentAmount;
                        if (remainingAmount > 0) {
                            // Calculate number of paychecks until target date using account-specific filtering
                            const paychecksUntilTarget = calculatePaychecksUntilDue(category.targetDate, upcomingPaychecks, category.accountId);
                            if (paychecksUntilTarget > 0) {
                                calculatedPerPaycheck = remainingAmount / paychecksUntilTarget;
                            }
                        }
                    }

                    result.push({
                        id: `goal-progress-${category.id}`,
                        uniqueId: `goal-progress-${category.id}`,
                        name: 'Goal Progress',
                        isGoalProgress: true,
                        originalIndex: index,
                        isParent: false,
                        depth: 1,
                        parentCategory: category,
                        progressPercentage,
                        currentAmount,
                        targetAmount,
                        daysUntilTarget,
                        targetDate: category.targetDate,
                        perPaycheckContribution: calculatedPerPaycheck,
                    });
                }

                // For single expense categories, add an expense details row
                if (category.type === 'single' && category.planningType === 'expense') {
                    // Calculate paycheck countdown if there's a due date using account-specific filtering
                    let paychecksLeft = null;
                    if (category.dueDate) {
                        paychecksLeft = calculatePaychecksUntilDue(category.dueDate, upcomingPaychecks, category.accountId);
                    }

                    result.push({
                        id: `expense-details-${category.id}`,
                        uniqueId: `expense-details-${category.id}`,
                        name: 'Expense Details',
                        isExpenseDetails: true,
                        originalIndex: index,
                        isParent: false,
                        depth: 1,
                        parentCategory: category,
                        paychecksLeft,
                        dueDate: category.dueDate,
                        frequency: category.frequency,
                        amount: category.amount,
                        isRecurring: category.isRecurring,
                    });
                }

                // Add existing sub-items
                if (category.subItems?.length > 0) {
                    category.subItems.forEach((subItem) => {
                        result.push({
                            ...subItem,
                            uniqueId: `item-${subItem.id}`,
                            originalIndex: index,
                            isParent: false,
                            depth: 1,
                            parentCategory: category,
                        });
                    });
                }

            }
        });
        return result;
    }, [data, expanded, upcomingPaychecks, sorting]);

    // Custom header component with sorting
    const SortableHeader = ({ column, children }) => {
        const sorted = column.getIsSorted();
        return (
            <button
                className="flex items-center gap-2 font-medium text-left w-full hover transition-colors"
                onClick={() => column.toggleSorting()}
            >
                {children}
                <div className="flex flex-col">
                    {sorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 text-base-content/60" />
                    )}
                </div>
            </button>
        );
    };

    const columnHelper = createColumnHelper();

    // Table columns definition
    const columns = useMemo(
        () => [
            // Drag handle column (only for parent categories)
            columnHelper.display({
                id: 'dragHandle',
                header: '',
                cell: ({ row }) => {
                    // Only show drag handle for parent categories
                    if (!row.original.isParent || row.original.isAddRow) return null;

                    return (
                        <div className="flex items-center justify-center">
                            <button
                                className={`p-1 hover:bg-base-200 rounded transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
                                title="Drag to reorder"
                            >
                                <GripVertical className="w-4 h-4 text-base-content/60" />
                            </button>
                        </div>
                    );
                },
                size: 32,
                enableSorting: false, // Disable sorting for drag handle column
            }),

            // Row selection checkbox
            columnHelper.display({
                id: 'select',
                header: ({ table }) => {
                    return (
                        <input
                            type="checkbox"
                            className="form-checkbox-rounded this:secondary"
                            checked={table.getIsAllRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                    );
                },
                cell: ({ row }) => {
                    if (row.original.isAddRow) return null;
                    return (
                        <div style={{ marginLeft: row.original.depth * 20 }}>
                            <input
                                type="checkbox"
                                className="form-checkbox-rounded this:secondary"
                                checked={row.getIsSelected()}
                                onChange={row.getToggleSelectedHandler()}
                            />
                        </div>
                    );
                },
                size: 24,
            }),

            // Expand/Collapse button
            columnHelper.display({
                id: 'expander',
                header: '',
                cell: ({ row }) => {
                    if (row.original.isAddRow || !row.original.isParent) return null;

                    // All categories should be expandable
                    const category = row.original;
                    const isExpanded = expanded[category.id];

                    return (
                        <button
                            onClick={() => {
                                setExpanded(prev => ({
                                    ...prev,
                                    [category.id]: !prev[category.id]
                                }));
                            }}
                            className="p-0.5 hover rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-base-content/70" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-base-content/70" />
                            )}
                        </button>
                    );
                },
                size: 10,
            }),

            // Category/Item name
            columnHelper.accessor('name', {
                header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
                cell: ({ row }) => {
                    const item = row.original;

                    if (item.isAddRow) {
                        return (
                            <div style={{ marginLeft: item.depth * 12 + 8 }}>
                                <button
                                    onClick={() => onAddItem && onAddItem({ categoryId: item.parentCategory.id })}
                                    className="flex items-center gap-2 text-sm text-primary hover border-l-2 border-base-300 pl-3"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item to {item.parentCategory.name}
                                </button>
                            </div>
                        );
                    }

                    if (item.isExpenseDetails) {
                        // Expense details row with paycheck countdown and details
                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }} className="border-l-2 border-info pl-4 py-2">
                                <div className="space-y-3">
                                    {/* Expense header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">💸</span>
                                            <span className="font-medium text-info">Expense Details</span>
                                        </div>
                                        {item.paychecksLeft !== null && (
                                            <div className="text-sm font-medium text-info">
                                                {item.paychecksLeft === 0 ? 'Due Now!' :
                                                    item.paychecksLeft > 0 ? `${item.paychecksLeft} paychecks left` : 'Overdue'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expense details grid */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-base-content/60">Amount</div>
                                            <div className="font-medium text-info">
                                                ${(parseFloat(item.amount) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-base-content/60">Frequency</div>
                                            <div className="font-medium text-base-content capitalize">
                                                {(item.frequency || 'monthly').replace('-', ' ')}
                                            </div>
                                        </div>
                                        {item.dueDate && (
                                            <>
                                                <div>
                                                    <div className="text-base-content/60">Due Date</div>
                                                    <div className="font-medium text-warning">
                                                        {formatDueDate(item.dueDate)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-base-content/60">Paychecks Left</div>
                                                    <div className={`font-medium ${item.paychecksLeft === 0 ? 'text-error' :
                                                        item.paychecksLeft === 1 ? 'text-warning' :
                                                            item.paychecksLeft > 1 ? 'text-success' :
                                                                'text-error-dark'
                                                        }`}>
                                                        {item.paychecksLeft === 0 ? 'Due now!' :
                                                            item.paychecksLeft > 0 ? `${item.paychecksLeft} left` : 'Overdue'}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <div className="text-base-content/60">Type</div>
                                            <div className="font-medium text-base-content">
                                                {item.isRecurring ? 'Recurring' : 'One-time'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (item.isParent) {
                        return (
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rotate-45 rounded-sm border border-base-300"
                                        style={getGradientStyle(item.color)}
                                    ></div>
                                    {item.type === 'multiple' && (
                                        <Box className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor">
                                        </Box>
                                    )}
                                    {item.planningType === 'goal' && (
                                        <Target className="w-4 h-4 text-base-content/40" />
                                    )}
                                    <div className="font-medium text-base-content/60">{item.name}</div>
                                </div>

                                {/* Hover actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.type === 'multiple' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddItem && onAddItem({ categoryId: item.id });
                                            }}
                                            className="p-1 hover rounded transition-colors"
                                            title="Add Item"
                                        >
                                            <Plus className="w-4 h-4 text-base-content/60" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditCategory && onEditCategory(item);
                                        }}
                                        className="p-1 hover rounded transition-colors"
                                        title="Edit Category"
                                    >
                                        <Edit className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCategory && onDeleteCategory(item.id);
                                        }}
                                        className="p-1 hover rounded transition-colors"
                                        title="Delete Category"
                                    >
                                        <Trash2 className="w-4 h-4 text-base-content/60" />
                                    </button>
                                </div>
                            </div>
                        );
                    } else {
                        // Sub-item with enhanced display
                        const amountWithFrequency = formatAmountWithFrequency(item.amount, item.frequency);

                        return (
                            <div style={{ marginLeft: item.depth * 12 + 2 }} className="border-l-2 border-base-300 pl-3">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        {/* Active/Inactive Toggle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Ensure itemId is passed as the correct type (number)
                                                const itemId = parseInt(item.id, 10);
                                                // Simple toggle: if currently false, make true; otherwise make false
                                                const newActiveState = item.isActive === false ? true : false;
                                                onToggleItemActive && onToggleItemActive(itemId, newActiveState);
                                            }}
                                            className="w-6 h-4 rounded transition-all duration-200 flex items-center justify-center bg-transparent hover:bg-base-200/50"
                                            title={item.isActive !== false ? 'Active - counting towards budget' : 'Inactive - planning only'}
                                        >
                                            {item.isActive !== false ? (
                                                <ToggleRight className={`w-4 h-4 text-success hover:text-success/80 transition-colors`} />
                                            ) : (
                                                <ToggleLeft className={`w-4 h-4 text-base-content/60 hover:text-base-content/80 transition-colors`} />
                                            )}
                                        </button>

                                        <div>
                                            <div className={`font-medium ${item.isActive !== false ? 'text-base-content' : 'text-base-content/60'}`}>
                                                {item.name}
                                            </div>
                                            <div className={`text-sm ${item.isActive !== false ? 'text-base-content/70' : 'text-base-content/50'}`}>
                                                {amountWithFrequency}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover actions for sub-items */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditItem && onEditItem(item);
                                            }}
                                            className="p-1 hover rounded transition-colors"
                                            title="Edit Item"
                                        >
                                            <Edit className="w-3 h-3 text-base-content/60" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteItem && onDeleteItem(item.id);
                                            }}
                                            className="p-1 hover rounded transition-colors"
                                            title="Delete Item"
                                        >
                                            <Trash2 className="w-3 h-3 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                },
                size: 300,
            }),

            // Monthly need
            columnHelper.accessor('monthlyNeed', {
                header: ({ column }) => <SortableHeader column={column}>Per Month</SortableHeader>,
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const value = getValue();
                    const isSubItem = !row.original.isParent;

                    if (isSubItem && row.original.amount && row.original.frequency) {
                        // For sub-items, calculate and display monthly equivalent
                        const monthlyAmount = calculateMonthlyAmount(row.original.amount, row.original.frequency);
                        return (
                            <div className="text-right">
                                <div className="font-medium text-base-content/60">
                                    {formatCurrency(monthlyAmount)}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-base-content/60' : 'text-base-content'}`}>
                            {formatCurrency(value || 0)}
                        </div>
                    );
                },
                size: 120,
            }),

            // Per paycheck
            columnHelper.accessor('perPaycheck', {
                header: ({ column }) => <SortableHeader column={column}>Per Paycheck</SortableHeader>,
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const value = getValue();
                    const isSubItem = !row.original.isParent;

                    if (isSubItem) {
                        if (row.original.dueDate) {
                            // For sub-items with due dates, show paycheck amount and countdown using account-specific filtering
                            const paychecksLeft = calculatePaychecksUntilDue(row.original.dueDate, upcomingPaychecks, row.original.parentCategory?.accountId);
                            return (
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 font-medium text-info">
                                        <span>{formatCurrency(value || 0)}</span>
                                        {paychecksLeft === 0 ? (
                                            <span className="text-success" title="Due now">
                                                ⚡
                                            </span>
                                        ) : (
                                            <span className="text-info" title={`${paychecksLeft} paychecks until due`}>
                                                🕒
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs">
                                        {paychecksLeft === 0 ? (
                                            <span className="text-success font-medium">due now</span>
                                        ) : paychecksLeft > 0 ? (
                                            <span className="text-info">{paychecksLeft} left</span>
                                        ) : (
                                            <span className="text-error-light">overdue</span>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // For sub-items without due dates, show amount with ongoing indicator
                            return (
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 font-medium text-info">
                                        <span>{formatCurrency(value || 0)}</span>
                                        <span className="text-base-content/60" title="Ongoing expense">
                                            ♾️
                                        </span>
                                    </div>

                                </div>
                            );
                        }
                    }

                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-primary text-primary' : 'text-primary'}`}>
                            {formatCurrency(value || 0)}
                        </div>
                    );
                },
                size: 120,
            }),

            // Allocated
            columnHelper.accessor('allocated', {
                header: ({ column }) => <SortableHeader column={column}>Allocated</SortableHeader>,
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const isSubItem = !row.original.isParent;

                    // Don't show allocated amounts for sub-items - funds are allocated to categories, not individual items
                    if (isSubItem) return (
                        '—'
                    );

                    const value = getValue();
                    return (
                        <div className="text-right font-medium text-success">
                            {formatCurrency(value || 0)}
                        </div>
                    );
                },
                size: 120,
            }),

            // Spent
            columnHelper.accessor('spent', {
                header: ({ column }) => <SortableHeader column={column}>Spent</SortableHeader>,
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const isSubItem = !row.original.isParent;

                    // Don't show spent amounts for sub-items - spending is tracked at category level
                    if (isSubItem) return (
                        '—'
                    );

                    const value = getValue();
                    return (
                        <div className="text-right font-medium text-error">
                            {formatCurrency(value || 0)}
                        </div>
                    );
                },
                size: 120,
            }),

            // Available
            columnHelper.accessor('available', {
                header: ({ column }) => <SortableHeader column={column}>Available</SortableHeader>,
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const isSubItem = !row.original.isParent;

                    // Don't show available amounts for sub-items - only categories have available funds
                    if (isSubItem) return ('—'

                    );

                    const value = getValue();
                    const isOverspent = value < 0;

                    // Only make clickable if there's money to transfer out (value > 0)
                    if (value > 0) {
                        return (
                            <div className="text-right">
                                <button
                                    onClick={() => handleTransferClick(row.original)}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border transition-colors hover:opacity-80 focus:border-primary focus:outline-none bg-success-lighter/20 text-success border-success hover"
                                    title="Click to move money out of this category"
                                >
                                    {formatCurrency(value)}
                                </button>
                            </div>
                        );
                    } else {
                        // Non-clickable display for $0 or negative amounts
                        return (
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${isOverspent
                                    ? 'bg-error/20 text-error border border-error'
                                    : 'bg-base-200 text-base-content/60 border border-base-300'
                                    }`}>
                                    {isOverspent && <span className="mr-1">⚠️</span>}
                                    {formatCurrency(value || 0)}
                                </span>
                            </div>
                        );
                    }
                },
                size: 120,
            }),


            // Due date
            columnHelper.accessor('dueDate', {
                header: ({ column }) => (
                    <SortableHeader column={column}>
                        <Calendar className="w-4 h-4" />
                        Due Date
                    </SortableHeader>
                ),
                cell: ({ getValue, row }) => {
                    if (row.original.isAddRow) return null;
                    const item = row.original;
                    const isSubItem = !item.isParent;

                    if (isSubItem) {
                        // Sub-item: show its own due date
                        const dueDate = getValue();
                        if (!dueDate) return (
                            <div className="text-center">
                                <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                            </div>
                        );

                        const urgency = getDueDateUrgency(dueDate);
                        return (
                            <div className="text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyStyles(urgency)}`}>
                                    {formatDueDate(dueDate)}
                                </span>
                            </div>
                        );
                    } else {
                        // Parent category: show earliest date with count badge
                        const categoryDateText = formatCategoryDueDate(item);
                        const dateInfo = getCategoryDateInfo(item);

                        if (!dateInfo.earliestDate) {
                            return (
                                <div className="text-center">
                                    <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                                </div>
                            );
                        }

                        const urgency = getDueDateUrgency(dateInfo.earliestDate);
                        const parts = categoryDateText.split(' +');
                        const mainDate = parts[0];
                        const countBadge = parts[1];

                        return (
                            <div className="text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyStyles(urgency)}`}>
                                    {mainDate}
                                    {countBadge && (
                                        <span className="ml-1 text-xs opacity-75">
                                            +{countBadge}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    }
                },
                sortingFn: (rowA, rowB) => {
                    const itemA = rowA.original;
                    const itemB = rowB.original;

                    // Get sort values
                    const dateA = itemA.isParent ? getCategoryDateInfo(itemA).sortValue : (itemA.dueDate ? new Date(itemA.dueDate) : new Date('9999-12-31'));
                    const dateB = itemB.isParent ? getCategoryDateInfo(itemB).sortValue : (itemB.dueDate ? new Date(itemB.dueDate) : new Date('9999-12-31'));

                    return dateA.getTime() - dateB.getTime();
                },
                size: 140,
            }),

        ],
        [
            columnHelper,
            expanded,
            formatCategoryDueDate,
            getCategoryDateInfo,
            getDueDateUrgency,
            getUrgencyStyles,
            formatDueDate,
            formatCurrency,
            onAddItem,
            onDeleteCategory,
            onDeleteItem,
            onEditCategory,
            onEditItem,
            onToggleItemActive,
            upcomingPaychecks,
            handleTransferClick,
            isDragging
        ]
    );

    const table = useReactTable({
        data: flattenedData,
        columns,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: (row) => !row.original.isAddRow,
        getRowId: (row) => row.uniqueId || row.id.toString(),
    });

    const selectedRowCount = Object.keys(rowSelection).length;

    // Bulk actions handler
    const handleBulkDelete = () => {
        const selectedRowIds = Object.keys(rowSelection);

        selectedRowIds.forEach(rowId => {
            // Find the actual row data from the flattened data
            const rowData = flattenedData.find(row => row.uniqueId === rowId);

            if (rowData) {
                if (rowData.isParent) {
                    // It's a category
                    onDeleteCategory && onDeleteCategory(rowData.id);
                } else if (!rowData.isAddRow) {
                    // It's a sub-item
                    onDeleteItem && onDeleteItem(rowData.id);
                }
            }
        });

        setRowSelection({});
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-base-200 rounded-lg border border-base-300">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
                            <DollarSign className="w-7 h-7 text-success" />
                            Budget Categories
                        </h2>
                        <p className="text-base-content/60">Manage your envelope budgeting categories and items</p>
                    </div>
                    <button
                        onClick={() => onAddCategory && onAddCategory()}
                        className="flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-lg hover transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>

                {/* Search and bulk actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-base-300 bg-base-100 text-base-content rounded-lg focus:border-primary placeholder:text-base-content/60"
                        />
                    </div>

                    {selectedRowCount > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-base-content/60">
                                {selectedRowCount} selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-error text-white rounded-lg hover transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Available to Allocate Section */}
            {(() => {
                // Calculate available to allocate the same way SimplifiedSummaryCards does
                const totalWorkingBalance = (accounts || []).reduce((sum, account) => {
                    const accountTransactions = []; // Empty for now - will be populated when transaction management is implemented
                    const startingBalance = account.startingBalance || account.balance || 0;
                    const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    return sum + workingBalance;
                }, 0);

                const totalAllocated = data.reduce((sum, category) => sum + (category.allocated || 0), 0);
                const availableToAllocate = totalWorkingBalance - totalAllocated;

                // Debug logging
                console.log('🔍 Quick Allocate Debug:');
                console.log('📊 Accounts:', accounts);
                console.log('💰 Total Working Balance:', totalWorkingBalance);
                console.log('📋 Categories data:', data);
                console.log('💸 Total Allocated:', totalAllocated);
                console.log('✨ Available to Allocate:', availableToAllocate);
                console.log('👀 Should show Quick Allocate?', availableToAllocate > 0);

                if (availableToAllocate > 0) {
                    return (
                        <div className="mb-4 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg border border-base-300 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BanknoteArrowDown className="w-14 h-14 rounded-full flex items-center justify-center text-primary" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-success-dark">
                                                Available to Allocate
                                            </h3>
                                            <p className="text-sm text-success">
                                                Choose how to allocate your money
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-success-dark">
                                            {formatCurrency(availableToAllocate)}
                                        </div>
                                        <div className="text-sm text-success">
                                            Ready to allocate
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={() => setQuickAllocateModal({ isOpen: true })}
                                        className="btn btn-primary btn-outline flex items-center gap-2 hover:scale-105 transition-all duration-200"
                                    >
                                        <span>⚡</span>
                                        Quick Allocate
                                    </button>
                                    <button
                                        onClick={() => setTransferModal({
                                            isOpen: true,
                                            targetCategory: {
                                                id: 'to-be-allocated',
                                                name: 'Available to Allocate',
                                                available: availableToAllocate
                                            },
                                            mode: 'allocate-from'
                                        })}
                                        className="btn btn-primary flex items-center gap-2 hover:scale-105 transition-all duration-200"
                                    >
                                        <span>🎯</span>
                                        Single Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Table */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-base-300 border-b border-base-300">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                className="px-4 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider"
                                                style={{ width: header.getSize() }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())
                                                }
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <SortableContext
                                items={parentCategories.map(cat => cat.id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="bg-base-100">
                                    {table.getRowModel().rows.map(row => {
                                        const isGoalProgress = row.original.isGoalProgress;
                                        const isExpenseDetails = row.original.isExpenseDetails;

                                        // Special handling for goal progress and expense details rows
                                        if (isGoalProgress) {
                                            const item = row.original;
                                            const progressColor = item.progressPercentage >= 100 ? 'success' :
                                                item.progressPercentage >= 75 ? 'primary' :
                                                    item.progressPercentage >= 50 ? 'warning' : 'neutral';

                                            return (
                                                <tr key={row.id} className="bg-success-lighter/20">
                                                    <td colSpan={columns.length} className="px-4 py-2">
                                                        <div className="bg-success-lighter/20 rounded p-3 border border-success-light">
                                                            <div className="space-y-2">
                                                                {/* Progress header */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🎯</span>
                                                                        <span className="text-sm font-semibold text-success-dark">Goal Progress</span>
                                                                    </div>
                                                                    <div className="text-sm font-bold text-success-dark">
                                                                        {item.progressPercentage.toFixed(1)}%
                                                                    </div>
                                                                </div>

                                                                {/* Progress bar */}
                                                                <div className="w-full bg-base-300 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full transition-all duration-300 ${progressColor === 'success' ? 'bg-success' :
                                                                            progressColor === 'primary' ? 'bg-info/50' :
                                                                                progressColor === 'warning' ? 'bg-warning' :
                                                                                    'bg-base-300'
                                                                            }`}
                                                                        style={{ width: `${Math.min(100, item.progressPercentage)}%` }}
                                                                    />
                                                                </div>

                                                                {/* Goal details grid */}
                                                                <div className="grid grid-cols-4 gap-4 text-xs">
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Saved</div>
                                                                        <div className="font-bold text-success">
                                                                            ${(parseFloat(item.currentAmount) || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Target</div>
                                                                        <div className="font-bold text-base-content">
                                                                            ${(parseFloat(item.targetAmount) || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Per Paycheck</div>
                                                                        <div className="font-bold text-info">
                                                                            ${(parseFloat(item.perPaycheckContribution) || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">
                                                                            {item.daysUntilTarget !== null ? (
                                                                                item.daysUntilTarget > 0 ? 'Days Left' :
                                                                                    item.daysUntilTarget === 0 ? 'Due Today' : 'Overdue'
                                                                            ) : 'Target Date'}
                                                                        </div>
                                                                        <div className={`font-bold ${item.daysUntilTarget !== null ? (
                                                                            item.daysUntilTarget > 30 ? 'text-base-content/60' :
                                                                                item.daysUntilTarget > 7 ? 'text-warning' :
                                                                                    item.daysUntilTarget >= 0 ? 'text-error' :
                                                                                        'text-error-dark'
                                                                        ) : 'text-base-content/60'
                                                                            }`}>
                                                                            {item.daysUntilTarget !== null ? (
                                                                                item.daysUntilTarget > 0 ? `${item.daysUntilTarget} days` :
                                                                                    item.daysUntilTarget === 0 ? 'Today!' :
                                                                                        `${Math.abs(item.daysUntilTarget)} days ago`
                                                                            ) : (
                                                                                item.targetDate ? new Date(item.targetDate).toLocaleDateString() : 'Not set'
                                                                            )}
                                                                        </div>
                                                                        {item.targetDate && (
                                                                            <div className="text-xs text-base-content/60 mt-1">
                                                                                ({new Date(item.targetDate).toLocaleDateString()})
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Remaining amount - inline */}
                                                                {item.progressPercentage < 100 && (
                                                                    <div className="text-center text-xs pt-1 border-t border-success-light">
                                                                        <span className="text-base-content/60">Still need: </span>
                                                                        <span className="font-bold text-warning">
                                                                            ${(item.targetAmount - item.currentAmount).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        if (isExpenseDetails) {
                                            const item = row.original;
                                            return (
                                                <tr key={row.id} className="bg-info/10">
                                                    <td colSpan={columns.length} className="px-4 py-2">
                                                        <div className="bg-info/10 rounded p-3 border border-info">
                                                            <div className="space-y-2">
                                                                {/* Expense header */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">💸</span>
                                                                        <span className="text-sm font-semibold text-info">Expense Details</span>
                                                                    </div>
                                                                    {item.paychecksLeft !== null && (
                                                                        <div className="text-sm font-bold text-info">
                                                                            {item.paychecksLeft === 0 ? 'Due Now!' :
                                                                                item.paychecksLeft > 0 ? `${item.paychecksLeft} paychecks left` : 'Overdue'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Expense details grid */}
                                                                <div className="grid grid-cols-3 gap-4 text-xs">
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Amount</div>
                                                                        <div className="font-bold text-info">
                                                                            ${(parseFloat(item.amount) || 0).toFixed(2)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Frequency</div>
                                                                        <div className="font-bold text-base-content capitalize">
                                                                            {(item.frequency || 'monthly').replace('-', ' ')}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-base-content/60">Type</div>
                                                                        <div className="font-bold text-base-content">
                                                                            {item.isRecurring ? 'Recurring' : 'One-time'}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Due date info - inline */}
                                                                {item.dueDate && (
                                                                    <div className="text-center text-xs pt-1 border-t border-info">
                                                                        <div className="text-base-content/60">Due Date</div>
                                                                        <div className="font-bold text-warning">
                                                                            {formatDueDate(item.dueDate)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <SortableRow
                                                key={row.id}
                                                row={row}
                                                isDragging={isDragging}
                                            >
                                                {row.getVisibleCells().map(cell => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-4 py-2 whitespace-nowrap border-b border-base-300"
                                                        style={{ width: cell.column.getSize() }}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </SortableRow>
                                        );
                                    })}
                                </tbody>
                            </SortableContext>
                        </table>
                    </div>

                    {/* Summary footer */}
                    <div className="bg-base-300 border-t border-base-300 px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-base-content/60">
                                {data.length} categories • {data.reduce((sum, cat) => sum + (cat.subItems?.length || 0), 0)} total items
                            </div>
                            <div className="flex items-center gap-6 text-right">
                                <div>
                                    <span className="text-base-content/60">Total Monthly Need: </span>
                                    <span className="font-medium text-base-content">
                                        {formatCurrency(data.reduce((sum, cat) => sum + cat.monthlyNeed, 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-base-content/60">Total Allocated: </span>
                                    <span className="font-medium text-success">
                                        {formatCurrency(data.reduce((sum, cat) => sum + cat.allocated, 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-base-content/60">Total Available: </span>
                                    <span className="font-medium text-info">
                                        {formatCurrency(data.reduce((sum, cat) => sum + cat.available, 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transfer Modal */}
                <TransferModal
                    isOpen={transferModal.isOpen}
                    onClose={() => setTransferModal({ isOpen: false, targetCategory: null })}
                    targetCategory={transferModal.targetCategory}
                    categories={data}
                    activeBudgetAllocations={[]} // This would come from props
                    onTransferComplete={(transferData) => {
                        console.log('🎯 BudgetCategoriesTable: Transfer completed callback received');
                        console.log('📊 Transfer data received:', transferData);
                        console.log('📋 Current categories data before update:', data);

                        // Handle the transfer completion here
                        if (transferData.type === 'allocation') {
                            // Allocation from "to be allocated" to a category
                            console.log('💰 Processing allocation from unallocated funds');
                            console.log(`📤 Adding $${transferData.amount} to category ${transferData.toCategory}`);

                            // Find and update the target category
                            const updatedData = data.map(category => {
                                if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    const newAllocated = (category.allocated || 0) + transferData.amount;
                                    console.log(`✅ Category ${category.name}: available ${category.available} → ${newAvailable}, allocated ${category.allocated} → ${newAllocated}`);
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            console.log('📋 Updated categories data:', updatedData);

                            // Notify parent component to update its data and re-render
                            if (onDataUpdate) {
                                console.log('🔄 Calling onDataUpdate to trigger parent re-render');
                                onDataUpdate(updatedData);
                            } else {
                                console.log('⚠️ NOTE: onDataUpdate callback not provided - parent component will not re-render');
                            }

                        } else if (transferData.type === 'deallocate') {
                            // Transfer from category back to "to be allocated"
                            console.log('💸 Processing deallocation back to unallocated funds');
                            console.log(`📤 Removing $${transferData.amount} from category ${transferData.fromCategory}`);

                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    const newAllocated = (category.allocated || 0) - transferData.amount;
                                    console.log(`📉 Category ${category.name}: available ${category.available} → ${newAvailable}, allocated ${category.allocated} → ${newAllocated}`);
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            console.log('📋 Updated categories data:', updatedData);

                            // Notify parent component to update its data and re-render
                            if (onDataUpdate) {
                                console.log('🔄 Calling onDataUpdate to trigger parent re-render');
                                onDataUpdate(updatedData);
                            } else {
                                console.log('⚠️ NOTE: onDataUpdate callback not provided - parent component will not re-render');
                            }

                        } else if (transferData.type === 'transfer') {
                            // Category-to-category transfer
                            console.log('🔄 Processing category-to-category transfer');
                            console.log(`📤 Moving $${transferData.amount} from category ${transferData.fromCategory} to category ${transferData.toCategory}`);

                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    console.log(`📉 Source category ${category.name}: available ${category.available} → ${newAvailable}`);
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                } else if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    console.log(`📈 Target category ${category.name}: available ${category.available} → ${newAvailable}`);
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                }
                                return category;
                            });

                            console.log('📋 Updated categories data:', updatedData);

                            // Notify parent component to update its data and re-render
                            if (onDataUpdate) {
                                console.log('🔄 Calling onDataUpdate to trigger parent re-render');
                                onDataUpdate(updatedData);
                            } else {
                                console.log('⚠️ NOTE: onDataUpdate callback not provided - parent component will not re-render');
                            }
                        }

                        setTransferModal({ isOpen: false, targetCategory: null });
                    }}
                />

                {/* Quick Allocate Modal */}
                <QuickAllocateModal
                    isOpen={quickAllocateModal.isOpen}
                    onClose={() => setQuickAllocateModal({ isOpen: false })}
                    availableToAllocate={(() => {
                        const totalWorkingBalance = (accounts || []).reduce((sum, account) => {
                            const accountTransactions = [];
                            const startingBalance = account.startingBalance || account.balance || 0;
                            const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                            return sum + workingBalance;
                        }, 0);
                        const totalAllocated = data.reduce((sum, category) => sum + (category.allocated || 0), 0);
                        return totalWorkingBalance - totalAllocated;
                    })()}
                    categories={data}
                    accounts={accounts}
                    onBulkAllocate={(allocations) => {
                        console.log('🚀 BudgetCategoriesTable: Bulk allocation received');
                        console.log('📊 Allocations:', allocations);

                        // Apply all allocations to the categories
                        const updatedData = data.map(category => {
                            const allocation = allocations.find(a => a.categoryId === category.id);
                            if (allocation) {
                                const newAvailable = (category.available || 0) + allocation.amount;
                                const newAllocated = (category.allocated || 0) + allocation.amount;
                                console.log(`✅ Category ${category.name}: available ${category.available} → ${newAvailable}, allocated ${category.allocated} → ${newAllocated}`);
                                return {
                                    ...category,
                                    available: newAvailable,
                                    allocated: newAllocated
                                };
                            }
                            return category;
                        });

                        console.log('📋 Updated categories data:', updatedData);

                        // Notify parent component to update its data and re-render
                        if (onDataUpdate) {
                            console.log('🔄 Calling onDataUpdate to trigger parent re-render');
                            onDataUpdate(updatedData);
                        } else {
                            console.log('⚠️ NOTE: onDataUpdate callback not provided - parent component will not re-render');
                        }

                        setQuickAllocateModal({ isOpen: false });
                    }}
                />
            </DndContext>
        </div>
    );
};

export default BudgetCategoriesTable;
