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
    Trash2,
    FolderOpen,
    Folder,
    Settings
} from 'lucide-react';
import React, { useMemo, useState, useCallback } from 'react';
import { getGradientStyle } from '../../utils/gradientUtils';
import { getDaysBetweenOccurrences } from '../../utils/frequencyUtils';
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
        disabled: !row.original.isCategory || row.original.isAddRow,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Only apply sortable to category rows within groups
    if (!row.original.isCategory || row.original.isAddRow || row.original.isGroup) {
        return (
            <tr
                className={`${row.original.isAddRow
                    ? 'bg-primary/10'
                    : row.original.isGroup
                        ? 'bg-base-200 border-t-2 border-base-300'
                        : !row.original.isCategory && !row.original.isAddRow
                            ? 'bg-base-100'
                            : row.original.isCategory && !row.original.isActive
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
                : !row.original.isCategory && !row.original.isAddRow
                    ? 'bg-base-100'
                    : row.original.isCategory && !row.original.isActive
                        ? 'bg-base-200 opacity-60'
                        : ''
                }`}
        >
            {childrenArray.map((child, index) => {
                // Add drag listeners to the first cell (drag handle column)
                if (index === 0 && row.original.isCategory && !row.original.isAddRow) {
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

const GroupedBudgetCategoriesTable = ({
    data = [],
    accounts = [],
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onDataUpdate,
    // Group management props
    groups = [],
    onAddGroup,
    onEditGroup,
    onToggleGroupCollapsed,
    onToggleAllGroups,
    onReorderCategoriesInGroup,
    getCategoriesByGroup
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [transferModal, setTransferModal] = useState({ isOpen: false, targetCategory: null });
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });
    const [isDragging, setIsDragging] = useState(false);

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

    // Handle drag end for category reordering within groups
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setIsDragging(false);

        if (!over || active.id === over.id) {
            return;
        }

        console.log('🏷️ GROUPS - Drag & drop reorder within group');

        // Find which group this category belongs to
        const categoriesByGroup = getCategoriesByGroup();
        let sourceGroupId = null;
        let sourceCategories = [];

        for (const [groupId, groupData] of Object.entries(categoriesByGroup)) {
            const categoryExists = groupData.categories.some(cat => cat.id.toString() === active.id.toString());
            if (categoryExists) {
                sourceGroupId = groupId;
                sourceCategories = groupData.categories;
                break;
            }
        }

        if (!sourceGroupId) {
            console.log('❌ Could not find source group for category');
            return;
        }

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const oldIndex = sourceCategories.findIndex(cat => cat.id.toString() === activeId);
        const newIndex = sourceCategories.findIndex(cat => cat.id.toString() === overId);

        if (oldIndex === -1 || newIndex === -1) {
            console.log('❌ Invalid indices for reorder');
            return;
        }

        const reorderedCategories = arrayMove(sourceCategories, oldIndex, newIndex);
        onReorderCategoriesInGroup && onReorderCategoriesInGroup(sourceGroupId, reorderedCategories);
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    // Transform data to include groups and categories organized by groups
    const flattenedData = useMemo(() => {
        const result = [];
        const categoriesByGroup = getCategoriesByGroup();

        console.log('🏷️ GROUPS - Flattening data for grouped display');
        console.log('📊 Categories by group:', categoriesByGroup);

        Object.entries(categoriesByGroup).forEach(([groupId, groupData]) => {
            const { group, categories, totals } = groupData;

            // Add group header row
            result.push({
                id: `group-${groupId}`,
                uniqueId: `group-${groupId}`,
                name: group.name,
                description: group.description,
                color: group.color,
                isGroup: true,
                isCollapsed: group.isCollapsed,
                groupId: groupId,
                categoryCount: categories.length,
                totals,
                depth: 0
            });

            // Add categories in this group (if not collapsed)
            if (!group.isCollapsed) {
                categories.forEach((category, index) => {
                    // Add the main category
                    result.push({
                        ...category,
                        uniqueId: `category-${category.id}`,
                        originalIndex: index,
                        isCategory: true,
                        isGroup: false,
                        depth: 1,
                        groupId: groupId
                    });

                    // Add sub-items if category is expanded (using existing expanded state logic)
                    // This would need to be implemented similar to the original table
                });
            }
        });

        console.log('📋 Flattened data result:', result.map(r => ({
            id: r.id,
            name: r.name,
            isGroup: r.isGroup,
            isCategory: r.isCategory,
            depth: r.depth
        })));

        return result;
    }, [getCategoriesByGroup]);

    // Custom header component with sorting
    const SortableHeader = ({ column, children }) => {
        const sorted = column.getIsSorted();
        return (
            <button
                className="flex items-center gap-2 font-medium text-left w-full hover:text-primary transition-colors"
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
            // Drag handle column (only for categories within groups)
            columnHelper.display({
                id: 'dragHandle',
                header: '',
                cell: ({ row }) => {
                    // Only show drag handle for categories within groups
                    if (!row.original.isCategory || row.original.isAddRow || row.original.isGroup) return null;

                    return (
                        <div className="flex items-center justify-center">
                            <button
                                className={`p-1 hover:bg-base-200 rounded transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
                                title="Drag to reorder within group"
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
                    const item = row.original;

                    if (item.isGroup) {
                        // Group expand/collapse
                        return (
                            <button
                                onClick={() => {
                                    onToggleGroupCollapsed && onToggleGroupCollapsed(item.groupId);
                                }}
                                className="p-0.5 hover:bg-base-200 rounded transition-colors"
                            >
                                {item.isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-base-content/70" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-base-content/70" />
                                )}
                            </button>
                        );
                    }

                    // For categories, we could add individual expand/collapse for sub-items
                    return null;
                },
                size: 10,
            }),

            // Group/Category name
            columnHelper.accessor('name', {
                header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
                cell: ({ row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group header row
                        return (
                            <div className="flex items-center justify-between group py-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-5 h-5 rounded-full border-2 border-base-300 flex items-center justify-center"
                                        style={{ backgroundColor: item.color }}
                                    >
                                        {item.isCollapsed ? (
                                            <Folder className="w-3 h-3 text-white" />
                                        ) : (
                                            <FolderOpen className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-base-content text-lg">
                                            {item.name}
                                        </div>
                                        {item.description && (
                                            <div className="text-sm text-base-content/60">
                                                {item.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-base-content/60 bg-base-200 px-2 py-1 rounded-full">
                                        {item.categoryCount} categories
                                    </div>
                                </div>

                                {/* Group actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddCategory && onAddCategory({ groupId: item.groupId });
                                        }}
                                        className="p-1 hover:bg-base-200 rounded transition-colors"
                                        title="Add Category to Group"
                                    >
                                        <Plus className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditGroup && onEditGroup(item.groupId);
                                        }}
                                        className="p-1 hover:bg-base-200 rounded transition-colors"
                                        title="Edit Group"
                                    >
                                        <Settings className="w-4 h-4 text-base-content/60" />
                                    </button>
                                </div>
                            </div>
                        );
                    } else if (item.isCategory) {
                        // Category row
                        return (
                            <div style={{ marginLeft: item.depth * 20 }} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rotate-45 rounded-sm border border-base-300"
                                        style={getGradientStyle(item.color)}
                                    ></div>
                                    {item.type === 'multiple' && (
                                        <Box className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" />
                                    )}
                                    {item.planningType === 'goal' && (
                                        <Target className="w-4 h-4 text-base-content/40" />
                                    )}
                                    <div className="font-medium text-base-content">{item.name}</div>
                                </div>

                                {/* Category actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item.type === 'multiple' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddItem && onAddItem({ categoryId: item.id });
                                            }}
                                            className="p-1 hover:bg-base-200 rounded transition-colors"
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
                                        className="p-1 hover:bg-base-200 rounded transition-colors"
                                        title="Edit Category"
                                    >
                                        <Edit className="w-4 h-4 text-base-content/60" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCategory && onDeleteCategory(item.id);
                                        }}
                                        className="p-1 hover:bg-base-200 rounded transition-colors"
                                        title="Delete Category"
                                    >
                                        <Trash2 className="w-4 h-4 text-base-content/60" />
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return null;
                },
                size: 300,
            }),

            // Monthly need
            columnHelper.accessor('monthlyNeed', {
                header: ({ column }) => <SortableHeader column={column}>Per Month</SortableHeader>,
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group totals
                        return (
                            <div className="text-right font-bold text-base-content">
                                {formatCurrency(item.totals?.monthlyNeed || 0)}
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const value = getValue();
                        return (
                            <div className="text-right font-medium text-base-content">
                                {formatCurrency(value || 0)}
                            </div>
                        );
                    }

                    return null;
                },
                size: 120,
            }),

            // Per paycheck
            columnHelper.accessor('perPaycheck', {
                header: ({ column }) => <SortableHeader column={column}>Per Paycheck</SortableHeader>,
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group totals
                        return (
                            <div className="text-right font-bold text-primary">
                                {formatCurrency(item.totals?.perPaycheck || 0)}
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const value = getValue();
                        return (
                            <div className="text-right font-medium text-primary">
                                {formatCurrency(value || 0)}
                            </div>
                        );
                    }

                    return null;
                },
                size: 120,
            }),

            // Allocated
            columnHelper.accessor('allocated', {
                header: ({ column }) => <SortableHeader column={column}>Allocated</SortableHeader>,
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group totals
                        return (
                            <div className="text-right font-bold text-success">
                                {formatCurrency(item.totals?.allocated || 0)}
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const value = getValue();
                        return (
                            <div className="text-right font-medium text-success">
                                {formatCurrency(value || 0)}
                            </div>
                        );
                    }

                    return null;
                },
                size: 120,
            }),

            // Spent
            columnHelper.accessor('spent', {
                header: ({ column }) => <SortableHeader column={column}>Spent</SortableHeader>,
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group totals
                        return (
                            <div className="text-right font-bold text-error">
                                {formatCurrency(item.totals?.spent || 0)}
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const value = getValue();
                        return (
                            <div className="text-right font-medium text-error">
                                {formatCurrency(value || 0)}
                            </div>
                        );
                    }

                    return null;
                },
                size: 120,
            }),

            // Available
            columnHelper.accessor('available', {
                header: ({ column }) => <SortableHeader column={column}>Available</SortableHeader>,
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // Group totals
                        const value = item.totals?.available || 0;
                        const isOverspent = value < 0;

                        return (
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold border ${isOverspent
                                    ? 'bg-error/20 text-error border-error'
                                    : value > 0
                                        ? 'bg-success/20 text-success border-success'
                                        : 'bg-base-200 text-base-content/60 border-base-300'
                                    }`}>
                                    {isOverspent && <span className="mr-1">⚠️</span>}
                                    {formatCurrency(value)}
                                </span>
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const value = getValue();
                        const isOverspent = value < 0;

                        // Only make clickable if there's money to transfer out (value > 0)
                        if (value > 0) {
                            return (
                                <div className="text-right">
                                    <button
                                        onClick={() => handleTransferClick(item)}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border transition-colors hover:opacity-80 focus:border-primary focus:outline-none bg-success/20 text-success border-success hover:bg-success/30"
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
                    }

                    return null;
                },
                size: 120,
            }),

            // Due date (simplified for groups)
            columnHelper.accessor('dueDate', {
                header: ({ column }) => (
                    <SortableHeader column={column}>
                        <Calendar className="w-4 h-4" />
                        Due Date
                    </SortableHeader>
                ),
                cell: ({ getValue, row }) => {
                    const item = row.original;

                    if (item.isGroup) {
                        // For groups, show a summary or leave empty
                        return (
                            <div className="text-center">
                                <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                            </div>
                        );
                    }

                    if (item.isCategory) {
                        const originalDueDate = getValue();
                        if (!originalDueDate) {
                            return (
                                <div className="text-center">
                                    <CalendarOff className="w-4 h-4 text-base-content/60 mx-auto" />
                                </div>
                            );
                        }

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
                    }

                    return null;
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
            onAddItem,
            onEditCategory,
            onDeleteCategory,
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
        enableRowSelection: (row) => !row.original.isAddRow && !row.original.isGroup,
        getRowId: (row) => row.uniqueId || row.id.toString(),
    });

    const selectedRowCount = Object.keys(rowSelection).length;

    // Bulk actions handler
    const handleBulkDelete = () => {
        const selectedRowIds = Object.keys(rowSelection);

        selectedRowIds.forEach(rowId => {
            const rowData = flattenedData.find(row => row.uniqueId === rowId);

            if (rowData && rowData.isCategory) {
                onDeleteCategory && onDeleteCategory(rowData.id);
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
                            Budget Categories (Grouped)
                        </h2>
                        <p className="text-base-content/60">Manage your envelope budgeting categories organized by groups</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAddGroup && onAddGroup()}
                            className="flex items-center gap-2 px-4 py-2 btn-secondary text-base-content rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Group
                        </button>
                        <button
                            onClick={() => onAddCategory && onAddCategory()}
                            className="flex items-center gap-2 px-4 py-2 btn-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
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

                    <div className="flex items-center gap-3">
                        {selectedRowCount > 0 && (
                            <>
                                <span className="text-sm text-base-content/60">
                                    {selectedRowCount} selected
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-3 py-2 bg-error text-white rounded-lg hover:bg-error/80 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Selected
                                </button>
                            </>
                        )}

                        {/* Group controls */}
                        <button
                            onClick={() => onToggleAllGroups && onToggleAllGroups(false)}
                            className="flex items-center gap-2 px-3 py-2 bg-base-200 text-base-content rounded-lg hover:bg-base-300 transition-colors"
                            title="Expand all groups"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Expand All
                        </button>
                        <button
                            onClick={() => onToggleAllGroups && onToggleAllGroups(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-base-200 text-base-content rounded-lg hover:bg-base-300 transition-colors"
                            title="Collapse all groups"
                        >
                            <Folder className="w-4 h-4" />
                            Collapse All
                        </button>
                    </div>
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
                        <div className="mb-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-base-300 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
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
                                items={flattenedData.filter(item => item.isCategory).map(cat => cat.id.toString())}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="bg-base-100">
                                    {table.getRowModel().rows.map(row => (
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
                                    ))}
                                </tbody>
                            </SortableContext>
                        </table>
                    </div>

                    {/* Summary footer */}
                    <div className="bg-base-300 border-t border-base-300 px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-base-content/60">
                                {groups.length} groups • {data.length} categories
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
                        console.log('🎯 GroupedBudgetCategoriesTable: Transfer completed callback received');
                        console.log('📊 Transfer data received:', transferData);

                        // Handle the transfer completion here
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
                        console.log('🚀 GroupedBudgetCategoriesTable: Bulk allocation received');
                        console.log('📊 Allocations:', allocations);

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
