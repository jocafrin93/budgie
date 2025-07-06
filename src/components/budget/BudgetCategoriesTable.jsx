import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Calendar,
    ChevronDown,
    ChevronRight,
    DollarSign,
    Edit,
    MoreHorizontal,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useMemo, useState } from 'react';

const BudgetCategoriesTable = ({
    data = [],
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    // onToggleItemActive,
    // onToggleCategoryActive
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({ 0: true, 2: true }); // Pre-expand Personal Care and Groceries
    const [rowSelection, setRowSelection] = useState({});

    // Helper functions
    const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

    const formatDueDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDueDateUrgency = (dateString) => {
        if (!dateString) return 'none';
        const dueDate = new Date(dateString);
        const today = new Date();
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 30) return 'soon';
        return 'future';
    };

    const getUrgencyStyles = (urgency) => {
        switch (urgency) {
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'urgent':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'soon':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'future':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    // Transform data to include sub-items as separate rows
    const flattenedData = useMemo(() => {
        const result = [];
        data.forEach((category, index) => {
            // Add the main category
            result.push({
                ...category,
                originalIndex: index,
                isParent: true,
                depth: 0,
            });

            // Add sub-items and "Add Item" row if category is expanded
            if (expanded[index]) {
                // Add existing sub-items
                if (category.subItems?.length > 0) {
                    category.subItems.forEach((subItem) => {
                        result.push({
                            ...subItem,
                            originalIndex: index,
                            isParent: false,
                            depth: 1,
                            parentCategory: category,
                        });
                    });
                }

                // Always add "Add Item" row when expanded (for both single and multiple categories)
                result.push({
                    id: `add-item-${category.id}`,
                    name: `Add Item to ${category.name}`,
                    isAddRow: true,
                    originalIndex: index,
                    isParent: false,
                    depth: 1,
                    parentCategory: category,
                });
            }
        });
        return result;
    }, [data, expanded]);

    // Custom header component with sorting
    const SortableHeader = ({ column, children }) => {
        const sorted = column.getIsSorted();
        return (
            <button
                className="flex items-center gap-2 font-medium text-left w-full hover:text-blue-600 transition-colors"
                onClick={() => column.toggleSorting()}
            >
                {children}
                <div className="flex flex-col">
                    {sorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>
        );
    };

    const columnHelper = createColumnHelper();

    // Table columns definition
    const columns = useMemo(
        () => [
            // Row selection checkbox
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => {
                    if (row.original.isAddRow) return null;
                    return (
                        <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            style={{ marginLeft: row.original.depth * 20 }}
                            checked={row.getIsSelected()}
                            onChange={row.getToggleSelectedHandler()}
                        />
                    );
                },
                size: 60,
            }),

            // Expand/Collapse button
            columnHelper.display({
                id: 'expander',
                header: '',
                cell: ({ row }) => {
                    if (row.original.isAddRow || !row.original.isParent) return null;

                    const isExpanded = expanded[row.original.originalIndex];

                    return (
                        <button
                            onClick={() => {
                                setExpanded(prev => ({
                                    ...prev,
                                    [row.original.originalIndex]: !prev[row.original.originalIndex]
                                }));
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    );
                },
                size: 40,
            }),

            // Category/Item name
            columnHelper.accessor('name', {
                header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
                cell: ({ row }) => {
                    const item = row.original;

                    if (item.isAddRow) {
                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }}>
                                <button
                                    onClick={() => onAddItem && onAddItem({ categoryId: item.parentCategory.id })}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border-l-2 border-gray-200 pl-4"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item to {item.parentCategory.name}
                                </button>
                            </div>
                        );
                    }

                    if (item.isParent) {
                        return (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${item.color} border border-gray-200`}></div>
                                    <div>
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {item.type === 'multiple'
                                                ? `${item.subItems?.length || 0} items`
                                                : 'Single category'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // Sub-item
                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }} className="border-l-2 border-gray-200 pl-4">
                                <div className="font-medium text-gray-700">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                    ${item.amount} {item.frequency}
                                    {item.paychecksUntilDue && (
                                        <span className="ml-2 text-blue-600">
                                            • {item.paychecksUntilDue} paychecks left
                                        </span>
                                    )}
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
                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-gray-600' : 'text-gray-900'}`}>
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
                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-blue-500' : 'text-blue-600'}`}>
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
                    const value = getValue();
                    const isSubItem = !row.original.isParent;
                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-green-500' : 'text-green-600'}`}>
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
                    const value = getValue();
                    const isSubItem = !row.original.isParent;
                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-red-500' : 'text-red-600'}`}>
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
                    const value = getValue();
                    const isOverspent = value < 0;
                    const isSubItem = !row.original.isParent;
                    return (
                        <div className={`text-right font-bold ${isOverspent
                            ? (isSubItem ? 'text-red-500' : 'text-red-600')
                            : (isSubItem ? 'text-green-500' : 'text-green-600')
                            }`}>
                            {formatCurrency(value || 0)}
                        </div>
                    );
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
                    const dueDate = getValue();
                    if (!dueDate) return <span className="text-gray-400">—</span>;

                    const urgency = getDueDateUrgency(dueDate);
                    return (
                        <div className="text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyStyles(urgency)}`}>
                                {formatDueDate(dueDate)}
                            </span>
                        </div>
                    );
                },
                size: 140,
            }),

            // Actions
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    if (row.original.isAddRow) return null;
                    const isSubItem = !row.original.isParent;

                    return (
                        <div className="flex items-center justify-center gap-1">
                            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            {isSubItem ? (
                                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                </button>
                            ) : (
                                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                        </div>
                    );
                },
                size: 100,
            }),
        ],
        [expanded, data, columnHelper, onAddItem, onEditCategory, onEditItem, onDeleteCategory, onDeleteItem]
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
        getRowId: (row) => row.id.toString(),
    });

    const selectedRowCount = Object.keys(rowSelection).length;

    // Bulk actions handler
    const handleBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection).map(Number);
        // Call the onDeleteCategory prop for each selected category
        selectedIds.forEach(id => {
            if (onDeleteCategory) {
                onDeleteCategory(id);
            }
        });
        setRowSelection({});
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 bg-white">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-7 h-7 text-green-600" />
                            Budget Categories
                        </h2>
                        <p className="text-gray-600">Manage your envelope budgeting categories and items</p>
                    </div>
                    <button
                        onClick={() => onAddCategory && onAddCategory()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>

                {/* Search and bulk actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {selectedRowCount > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                                {selectedRowCount} selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map(row => {
                                const isSubItem = !row.original.isParent && !row.original.isAddRow;
                                const isAddRow = row.original.isAddRow;
                                const isInactive = row.original.isParent && !row.original.isActive;

                                return (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${isAddRow
                                            ? 'bg-blue-25 hover:bg-blue-50'
                                            : isSubItem
                                                ? 'bg-gray-25 hover:bg-gray-50'
                                                : isInactive
                                                    ? 'bg-gray-50 opacity-60'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td
                                                key={cell.id}
                                                className="px-4 py-4 whitespace-nowrap"
                                                style={{ width: cell.column.getSize() }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Summary footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                            {data.length} categories • {data.reduce((sum, cat) => sum + (cat.subItems?.length || 0), 0)} total items
                        </div>
                        <div className="flex items-center gap-6 text-right">
                            <div>
                                <span className="text-gray-500">Total Monthly Need: </span>
                                <span className="font-medium text-gray-900">
                                    {formatCurrency(data.reduce((sum, cat) => sum + cat.monthlyNeed, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Total Allocated: </span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(data.reduce((sum, cat) => sum + cat.allocated, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">Total Available: </span>
                                <span className="font-medium text-blue-600">
                                    {formatCurrency(data.reduce((sum, cat) => sum + cat.available, 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetCategoriesTable;
