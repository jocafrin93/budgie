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
    Box,
    Calendar,
    ChevronDown,
    ChevronRight,
    DollarSign,
    Edit,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import {
    calculateMonthlyAmount,
    calculatePaychecksUntilDue,
    formatAmountWithFrequency
} from '../../utils/budgetDisplayUtils';
import QuickAllocateModal from './QuickAllocateModal';
import TransferModal from './TransferModal';

const BudgetCategoriesTable = ({
    data = [],
    accounts = [], // Add accounts prop to calculate available to allocate
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onDataUpdate, // New callback to update parent component's data
    // onToggleItemActive,
    // onToggleCategoryActive
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({}); // Track expanded state by category ID
    const [rowSelection, setRowSelection] = useState({});
    const [transferModal, setTransferModal] = useState({ isOpen: false, targetCategory: null });
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });

    // Handle transfer button click
    const handleTransferClick = (category) => {
        setTransferModal({
            isOpen: true,
            targetCategory: category,
            mode: 'transfer-into'
        });
    };

    // Get paycheck management hook
    const { getAllUpcomingPaycheckDates } = usePaycheckManagement();

    // Get upcoming paychecks for countdown calculations
    const upcomingPaychecks = getAllUpcomingPaycheckDates(3); // Get 3 months of paychecks

    // Helper functions
    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return '—';

        // Handle date string properly to avoid timezone issues
        // If it's in YYYY-MM-DD format, parse it as local date
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // For other date formats, use standard parsing
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate earliest due date and count for multi-item categories
    const getCategoryDateInfo = (category) => {
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
    };

    // Format category due date with count badge
    const formatCategoryDueDate = (category) => {
        const dateInfo = getCategoryDateInfo(category);

        if (!dateInfo.earliestDate) {
            return '—';
        }

        const formattedDate = formatDueDate(dateInfo.earliestDate);

        if (dateInfo.additionalCount > 0) {
            return `${formattedDate} +${dateInfo.additionalCount}`;
        }

        return formattedDate;
    };

    const getDueDateUrgency = (dateString) => {
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

                // Only add "Add Item" row for multiple categories (not single categories)
                if (category.type === 'multiple') {
                    result.push({
                        id: `add-item-${category.id}`,
                        uniqueId: `add-item-${category.id}`,
                        name: `Add Item to ${category.name}`,
                        isAddRow: true,
                        originalIndex: index,
                        isParent: false,
                        depth: 1,
                        parentCategory: category,
                    });
                }
            }
        });
        return result;
    }, [data, expanded, upcomingPaychecks]);

    // Custom header component with sorting
    const SortableHeader = ({ column, children }) => {
        const sorted = column.getIsSorted();
        return (
            <button
                className="flex items-center gap-2 font-medium text-left w-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => column.toggleSorting()}
            >
                {children}
                <div className="flex flex-col">
                    {sorted === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="w-4 h-4" />
                    ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-dark-400" />
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
                            className="p-1 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-dark-300" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-dark-300" />
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
                                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-blue-700 dark:hover:text-blue-300 border-l-2 border-gray-200 dark:border-dark-600 pl-4"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Item to {item.parentCategory.name}
                                </button>
                            </div>
                        );
                    }

                    if (item.isGoalProgress) {
                        // Goal progress row - this will span all columns
                        return null; // We'll handle this in a special way
                    } else if (item.isExpenseDetails) {
                        // Expense details row with paycheck countdown and details
                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4 py-2">
                                <div className="space-y-3">
                                    {/* Expense header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">💸</span>
                                            <span className="font-medium text-blue-800 dark:text-blue-200">Expense Details</span>
                                        </div>
                                        {item.paychecksLeft !== null && (
                                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                {item.paychecksLeft === 0 ? 'Due Now!' :
                                                    item.paychecksLeft > 0 ? `${item.paychecksLeft} paychecks left` : 'Overdue'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expense details grid */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">Amount</div>
                                            <div className="font-medium text-blue-600 dark:text-blue-400">
                                                ${(parseFloat(item.amount) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">Frequency</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                {(item.frequency || 'monthly').replace('-', ' ')}
                                            </div>
                                        </div>
                                        {item.dueDate && (
                                            <>
                                                <div>
                                                    <div className="text-gray-600 dark:text-gray-400">Due Date</div>
                                                    <div className="font-medium text-orange-600 dark:text-orange-400">
                                                        {new Date(item.dueDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600 dark:text-gray-400">Paychecks Left</div>
                                                    <div className={`font-medium ${item.paychecksLeft === 0 ? 'text-red-600 dark:text-red-400' :
                                                        item.paychecksLeft === 1 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            item.paychecksLeft > 1 ? 'text-green-600 dark:text-green-400' :
                                                                'text-red-700 dark:text-red-300'
                                                        }`}>
                                                        {item.paychecksLeft === 0 ? 'Due now!' :
                                                            item.paychecksLeft > 0 ? `${item.paychecksLeft} left` : 'Overdue'}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <div className="text-gray-600 dark:text-gray-400">Type</div>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.isRecurring ? 'Recurring' : 'One-time'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (item.isParent) {
                        return (
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${item.color} border border-gray-200 dark:border-dark-600`}></div>
                                <div className="font-medium text-gray-900 dark:text-dark-100">{item.name}</div>
                                {item.type === 'multiple' && (
                                    <Box className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor">
                                    </Box>
                                )}
                            </div>
                        );
                    } else {
                        // Sub-item with enhanced display
                        const amountWithFrequency = formatAmountWithFrequency(item.amount, item.frequency);

                        return (
                            <div style={{ marginLeft: item.depth * 20 + 16 }} className="border-l-2 border-gray-200 dark:border-dark-600 pl-4">
                                <div className="font-medium text-gray-700 dark:text-dark-200">{item.name}</div>
                                <div className="text-sm text-gray-500 dark:text-dark-400">
                                    {amountWithFrequency}
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
                                <div className="font-medium text-gray-600 dark:text-dark-300">
                                    {formatCurrency(monthlyAmount)}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className={`text-right font-medium ${isSubItem ? 'text-gray-600 dark:text-dark-300' : 'text-gray-900 dark:text-dark-100'}`}>
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
                                    <div className="flex items-center justify-end gap-1 font-medium text-blue-500">
                                        <span>{formatCurrency(value || 0)}</span>
                                        {paychecksLeft === 0 ? (
                                            <span className="text-green-500" title="Due now">
                                                ⚡
                                            </span>
                                        ) : (
                                            <span className="text-blue-400" title={`${paychecksLeft} paychecks until due`}>
                                                🕒
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs">
                                        {paychecksLeft === 0 ? (
                                            <span className="text-green-500 font-medium">due now</span>
                                        ) : paychecksLeft > 0 ? (
                                            <span className="text-blue-400">{paychecksLeft} left</span>
                                        ) : (
                                            <span className="text-red-400">overdue</span>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // For sub-items without due dates, show amount with ongoing indicator
                            return (
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 font-medium text-blue-500">
                                        <span>{formatCurrency(value || 0)}</span>
                                        <span className="text-gray-400" title="Ongoing expense">
                                            ♾️
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        ongoing
                                    </div>
                                </div>
                            );
                        }
                    }

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
                    const isSubItem = !row.original.isParent;

                    // Don't show allocated amounts for sub-items - funds are allocated to categories, not individual items
                    if (isSubItem) return <div className="text-right text-gray-400">—</div>;

                    const value = getValue();
                    return (
                        <div className="text-right font-medium text-green-600">
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
                    if (isSubItem) return <div className="text-right text-gray-400">—</div>;

                    const value = getValue();
                    return (
                        <div className="text-right font-medium text-red-600">
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
                    if (isSubItem) return <div className="text-right text-gray-400">—</div>;

                    const value = getValue();
                    const isOverspent = value < 0;

                    // Only make clickable if there's money to transfer out (value > 0)
                    if (value > 0) {
                        return (
                            <div className="text-right">
                                <button
                                    onClick={() => handleTransferClick(row.original)}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border transition-colors hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                    title="Click to move money out of this category"
                                >
                                    <span className="mr-1">💰</span>
                                    {formatCurrency(value)}
                                </button>
                            </div>
                        );
                    } else {
                        // Non-clickable display for $0 or negative amounts
                        return (
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${isOverspent
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
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
                        if (!dueDate) return <span className="text-gray-400">—</span>;

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
                            return <span className="text-gray-400">—</span>;
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

            // Actions
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    if (row.original.isAddRow) return null;
                    const isSubItem = !row.original.isParent;

                    return (
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={() => {
                                    console.log('Edit button clicked!');
                                    console.log('Row data:', row.original);
                                    console.log('Is sub item:', isSubItem);
                                    console.log('onEditItem function:', onEditItem);
                                    console.log('onEditCategory function:', onEditCategory);

                                    if (isSubItem) {
                                        console.log('Calling onEditItem with:', row.original);
                                        onEditItem && onEditItem(row.original);
                                    } else {
                                        console.log('Calling onEditCategory with:', row.original);
                                        onEditCategory && onEditCategory(row.original);
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                                title={isSubItem ? "Edit Item" : "Edit Category"}
                            >
                                <Edit className="w-4 h-4 text-gray-600 dark:text-dark-300" />
                            </button>
                            <button
                                onClick={() => {
                                    if (isSubItem) {
                                        onDeleteItem && onDeleteItem(row.original.id);
                                    } else {
                                        onDeleteCategory && onDeleteCategory(row.original.id);
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-600 rounded transition-colors"
                                title={isSubItem ? "Delete Item" : "Delete Category"}
                            >
                                <Trash2 className="w-4 h-4 text-gray-600 dark:text-dark-300" />
                            </button>
                        </div>
                    );
                },
                size: 100,
            }),
        ],
        [
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
        <div className="w-full max-w-7xl mx-auto p-6 bg-white dark:bg-dark-800">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
                            <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
                            Budget Categories
                        </h2>
                        <p className="text-gray-600 dark:text-dark-300">Manage your envelope budgeting categories and items</p>
                    </div>
                    <button
                        onClick={() => onAddCategory && onAddCategory()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>

                {/* Search and bulk actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-500 dark:placeholder-dark-400"
                        />
                    </div>

                    {selectedRowCount > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-dark-300">
                                {selectedRowCount} selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
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

                if (availableToAllocate > 0) {
                    return (
                        <div className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden shadow-sm">
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                                            💰
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                                                Available to Allocate
                                            </h3>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                Choose how to allocate your money
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {formatCurrency(availableToAllocate)}
                                        </div>
                                        <div className="text-sm text-green-600 dark:text-green-400">
                                            Ready to allocate
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={() => setQuickAllocateModal({ isOpen: true })}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
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
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
            <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider"
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
                        <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                            {table.getRowModel().rows.map(row => {
                                const isSubItem = !row.original.isParent && !row.original.isAddRow;
                                const isAddRow = row.original.isAddRow;
                                const isInactive = row.original.isParent && !row.original.isActive;
                                const isGoalProgress = row.original.isGoalProgress;
                                const isExpenseDetails = row.original.isExpenseDetails;

                                // Special handling for goal progress and expense details rows
                                if (isGoalProgress) {
                                    const item = row.original;
                                    const progressColor = item.progressPercentage >= 100 ? 'success' :
                                        item.progressPercentage >= 75 ? 'primary' :
                                            item.progressPercentage >= 50 ? 'warning' : 'neutral';

                                    return (
                                        <tr key={row.id} className="bg-green-25 dark:bg-green-900/10">
                                            <td colSpan={columns.length} className="px-4 py-2">
                                                <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800">
                                                    <div className="space-y-2">
                                                        {/* Progress header */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">🎯</span>
                                                                <span className="text-sm font-semibold text-green-800 dark:text-green-200">Goal Progress</span>
                                                            </div>
                                                            <div className="text-sm font-bold text-green-700 dark:text-green-300">
                                                                {item.progressPercentage.toFixed(1)}%
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-300 ${progressColor === 'success' ? 'bg-green-500' :
                                                                    progressColor === 'primary' ? 'bg-blue-500' :
                                                                        progressColor === 'warning' ? 'bg-yellow-500' :
                                                                            'bg-gray-400'
                                                                    }`}
                                                                style={{ width: `${Math.min(100, item.progressPercentage)}%` }}
                                                            />
                                                        </div>

                                                        {/* Goal details grid */}
                                                        <div className="grid grid-cols-4 gap-4 text-xs">
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Saved</div>
                                                                <div className="font-bold text-green-600 dark:text-green-400">
                                                                    ${(parseFloat(item.currentAmount) || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Target</div>
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                                    ${(parseFloat(item.targetAmount) || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Per Paycheck</div>
                                                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                                                    ${(parseFloat(item.perPaycheckContribution) || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">
                                                                    {item.daysUntilTarget !== null ? (
                                                                        item.daysUntilTarget > 0 ? 'Days Left' :
                                                                            item.daysUntilTarget === 0 ? 'Due Today' : 'Overdue'
                                                                    ) : 'Target Date'}
                                                                </div>
                                                                <div className={`font-bold ${item.daysUntilTarget !== null ? (
                                                                    item.daysUntilTarget > 30 ? 'text-gray-600 dark:text-gray-400' :
                                                                        item.daysUntilTarget > 7 ? 'text-yellow-600 dark:text-yellow-400' :
                                                                            item.daysUntilTarget >= 0 ? 'text-red-600 dark:text-red-400' :
                                                                                'text-red-700 dark:text-red-300'
                                                                ) : 'text-gray-600 dark:text-gray-400'
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
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        ({new Date(item.targetDate).toLocaleDateString()})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Remaining amount - inline */}
                                                        {item.progressPercentage < 100 && (
                                                            <div className="text-center text-xs pt-1 border-t border-green-200 dark:border-green-700">
                                                                <span className="text-gray-600 dark:text-gray-400">Still need: </span>
                                                                <span className="font-bold text-orange-600 dark:text-orange-400">
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
                                        <tr key={row.id} className="bg-blue-25 dark:bg-blue-900/10">
                                            <td colSpan={columns.length} className="px-4 py-2">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                                    <div className="space-y-2">
                                                        {/* Expense header */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">💸</span>
                                                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Expense Details</span>
                                                            </div>
                                                            {item.paychecksLeft !== null && (
                                                                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                                    {item.paychecksLeft === 0 ? 'Due Now!' :
                                                                        item.paychecksLeft > 0 ? `${item.paychecksLeft} paychecks left` : 'Overdue'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Expense details grid */}
                                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Amount</div>
                                                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                                                    ${(parseFloat(item.amount) || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Frequency</div>
                                                                <div className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                                                                    {(item.frequency || 'monthly').replace('-', ' ')}
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-gray-600 dark:text-gray-400">Type</div>
                                                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                                                    {item.isRecurring ? 'Recurring' : 'One-time'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Due date info - inline */}
                                                        {item.dueDate && (
                                                            <div className="text-center text-xs pt-1 border-t border-blue-200 dark:border-blue-700">
                                                                <div className="text-gray-600 dark:text-gray-400">Due Date</div>
                                                                <div className="font-bold text-orange-600 dark:text-orange-400">
                                                                    {new Date(item.dueDate).toLocaleDateString()}
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
                                    <tr
                                        key={row.id}
                                        className={`transition-colors ${isAddRow
                                            ? 'bg-primary-25 hover:bg-primary-50 dark:bg-primary-900/20 dark:hover:bg-primary-800/30'
                                            : isSubItem
                                                ? 'bg-gray-25 hover:bg-gray-50 dark:bg-dark-750 dark:hover:bg-dark-700'
                                                : isInactive
                                                    ? 'bg-gray-50 dark:bg-dark-750 opacity-60'
                                                    : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                                            }`}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td
                                                key={cell.id}
                                                className="px-4 py-2 whitespace-nowrap"
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
                <div className="bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600 dark:text-dark-300">
                            {data.length} categories • {data.reduce((sum, cat) => sum + (cat.subItems?.length || 0), 0)} total items
                        </div>
                        <div className="flex items-center gap-6 text-right">
                            <div>
                                <span className="text-gray-500 dark:text-dark-400">Total Monthly Need: </span>
                                <span className="font-medium text-gray-900 dark:text-dark-100">
                                    {formatCurrency(data.reduce((sum, cat) => sum + cat.monthlyNeed, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-dark-400">Total Allocated: </span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {formatCurrency(data.reduce((sum, cat) => sum + cat.allocated, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-dark-400">Total Available: </span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
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
        </div>
    );
};

export default BudgetCategoriesTable;
