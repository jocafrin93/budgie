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
    useDroppable,
} from '@dnd-kit/core';
import {
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
    Trash2,
    FolderOpen,
    Folder,
    Settings
} from 'lucide-react';
import React, { useMemo, useState, useCallback } from 'react';
import {
    calculateMonthlyAmount,
    calculatePaychecksUntilDue,
    formatAmountWithFrequency
} from '../../utils/budgetDisplayUtils';
import { getGradientStyle } from '../../utils/gradientUtils';
import { getDaysBetweenOccurrences } from '../../utils/frequencyUtils';
import QuickAllocateModal from './QuickAllocateModal';
import TransferModal from './TransferModal';

// Droppable Group Row Component
const DroppableGroupRow = ({ row, children, dragOverGroupId }) => {
    const {
        setNodeRef: setDroppableRef,
        isOver,
    } = useDroppable({
        id: `group-${row.original.groupId}`,
    });

    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.original.id.toString(),
        disabled: false, // Groups can be dragged for reordering
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Combine refs for both droppable and sortable functionality
    const setNodeRef = (node) => {
        setDroppableRef(node);
        setSortableRef(node);
    };

    // Determine if this group is being dragged over
    const isGroupDragTarget = isOver || (row.original.isGroup && dragOverGroupId === row.original.groupId);

    // Base row classes with enhanced drop target styling
    const baseClasses = `bg-base-200 border-t-2 border-base-300 transition-all duration-200 ${isGroupDragTarget ? 'ring-2 ring-primary bg-primary/10 border-primary' : ''
        }`;

    const childrenArray = Array.isArray(children) ? children : [children];

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={baseClasses}
        >
            {childrenArray.map((child, index) => {
                // Add drag listeners to the name column (index 3) for group reordering
                if (index === 3) {
                    return React.cloneElement(child, {
                        ...child.props,
                        ...listeners,
                        key: child.key || index,
                        style: {
                            ...child.props.style,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }
                    });
                }
                return child;
            })}
        </tr>
    );
};

// Sortable Category Row Component
const SortableCategoryRow = ({ row, children }) => {
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

    // Base row classes
    const baseClasses = `${row.original.isAddRow
        ? 'bg-primary/10'
        : !row.original.isParent && !row.original.isAddRow
            ? 'bg-base-100'
            : row.original.isParent && !row.original.isActive
                ? 'bg-base-200 opacity-60'
                : ''
        }`;

    // Non-sortable rows (add rows, sub-items, special rows)
    if (!row.original.isParent || row.original.isAddRow) {
        return (
            <tr className={baseClasses}>
                {children}
            </tr>
        );
    }

    const childrenArray = Array.isArray(children) ? children : [children];

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={baseClasses}
        >
            {childrenArray.map((child, index) => {
                // Add drag listeners to the first cell (drag handle column) for categories
                if (index === 0) {
                    return React.cloneElement(child, {
                        ...child.props,
                        ...listeners,
                        key: child.key || index,
                        style: {
                            ...child.props.style,
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }
                    });
                }
                return child;
            })}
        </tr>
    );
};

// Combined Row Component
const SortableRow = ({ row, children, dragOverGroupId }) => {
    if (row.original.isGroup) {
        return (
            <DroppableGroupRow row={row} dragOverGroupId={dragOverGroupId}>
                {children}
            </DroppableGroupRow>
        );
    } else {
        return (
            <SortableCategoryRow row={row}>
                {children}
            </SortableCategoryRow>
        );
    }
};

const GroupedBudgetCategoriesTable = ({
    data = [],
    accounts = [],
    getAllUpcomingPaycheckDates,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onDataUpdate,
    onToggleItemActive,
    // Group management props
    groups = [],
    onAddGroup,
    onEditGroup,
    onDeleteGroup,
    onToggleGroupCollapsed,
    onReorderCategoriesInGroup,
    onReorderGroups,
    onMoveCategoryToGroup,
    getCategoriesByGroup
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({}); // Track expanded state by category ID
    const [rowSelection, setRowSelection] = useState({});
    const [transferModal, setTransferModal] = useState({ isOpen: false, targetCategory: null });
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverGroupId, setDragOverGroupId] = useState(null);

    // Drag & Drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Get upcoming paychecks for countdown calculations - memoize to prevent infinite re-renders
    const upcomingPaychecks = useMemo(() => {
        if (typeof getAllUpcomingPaycheckDates === 'function') {
            return getAllUpcomingPaycheckDates(3);
        }
        return [];
    }, [getAllUpcomingPaycheckDates]);

    // Helper functions
    const formatCurrency = useCallback((amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    }, []);

    const getNextOccurrence = useCallback((originalDate, frequency) => {
        if (!originalDate || !frequency || frequency === 'once') {
            return originalDate;
        }

        const today = new Date();
        let currentDate = new Date(originalDate);

        while (currentDate < today) {
            const daysBetween = getDaysBetweenOccurrences(frequency);
            currentDate.setDate(currentDate.getDate() + daysBetween);
        }

        return currentDate.toISOString().split('T')[0];
    }, []);

    const formatDueDate = useCallback((dateString) => {
        if (!dateString) return '—';

        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (typeof dateString === 'string' && dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [month, day, year] = dateString.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }, []);

    const getCategoryDateInfo = useCallback((category) => {
        if (!category.subItems || category.subItems.length === 0) {
            if (category.dueDate) {
                const nextOccurrence = getNextOccurrence(category.dueDate, category.frequency);
                return {
                    earliestDate: nextOccurrence,
                    additionalCount: 0,
                    sortValue: new Date(nextOccurrence)
                };
            }
            return {
                earliestDate: null,
                additionalCount: 0,
                sortValue: new Date('9999-12-31')
            };
        }

        const itemsWithDates = category.subItems
            .filter(item => item.dueDate)
            .map(item => {
                const nextOccurrence = getNextOccurrence(item.dueDate, item.frequency);
                return {
                    date: nextOccurrence,
                    dateObj: new Date(nextOccurrence)
                };
            })
            .sort((a, b) => a.dateObj - b.dateObj);

        if (itemsWithDates.length === 0) {
            return {
                earliestDate: null,
                additionalCount: 0,
                sortValue: new Date('9999-12-31')
            };
        }

        return {
            earliestDate: itemsWithDates[0].date,
            additionalCount: itemsWithDates.length - 1,
            sortValue: itemsWithDates[0].dateObj
        };
    }, [getNextOccurrence]);

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
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            dueDate = new Date(year, month - 1, day);
        } else {
            dueDate = new Date(dateString);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 30) return 'soon';
        return 'future';
    }, []);

    const getUrgencyStyles = useCallback((urgency) => {
        switch (urgency) {
            case 'overdue':
                return 'bg-error/20 text-error border-error';
            case 'urgent':
                return 'bg-warning/20 text-warning border-warning';
            case 'soon':
                return 'bg-warning/20 text-warning border-warning';
            case 'future':
                return 'bg-info/10 text-info border-info';
            default:
                return 'bg-base-200 text-base-content/60 border-base-300';
        }
    }, []);

    // Handle transfer button click
    const handleTransferClick = useCallback((category) => {
        setTransferModal({
            isOpen: true,
            targetCategory: category,
            mode: 'transfer-into'
        });
    }, []);

    // Enhanced drag and drop handlers
    const handleDragStart = (event) => {
        setIsDragging(true);
        console.log('🎯 Drag started:', event.active.id);
    };

    const handleDragOver = (event) => {
        const { over } = event;

        if (!over) {
            setDragOverGroupId(null);
            return;
        }

        const overId = over.id.toString();

        // Check if dragging over a group
        if (overId.startsWith('group-')) {
            const groupId = overId.replace('group-', '');
            setDragOverGroupId(groupId);
        } else {
            setDragOverGroupId(null);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setIsDragging(false);
        setDragOverGroupId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const activeId = active.id.toString();
        const overId = over.id.toString();

        // Handle group reordering
        if (activeId.startsWith('group-') && overId.startsWith('group-')) {
            const activeGroupId = activeId.replace('group-', '');
            const overGroupId = overId.replace('group-', '');

            if (onReorderGroups) {
                onReorderGroups(activeGroupId, overGroupId);
            }
            return;
        }

        // Handle category to group movement
        if (overId.startsWith('group-')) {
            const targetGroupId = overId.replace('group-', '');
            const categoryId = parseInt(activeId, 10);

            if (onMoveCategoryToGroup) {
                onMoveCategoryToGroup(categoryId, targetGroupId);
            }
            return;
        }

        // Handle category reordering within same group
        const activeCategory = data.find(cat => cat.id.toString() === activeId);
        const overCategory = data.find(cat => cat.id.toString() === overId);

        if (activeCategory && overCategory && activeCategory.groupId === overCategory.groupId) {
            if (onReorderCategoriesInGroup) {
                onReorderCategoriesInGroup(activeCategory.groupId, activeId, overId);
            }
        }
    };

    // Transform data to include groups and flattened categories with expanded content
    const flattenedData = useMemo(() => {
        const result = [];

        // Ensure groups is an array and sort by their order
        const groupsArray = Array.isArray(groups) ? groups : [];
        const sortedGroups = [...groupsArray].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedGroups.forEach((group) => {
            // Add group header row
            result.push({
                id: `group-${group.id}`,
                uniqueId: `group-${group.id}`,
                name: group.name,
                isGroup: true,
                isParent: false,
                depth: 0,
                groupId: group.id,
                isCollapsed: group.isCollapsed,
                categoryCount: (getCategoriesByGroup ? getCategoriesByGroup(group.id) : []).length
            });

            // Add categories in this group if not collapsed
            if (!group.isCollapsed) {
                const categoriesInGroup = getCategoriesByGroup ? getCategoriesByGroup(group.id) : [];
                const categoriesArray = Array.isArray(categoriesInGroup) ? categoriesInGroup : [];

                categoriesArray.forEach((category) => {
                    // Add the main category
                    result.push({
                        ...category,
                        uniqueId: `category-${category.id}`,
                        isParent: true,
                        depth: 1,
                        groupId: group.id
                    });

                    // Add expanded content if category is expanded
                    if (expanded[category.id]) {
                        // For goal categories, add a progress row first
                        if (category.planningType === 'goal' && category.targetAmount) {
                            const currentAmount = category.alreadySaved || 0;
                            const targetAmount = category.targetAmount || 0;
                            const progressPercentage = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

                            let daysUntilTarget = null;
                            if (category.targetDate) {
                                const today = new Date();
                                const targetDate = new Date(category.targetDate);
                                daysUntilTarget = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                            }

                            let calculatedPerPaycheck = category.perPaycheckContribution || 0;

                            if (!calculatedPerPaycheck && category.targetDate && daysUntilTarget > 0) {
                                const remainingAmount = targetAmount - currentAmount;
                                if (remainingAmount > 0) {
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
                                isParent: false,
                                depth: 2,
                                parentCategory: category,
                                groupId: group.id,
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
                            let paychecksLeft = null;
                            if (category.dueDate) {
                                paychecksLeft = calculatePaychecksUntilDue(category.dueDate, upcomingPaychecks, category.accountId);
                            }

                            result.push({
                                id: `expense-details-${category.id}`,
                                uniqueId: `expense-details-${category.id}`,
                                name: 'Expense Details',
                                isExpenseDetails: true,
                                isParent: false,
                                depth: 2,
                                parentCategory: category,
                                groupId: group.id,
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
                                    isParent: false,
                                    depth: 2,
                                    parentCategory: category,
                                    groupId: group.id
                                });
                            });
                        }
                    }
                });
            }
        });

        return result;
    }, [groups, getCategoriesByGroup, expanded, upcomingPaychecks]);

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
            // Drag handle column
            columnHelper.display({
                id: 'dragHandle',
                header: '',
                cell: ({ row }) => {
                    if (row.original.isGroup) {
                        return (
                            <div className="flex items-center justify-center">
                                <button
                                    className={`p-1 hover:bg-base-200 rounded transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
                                    title="Drag to reorder group"
                                >
                                    <GripVertical className="w-4 h-4 text-base-content/60" />
                                </button>
                            </div>
                        );
                    }

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
                enableSorting: false,
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
                    if (row.original.isAddRow || row.original.isGroup) return null;
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
                    if (row.original.isGroup) {
                        const group = row.original;
                        const isCollapsed = group.isCollapsed;

                        return (
                            <button
                                onClick={() => onToggleGroupCollapsed && onToggleGroupCollapsed(group.groupId)}
                                className="p-0.5 hover rounded transition-colors"
                            >
                                {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-base-content/70" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-base-content/70" />
                                )}
                            </button>
                        );
                    }

                    if (row.original.isAddRow || !row.original.isParent) return null;

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

                    if (item.isGroup) {
                        return (
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    {item.isCollapsed ? (
                                        <Folder className="w-5 h-5 text-primary" />
                                    ) : (
                                        <FolderOpen className="w-5 h-5 text-primary" />
                                    )}
                                    <div className="font-semibold text-primary text-lg">{item.name}</div>
                                    <div className="text-sm text-base-content/60">
                                        ({item.categoryCount} categories)
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddCategory && onAddCategory({ groupId: item.groupId });
                                        }}
                                        className="p-1 hover rounded transition-colors"
                                        title="Add Category to Group"
                                    >
                                        <Plus className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditGroup && onEditGroup(item.groupId);
                                        }}
                                        className="p-1 hover rounded transition-colors"
                                        title="Edit Group"
                                    >
                                        <Settings className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteGroup && onDeleteGroup(item.groupId);
                                        }}
                                        className="p-1 hover rounded transition-colors"
                                        title="Delete Group"
                                    >
                                        <Trash2 className="w-4 h-4 text-base-content/60" />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    if (item.isExpenseDetails) {
                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }} className="border-l-2 border-info pl-4 py-2">
                                <div className="space-y-3">
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
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const itemId = parseInt(item.id, 10);
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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const value = getValue();
                    const isSubItem = !row.original.isParent;

                    if (isSubItem && row.original.amount && row.original.frequency) {
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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const value = getValue();
                    const isSubItem = !row.original.isParent;

                    if (isSubItem) {
                        if (row.original.dueDate) {
                            const accountIdToUse = row.original.accountId || row.original.parentCategory?.accountId;
                            const paychecksLeft = calculatePaychecksUntilDue(row.original.dueDate, upcomingPaychecks, accountIdToUse);
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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const isSubItem = !row.original.isParent;

                    if (isSubItem) return '—';

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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const isSubItem = !row.original.isParent;

                    if (isSubItem) return '—';

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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const isSubItem = !row.original.isParent;

                    if (isSubItem) return '—';

                    const value = getValue();
                    const isOverspent = value < 0;

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
                    if (row.original.isAddRow || row.original.isGroup) return null;
                    const item = row.original;
                    const isSubItem = !item.isParent;

                    if (isSubItem) {
                        const originalDueDate = getValue();
                        if (!originalDueDate) return (
                            <div className="text-center">
                                <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                            </div>
                        );

                        const nextDueDate = getNextOccurrence(originalDueDate, item.frequency);
                        const urgency = getDueDateUrgency(nextDueDate);

                        return (
                            <div className="text-center">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyStyles(urgency)}`}>
                                    {formatDueDate(nextDueDate)}
                                    {item.frequency && item.frequency !== 'once' && (
                                        <span className="ml-1 text-xs opacity-75" title="Recurring item">
                                            🔄
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    } else {
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

                    const dateA = itemA.isParent ? getCategoryDateInfo(itemA).sortValue : (itemA.dueDate ? new Date(itemA.dueDate) : new Date('9999-12-31'));
                    const dateB = itemB.isParent ? getCategoryDateInfo(itemB).sortValue : (itemB.dueDate ? new Date(itemB.dueDate) : new Date('9999-12-31'));

                    return dateA.getTime() - dateB.getTime();
                },
                size: 140,
            }),

        ],
        [
            columnHelper,
            formatCurrency,
            getUrgencyStyles,
            formatDueDate,
            getDueDateUrgency,
            getNextOccurrence,
            handleTransferClick,
            isDragging,
            onAddCategory,
            onEditGroup,
            onDeleteGroup,
            onAddItem,
            onEditCategory,
            onDeleteCategory,
            onToggleGroupCollapsed,
            expanded,
            onToggleItemActive,
            formatCategoryDueDate,
            getCategoryDateInfo,
            upcomingPaychecks
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
        enableRowSelection: (row) => !row.original.isAddRow && !row.original.isGroup,
        getRowId: (row) => row.uniqueId || row.id.toString(),
    });

    const selectedRowCount = Object.keys(rowSelection).length;

    // Bulk actions handler
    const handleBulkDelete = () => {
        const selectedRowIds = Object.keys(rowSelection);

        selectedRowIds.forEach(rowId => {
            const rowData = flattenedData.find(row => row.uniqueId === rowId);

            if (rowData) {
                if (rowData.isParent) {
                    onDeleteCategory && onDeleteCategory(rowData.id);
                } else if (!rowData.isAddRow) {
                    onDeleteItem && onDeleteItem(rowData.id);
                }
            }
        });

        setRowSelection({});
    };

    return (
        <div className="w-full p-6 bg-base-100 rounded-lg border border-base-300">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAddGroup && onAddGroup()}
                            className="flex items-center gap-2 px-4 py-2 btn-secondary text-white rounded-lg hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Group
                        </button>
                        <button
                            onClick={() => onAddCategory && onAddCategory()}
                            className="flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-lg hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Category
                        </button>
                    </div>
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
                const totalWorkingBalance = (accounts || []).reduce((sum, account) => {
                    const accountTransactions = [];
                    const startingBalance = account.startingBalance || account.balance || 0;
                    const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    return sum + workingBalance;
                }, 0);

                const totalAllocated = data.reduce((sum, category) => sum + (category.allocated || 0), 0);
                const availableToAllocate = totalWorkingBalance - totalAllocated;

                if (availableToAllocate > 0) {
                    return (
                        <div className="mb-4 bg-gradient-primary-secondary rounded-lg border border-base-300 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
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
                onDragOver={handleDragOver}
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
                                items={[...groups.map(g => `group-${g.id}`), ...data.map(cat => cat.id.toString())]}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="bg-base-100">
                                    {table.getRowModel().rows.map(row => {
                                        const isGoalProgress = row.original.isGoalProgress;
                                        const isExpenseDetails = row.original.isExpenseDetails;

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
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">🎯</span>
                                                                        <span className="text-sm font-semibold text-success-dark">Goal Progress</span>
                                                                    </div>
                                                                    <div className="text-sm font-bold text-success-dark">
                                                                        {item.progressPercentage.toFixed(1)}%
                                                                    </div>
                                                                </div>

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
                                                dragOverGroupId={dragOverGroupId}
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
                                        {formatCurrency(data.reduce((sum, cat) => sum + (cat.monthlyNeed || 0), 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-base-content/60">Total Allocated: </span>
                                    <span className="font-medium text-success">
                                        {formatCurrency(data.reduce((sum, cat) => sum + (cat.allocated || 0), 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-base-content/60">Total Available: </span>
                                    <span className="font-medium text-info">
                                        {formatCurrency(data.reduce((sum, cat) => sum + (cat.available || 0), 0))}
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
                    activeBudgetAllocations={[]}
                    onTransferComplete={(transferData) => {
                        if (transferData.type === 'allocation') {
                            const updatedData = data.map(category => {
                                if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    const newAllocated = (category.allocated || 0) + transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
                            }
                        } else if (transferData.type === 'deallocate') {
                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    const newAllocated = (category.allocated || 0) - transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
                            }
                        } else if (transferData.type === 'transfer') {
                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                } else if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
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
                        const updatedData = data.map(category => {
                            const allocation = allocations.find(a => a.categoryId === category.id);
                            if (allocation) {
                                const newAvailable = (category.available || 0) + allocation.amount;
                                const newAllocated = (category.allocated || 0) + allocation.amount;
                                return {
                                    ...category,
                                    available: newAvailable,
                                    allocated: newAllocated
                                };
                            }
                            return category;
                        });

                        if (onDataUpdate) {
                            onDataUpdate(updatedData);
                        }

                        setQuickAllocateModal({ isOpen: false });
                    }}
                />
            </DndContext>
        </div>
    );
};

export default GroupedBudgetCategoriesTable;
