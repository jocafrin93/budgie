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
import { getDaysBetweenOccurrences } from '../../utils/frequencyUtils';
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
                // Add drag listeners to the drag handle cell
                if (index === 0 && row.original.isParent && !row.original.isAddRow) {
                    return React.cloneElement(child, {
                        ...child.props,
                        ...listeners,
                        key: child.key || index,
                        style: { ...child.props.style, cursor: 'grab' }
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
    transactions = [], // Add transactions prop to calculate "to-be-allocated" amount
    getAllUpcomingPaycheckDates, // Add paycheck management function as prop
    // Group management props
    groups = [],
    onAddGroup,
    onEditGroup,
    onDeleteGroup,
    onToggleGroupCollapsed,
    onReorderGroups,
    getCategoriesByGroup,
    // Category and item management props
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

    // Get all sortable items (both groups and categories) for drag & drop
    const sortableItems = useMemo(() => {
        const items = [];

        // Add all groups as sortable items
        if (groups && groups.length > 0) {
            groups.forEach(group => {
                items.push(`group-${group.id}`);
            });
        }

        // Add all parent categories as sortable items
        data.filter(category => category.isParent !== false).forEach(category => {
            items.push(category.id.toString());
        });

        return items;
    }, [data, groups]);

    // Get sorted groups function - memoized to prevent infinite re-renders
    const getSortedGroups = useMemo(() => {
        if (!groups || groups.length === 0) return () => [];
        return () => [...groups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [groups]);

    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setIsDragging(false);

        console.log('🎯 DRAG & DROP DEBUG - handleDragEnd called');
        console.log('📋 Active ID:', active?.id);
        console.log('📋 Over ID:', over?.id);

        if (!over || active.id === over.id) {
            console.log('❌ No drop target or same position - exiting');
            return;
        }

        const activeId = active.id.toString();
        const overId = over.id.toString();

        // Handle group reordering
        if (activeId.startsWith('group-') && overId.startsWith('group-')) {
            console.log('🏷️ Group reordering detected');
            const activeGroupId = activeId.replace('group-', '');
            const overGroupId = overId.replace('group-', '');

            const sortedGroups = getSortedGroups();
            const oldIndex = sortedGroups.findIndex(g => g.id === activeGroupId);
            const newIndex = sortedGroups.findIndex(g => g.id === overGroupId);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedGroups = arrayMove(sortedGroups, oldIndex, newIndex);
                onReorderGroups && onReorderGroups(reorderedGroups);
            }
            return;
        }

        // Handle category dropped onto group (assign category to group)
        if (!activeId.startsWith('group-') && overId.startsWith('group-')) {
            console.log('🏷️ Category dropped onto group - assigning category to group');
            const categoryId = parseInt(activeId, 10); // Convert to number for proper comparison
            const targetGroupId = overId.replace('group-', '');

            console.log(`📋 Assigning category ${categoryId} to group ${targetGroupId}`);

            // Find the category being moved
            const categoryToMove = data.find(cat => cat.id === categoryId);
            if (!categoryToMove) {
                console.log('❌ Category not found - exiting');
                return;
            }

            // Update the category's groupId
            const updatedData = data.map(category => {
                if (category.id === categoryId) {
                    console.log(`✅ Updating category ${category.name} groupId from ${category.groupId} to ${targetGroupId}`);
                    return {
                        ...category,
                        groupId: targetGroupId
                    };
                }
                return category;
            });

            // Update the data through the parent component
            if (onDataUpdate) {
                console.log('🔄 Calling onDataUpdate to persist group assignment');
                onDataUpdate(updatedData, { type: 'group-assignment', preserveAllFields: true });
            }
            return;
        }

        // Handle category reordering within groups
        if (!activeId.startsWith('group-') && !overId.startsWith('group-')) {
            console.log('🔄 Processing category drag & drop reorder...');
            setSorting([]);

            // Get only draggable categories (not groups)
            const draggableCategories = data.filter(cat => cat.isParent && !cat.isGroup);

            const oldIndex = draggableCategories.findIndex(cat => cat.id.toString() === activeId);
            const newIndex = draggableCategories.findIndex(cat => cat.id.toString() === overId);

            if (oldIndex === -1 || newIndex === -1) {
                console.log('❌ Invalid indices - exiting');
                return;
            }

            // Reorder the categories
            const reorderedCategories = arrayMove(draggableCategories, oldIndex, newIndex);

            // Add sortOrder field to maintain the new order
            const reorderedWithSortOrder = reorderedCategories.map((category, index) => ({
                ...category,
                sortOrder: index
            }));

            // Update the full data array
            const updatedData = data.map(category => {
                const reorderedCategory = reorderedWithSortOrder.find(rc => rc.id === category.id);
                return reorderedCategory || category;
            });

            // Update the data through the parent component
            if (onDataUpdate) {
                onDataUpdate(updatedData, { type: 'reorder', preserveAllFields: true });
            }
        }
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
    // Increased from 3 to 50 to cover a full year of paychecks for accurate countdown
    const upcomingPaychecks = useMemo(() => {
        if (typeof getAllUpcomingPaycheckDates === 'function') {
            return getAllUpcomingPaycheckDates(50);
        }
        return [];
    }, [getAllUpcomingPaycheckDates]); // Depend on the passed function

    // Helper functions
    const formatCurrency = useCallback((amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    }, []);

    // Calculate next occurrence for recurring items
    const getNextOccurrence = useCallback((originalDate, frequency) => {
        if (!originalDate || !frequency || frequency === 'once') {
            return originalDate; // Return original date for one-time items
        }

        const today = new Date();
        let currentDate = new Date(originalDate);

        // Skip past dates to find the next occurrence
        while (currentDate < today) {
            const daysBetween = getDaysBetweenOccurrences(frequency);
            currentDate.setDate(currentDate.getDate() + daysBetween);
        }

        return currentDate.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
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

    // Calculate earliest due date and count for multi-item categories (with recurring logic)
    const getCategoryDateInfo = useMemo(() => {
        return (category) => {
            if (!category.subItems || category.subItems.length === 0) {
                // Single category - use its own due date with recurring calculation
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

            // Multi-item category - find earliest date among sub-items (with recurring logic)
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
        };
    }, [getNextOccurrence]);

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

    // Transform data to include sub-items as separate rows, organized by groups
    const flattenedData = useMemo(() => {
        const result = [];

        console.log('🔍 TABLE COMPONENT DATA DEBUG:');
        console.log('📊 Data prop received by table:', data.map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder, groupId: c.groupId })));
        console.log('📊 Data prop length:', data.length);
        console.log('📊 Groups prop:', groups);
        console.log('📊 getCategoriesByGroup function:', !!getCategoriesByGroup);

        // Use grouped data if groups are available and getCategoriesByGroup function exists
        if (groups && groups.length > 0 && getCategoriesByGroup) {
            console.log('🏷️ Using grouped data organization');
            const categoriesByGroup = getCategoriesByGroup();
            console.log('📋 Categories by group:', categoriesByGroup);

            // Process each group
            Object.keys(categoriesByGroup).forEach(groupId => {
                const groupData = categoriesByGroup[groupId];
                const group = groupData.group;
                const groupCategories = groupData.categories;

                console.log(`🏷️ Processing group: ${group.name} (${groupCategories.length} categories)`);

                // Add group header row
                result.push({
                    id: `group-${group.id}`,
                    uniqueId: `group-${group.id}`,
                    name: group.name,
                    isGroup: true,
                    isParent: true, // ✅ Groups should be draggable and expandable
                    depth: 0,
                    group: group,
                    totals: groupData.totals,
                    isCollapsed: group.isCollapsed || false,
                });

                // Add categories in this group (only if group is not collapsed)
                console.log(`🔍 Group ${group.name} collapsed state:`, group.isCollapsed);
                console.log(`🔍 Group object:`, group);

                // Check both group.isCollapsed and group.collapsed for compatibility
                const isGroupCollapsed = group.isCollapsed === true || group.collapsed === true;
                console.log(`🔍 Final collapsed state for ${group.name}:`, isGroupCollapsed);

                if (!isGroupCollapsed) {
                    console.log(`✅ Group ${group.name} is expanded - adding ${groupCategories.length} categories`);
                    groupCategories.forEach((category, categoryIndex) => {
                        // Add the main category with proper indentation under the group
                        result.push({
                            ...category,
                            uniqueId: `category-${category.id}`,
                            originalIndex: categoryIndex,
                            isParent: true,
                            depth: 1, // ✅ Categories should be indented under groups
                            groupId: group.id,
                        });

                        // Add sub-items if category is expanded
                        if (expanded[category.id]) {
                            // Add existing sub-items
                            if (category.subItems?.length > 0) {
                                category.subItems.forEach((subItem) => {
                                    result.push({
                                        ...subItem,
                                        uniqueId: `item-${subItem.id}`,
                                        originalIndex: categoryIndex,
                                        isParent: false,
                                        depth: 2, // ✅ Sub-items should be further indented
                                        parentCategory: category,
                                    });
                                });
                            } else {
                                // For single-item categories, show expense details
                                result.push({
                                    id: `expense-details-${category.id}`,
                                    uniqueId: `expense-details-${category.id}`,
                                    name: 'Expense Details',
                                    isExpenseDetails: true,
                                    isParent: false,
                                    depth: 2,
                                    parentCategory: category,
                                    amount: category.amount,
                                    frequency: category.frequency,
                                    dueDate: category.dueDate,
                                    isRecurring: category.frequency && category.frequency !== 'once',
                                    paychecksLeft: category.dueDate ? calculatePaychecksUntilDue(
                                        category.dueDate,
                                        upcomingPaychecks,
                                        category.accountId
                                    ) : null,
                                });
                            }
                        }
                    });
                } else {
                    console.log(`❌ Group ${group.name} is collapsed - skipping ${groupCategories.length} categories`);
                }
            });
        } else {
            console.log('🔍 Using non-grouped data organization (fallback)');
            // Fallback to original non-grouped logic
            data.forEach((category, index) => {
                // Add the main category
                result.push({
                    ...category,
                    uniqueId: `category-${category.id}`,
                    originalIndex: index,
                    isParent: true,
                    depth: 0,
                });

                // Add sub-items if category is expanded
                if (expanded[category.id]) {
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
                    } else {
                        // For single-item categories, show expense details
                        result.push({
                            id: `expense-details-${category.id}`,
                            uniqueId: `expense-details-${category.id}`,
                            name: 'Expense Details',
                            isExpenseDetails: true,
                            isParent: false,
                            depth: 1,
                            parentCategory: category,
                            amount: category.amount,
                            frequency: category.frequency,
                            dueDate: category.dueDate,
                            isRecurring: category.frequency && category.frequency !== 'once',
                            paychecksLeft: category.dueDate ? calculatePaychecksUntilDue(
                                category.dueDate,
                                upcomingPaychecks,
                                category.accountId
                            ) : null,
                        });
                    }
                }
            });
        }

        return result;
    }, [data, expanded, groups, getCategoriesByGroup, upcomingPaychecks]);

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
                        <div className="flex items-center justify-center drag-handle">
                            <GripVertical className="w-4 h-4 text-base-content/60 cursor-grab active:cursor-grabbing" />
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

                    const item = row.original;

                    // Handle groups
                    if (item.isGroup) {
                        const group = item.group;
                        const isGroupCollapsed = group.isCollapsed === true || group.collapsed === true;

                        return (
                            <button
                                onClick={() => {
                                    onToggleGroupCollapsed && onToggleGroupCollapsed(group.id);
                                }}
                                className="p-0.5 hover rounded transition-colors"
                                title={isGroupCollapsed ? "Expand group" : "Collapse group"}
                            >
                                {isGroupCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-base-content/70" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-base-content/70" />
                                )}
                            </button>
                        );
                    }

                    // Handle categories
                    const isExpanded = expanded[item.id];

                    return (
                        <button
                            onClick={() => {
                                setExpanded(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
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
                    } else if (item.isGroup) {
                        // Group header row with droppable functionality
                        const DroppableGroup = () => {
                            const { isOver, setNodeRef } = useDroppable({
                                id: `group-${item.group.id}`,
                            });

                            return (
                                <div
                                    ref={setNodeRef}
                                    className={`flex items-center justify-between group p-2 rounded transition-all duration-200 ${isOver ? 'bg-primary/20 border-2 border-primary border-dashed' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full border-2"
                                            style={{ backgroundColor: item.group.color, borderColor: item.group.color }}
                                        ></div>
                                        <div className="font-bold text-lg text-base-content">{item.name}</div>
                                        <div className="text-sm text-base-content/60">
                                            ({item.totals ? Object.keys(getCategoriesByGroup()[item.group.id]?.categories || {}).length : 0} categories)
                                        </div>
                                        {isOver && (
                                            <div className="text-sm text-primary font-medium animate-pulse">
                                                Drop here to assign to group
                                            </div>
                                        )}
                                    </div>

                                    {/* Group actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditGroup && onEditGroup(item.group.id);
                                            }}
                                            className="p-1 hover:bg-base-200 rounded transition-colors pointer-events-auto"
                                            title="Edit Group"
                                        >
                                            <Edit className="w-4 h-4 text-base-content/60" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteGroup && onDeleteGroup(item.group.id);
                                            }}
                                            className="p-1 hover:bg-base-200 rounded transition-colors pointer-events-auto"
                                            title="Delete Group"
                                        >
                                            <Trash2 className="w-4 h-4 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>
                            );
                        };

                        return <DroppableGroup />;
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
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                                    {item.type === 'multiple' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddItem && onAddItem({ categoryId: item.id });
                                            }}
                                            className="p-1 hover rounded transition-colors pointer-events-auto"
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
                                        className="p-1 hover rounded transition-colors pointer-events-auto"
                                        title="Edit Category"
                                    >
                                        <Edit className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCategory && onDeleteCategory(item.id);
                                        }}
                                        className="p-1 hover rounded transition-colors pointer-events-auto"
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
                                                // Toggle the current state: if currently active (true or undefined), make inactive (false)
                                                // If currently inactive (false), make active (true)
                                                const currentlyActive = item.isActive !== false;
                                                const newActiveState = !currentlyActive;
                                                console.log(`🔄 Toggling item ${item.name}: ${currentlyActive} → ${newActiveState}`);
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
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditItem && onEditItem(item);
                                            }}
                                            className="p-1 hover rounded transition-colors pointer-events-auto"
                                            title="Edit Item"
                                        >
                                            <Edit className="w-3 h-3 text-base-content/60" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteItem && onDeleteItem(item.id);
                                            }}
                                            className="p-1 hover rounded transition-colors pointer-events-auto"
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
                    const isGroup = row.original.isGroup;

                    if (isGroup) {
                        // For groups, show total from all categories in the group
                        return (
                            <div className="text-right font-bold text-base-content">
                                {formatCurrency(row.original.totals?.monthlyNeed || 0)}
                            </div>
                        );
                    }

                    if (isSubItem && row.original.amount && row.original.frequency) {
                        // For sub-items, calculate and display monthly equivalent
                        // Pass due date for one-time expenses to get accurate monthly calculation
                        const monthlyAmount = calculateMonthlyAmount(row.original.amount, row.original.frequency, row.original.dueDate);
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
                    const isGroup = row.original.isGroup;

                    if (isGroup) {
                        // For groups, show total from all categories in the group
                        return (
                            <div className="text-right font-bold text-base-content">
                                {formatCurrency(row.original.totals?.perPaycheck || 0)}
                            </div>
                        );
                    }

                    if (isSubItem) {
                        if (row.original.dueDate) {
                            // For sub-items with due dates, show paycheck amount and countdown using account-specific filtering
                            // Use the sub-item's accountId if it has one, otherwise use parent category's accountId
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
                    const isGroup = row.original.isGroup;

                    // Don't show allocated amounts for sub-items - funds are allocated to categories, not individual items
                    if (isSubItem) return (
                        '—'
                    );

                    if (isGroup) {
                        // For groups, show total from all categories in the group
                        return (
                            <div className="text-right font-bold text-success">
                                {formatCurrency(row.original.totals?.allocated || 0)}
                            </div>
                        );
                    }

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
                    const isGroup = row.original.isGroup;

                    // Don't show spent amounts for sub-items - spending is tracked at category level
                    if (isSubItem) return (
                        '—'
                    );

                    if (isGroup) {
                        // For groups, show total from all categories in the group
                        return (
                            <div className="text-right font-bold text-error">
                                {formatCurrency(row.original.totals?.spent || 0)}
                            </div>
                        );
                    }

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
                    const isGroup = row.original.isGroup;

                    // Don't show available amounts for sub-items - only categories have available funds
                    if (isSubItem) return ('—'

                    );

                    if (isGroup) {
                        // For groups, show total from all categories in the group
                        const groupTotal = row.original.totals?.available || 0;
                        const isOverspent = groupTotal < 0;

                        return (
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${isOverspent
                                    ? 'bg-error/20 text-error border border-error'
                                    : groupTotal > 0
                                        ? 'bg-success-lighter/20 text-success border border-success'
                                        : 'bg-base-200 text-base-content/60 border border-base-300'
                                    }`}>
                                    {isOverspent && <span className="mr-1">⚠️</span>}
                                    {formatCurrency(groupTotal)}
                                </span>
                            </div>
                        );
                    }

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
                        // Sub-item: show its own due date with recurring calculation
                        const originalDueDate = getValue();
                        if (!originalDueDate) return (
                            <div className="text-center">
                                <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                            </div>
                        );

                        // Calculate next occurrence for recurring items
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
            getCategoriesByGroup,
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
            isDragging,
            onEditGroup,
            onDeleteGroup,
            onToggleGroupCollapsed
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onAddGroup && onAddGroup()}
                            className="flex items-center gap-2 px-4 py-2 btn-secondary text-base-content rounded-lg hover transition-colors"
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
                // Calculate available to allocate using the same account-specific approach as the modal
                let totalAvailable = 0;

                // Process each account
                (accounts || []).forEach(account => {
                    // 1. Calculate account's working balance
                    const accountTransactions = (transactions || []).filter(t => t.accountId === account.id);
                    const startingBalance = account.startingBalance || account.balance || 0;
                    const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

                    // 2. Find categories associated with this account
                    const accountCategories = data.filter(cat =>
                        cat.accountId !== undefined &&
                        cat.accountId !== null &&
                        String(cat.accountId) === String(account.id)
                    );

                    // 3. Calculate how much is already available in those categories
                    const categoryAvailableTotal = accountCategories.reduce((sum, cat) => {
                        return sum + Math.max(0, cat.available || 0);
                    }, 0);

                    // 4. Calculate account's available to allocate amount
                    const accountAvailable = workingBalance - categoryAvailableTotal;

                    // Add to total
                    totalAvailable += accountAvailable;
                });

                // Add transactions with "to-be-allocated" category to available funds
                const toBeAllocatedAmount = (transactions || []).filter(t => t.categoryId === 'to-be-allocated')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                const availableToAllocate = totalAvailable + toBeAllocatedAmount;

                // Debug logging
                console.log('🔍 Quick Allocate Debug:');
                console.log('📊 Accounts:', accounts);
                console.log('💰 Total Available from Accounts:', totalAvailable);
                console.log('📋 Categories data:', data);
                console.log('🎯 To-be-allocated amount:', toBeAllocatedAmount);
                console.log('✨ Available to Allocate:', availableToAllocate);
                console.log('👀 Should show Quick Allocate?', availableToAllocate > 0);

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
                                items={sortableItems}
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
                            console.log('📊 Transfer updates:', transferData.updates);

                            // Get source and destination categories
                            const fromCategory = data.find(c => c.id === transferData.fromCategory);
                            const toCategory = data.find(c => c.id === transferData.toCategory);

                            if (fromCategory && toCategory && transferData.updates) {
                                // Apply the update functions from useEnvelopeBudgeting
                                const updatedData = data.map(category => {
                                    // Find the appropriate update function for this category
                                    const categoryUpdate = transferData.updates.find(
                                        update => update.categoryId === category.id
                                    );

                                    if (categoryUpdate && typeof categoryUpdate.update === 'function') {
                                        // Apply the update function from useEnvelopeBudgeting
                                        const updatedCategory = categoryUpdate.update(category);
                                        console.log(`✅ Applying update to ${category.name}:`,
                                            `available ${category.available} → ${updatedCategory.available}`);
                                        return updatedCategory;
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
                            } else {
                                console.error('❌ Failed to find categories or updates for transfer:', {
                                    fromCategoryFound: !!fromCategory,
                                    toCategoryFound: !!toCategory,
                                    updatesAvailable: !!transferData.updates
                                });
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
                        // Calculate available to allocate by summing the available amounts from each account
                        // This ensures the total matches what's shown in the per-account view
                        let totalAvailable = 0;

                        // Process each account
                        (accounts || []).forEach(account => {
                            // 1. Calculate account's working balance
                            const accountTransactions = (transactions || []).filter(t => t.accountId === account.id);
                            const startingBalance = account.startingBalance || account.balance || 0;
                            const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

                            // 2. Find categories associated with this account
                            const accountCategories = data.filter(cat =>
                                cat.accountId !== undefined &&
                                cat.accountId !== null &&
                                String(cat.accountId) === String(account.id)
                            );

                            // 3. Calculate how much is already available in those categories
                            const categoryAvailableTotal = accountCategories.reduce((sum, cat) => {
                                return sum + Math.max(0, cat.available || 0);
                            }, 0);

                            // 4. Calculate account's available to allocate amount
                            const accountAvailable = workingBalance - categoryAvailableTotal;

                            // Add to total
                            totalAvailable += accountAvailable;
                        });

                        // Add transactions with "to-be-allocated" category to available funds
                        const toBeAllocatedAmount = (transactions || []).filter(t => t.categoryId === 'to-be-allocated')
                            .reduce((sum, t) => sum + (t.amount || 0), 0);

                        return totalAvailable + toBeAllocatedAmount;
                    })()}
                    categories={data}
                    accounts={accounts}
                    transactions={transactions}
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
