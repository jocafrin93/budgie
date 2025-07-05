import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
    TbEdit,
    TbPlus,
    TbTrash
} from 'react-icons/tb';

// UI Components
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Input,
    Select,
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
import CurrencyField from 'components/form/CurrencyField';

// Transaction Form Modal Component
const TransactionFormModal = ({
    isOpen,
    onClose,
    transaction,
    accounts,
    categories,
    onSave,
    isEdit = false
}) => {
    const [formData, setFormData] = useState(transaction || {
        date: new Date().toISOString().split('T')[0],
        payee: '',
        amount: 0,
        categoryId: '',
        accountId: '',
        memo: '',
        isCleared: false,
        splits: [],
        isTransfer: false,
        transferToAccountId: ''
    });

    const [showSplits, setShowSplits] = useState(false);
    const [isTransfer, setIsTransfer] = useState(formData.isTransfer || false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const addSplit = () => {
        setFormData(prev => ({
            ...prev,
            splits: [...prev.splits, { categoryId: '', amount: 0, memo: '' }]
        }));
    };

    const updateSplit = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            splits: prev.splits.map((split, i) =>
                i === index ? { ...split, [field]: value } : split
            )
        }));
    };

    const removeSplit = (index) => {
        setFormData(prev => ({
            ...prev,
            splits: prev.splits.filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
                        </h2>
                        <Button onClick={onClose} variant="flat" isIcon>
                            ×
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Transaction Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                            />

                            <Select
                                label="Account"
                                value={formData.accountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <Input
                            label="Payee"
                            value={formData.payee}
                            onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                            required
                        />

                        {/* Transfer Toggle */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={isTransfer}
                                onChange={(e) => {
                                    setIsTransfer(e.target.checked);
                                    setFormData(prev => ({ ...prev, isTransfer: e.target.checked }));
                                }}
                            />
                            <label>This is a transfer</label>
                        </div>

                        {/* Transfer To Account */}
                        {isTransfer && (
                            <Select
                                label="Transfer To Account"
                                value={formData.transferToAccountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, transferToAccountId: e.target.value }))}
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts.filter(acc => acc.id !== formData.accountId).map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </Select>
                        )}

                        {/* Amount */}
                        <CurrencyField
                            label="Amount"
                            value={formData.amount}
                            onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                            required
                        />

                        {/* Category (not for transfers) */}
                        {!isTransfer && (
                            <Select
                                label="Category"
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Select>
                        )}

                        <Input
                            label="Memo"
                            value={formData.memo}
                            onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                        />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={formData.isCleared}
                                onChange={(e) => setFormData(prev => ({ ...prev, isCleared: e.target.checked }))}
                            />
                            <label>Cleared</label>
                        </div>

                        {/* Split Transaction Section */}
                        {!isTransfer && (
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium">Split Transaction</h3>
                                    <Button
                                        type="button"
                                        onClick={() => setShowSplits(!showSplits)}
                                        variant="flat"
                                        size="sm"
                                    >
                                        {showSplits ? 'Hide Splits' : 'Add Splits'}
                                    </Button>
                                </div>

                                {showSplits && (
                                    <div className="space-y-3">
                                        {formData.splits.map((split, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded">
                                                <Select
                                                    value={split.categoryId}
                                                    onChange={(e) => updateSplit(index, 'categoryId', e.target.value)}
                                                    placeholder="Category"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </Select>

                                                <CurrencyField
                                                    value={split.amount}
                                                    onChange={(value) => updateSplit(index, 'amount', value)}
                                                    placeholder="Amount"
                                                />

                                                <Input
                                                    value={split.memo}
                                                    onChange={(e) => updateSplit(index, 'memo', e.target.value)}
                                                    placeholder="Memo"
                                                />

                                                <Button
                                                    type="button"
                                                    onClick={() => removeSplit(index)}
                                                    variant="flat"
                                                    isIcon
                                                    className="text-red-500"
                                                >
                                                    <TbTrash />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            onClick={addSplit}
                                            variant="flat"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <TbPlus className="mr-2" />
                                            Add Split
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button type="button" onClick={onClose} variant="flat">
                                Cancel
                            </Button>
                            <Button type="submit" variant="solid">
                                {isEdit ? 'Update' : 'Save'} Transaction
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

// Main TransactionsTab Component
export default function TransactionsTab({
    transactions = [],
    accounts = [],
    categories = [],
    onAddTransaction,
    onEditTransaction,
    onDeleteTransaction,
    viewAccount = 'all'
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [tableSettings, setTableSettings] = useState({
        enableColumnFilters: true,
        enableSorting: true,
        enableRowDense: false,
        enableFullScreen: false
    });

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
    };

    // Get account name
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'Unknown';
    };

    // Get category name
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Unknown';
    };

    // Table columns definition
    const columns = useMemo(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
            enableSorting: false,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'date',
            header: 'Date',
            label: 'Date',
            filter: 'dateRange',
            cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            }),
        },
        {
            accessorKey: 'payee',
            header: 'Payee',
            label: 'Payee',
            cell: ({ getValue }) => (
                <div className="font-medium">{getValue()}</div>
            ),
        },
        {
            accessorKey: 'categoryId',
            header: 'Category',
            label: 'Category',
            filter: 'select',
            options: categories.map(cat => ({ value: cat.id, label: cat.name })),
            cell: ({ getValue }) => (
                <Badge variant="soft" className="text-xs">
                    {getCategoryName(getValue())}
                </Badge>
            ),
        },
        {
            accessorKey: 'accountId',
            header: 'Account',
            label: 'Account',
            filter: 'select',
            options: accounts.map(acc => ({ value: acc.id, label: acc.name })),
            cell: ({ getValue }) => getAccountName(getValue()),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            label: 'Amount',
            filter: 'numberRange',
            cell: ({ getValue }) => (
                <div className={`font-medium ${getValue() < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {getValue() < 0 ? '-' : '+'}{formatCurrency(getValue())}
                </div>
            ),
        },
        {
            accessorKey: 'isCleared',
            header: 'Status',
            label: 'Status',
            filter: 'select',
            options: [
                { value: true, label: 'Cleared' },
                { value: false, label: 'Pending' }
            ],
            cell: ({ getValue }) => (
                <Badge variant={getValue() ? 'success' : 'warning'} className="text-xs">
                    {getValue() ? 'Cleared' : 'Pending'}
                </Badge>
            ),
        },
        {
            accessorKey: 'memo',
            header: 'Memo',
            label: 'Memo',
            cell: ({ getValue }) => (
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-32">
                    {getValue() || '—'}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => {
                            setEditingTransaction(row.original);
                            setShowModal(true);
                        }}
                        variant="flat"
                        size="sm"
                        isIcon
                        title="Edit Transaction"
                    >
                        <TbEdit className="size-4" />
                    </Button>
                    <Button
                        onClick={() => onDeleteTransaction(row.original.id)}
                        variant="flat"
                        size="sm"
                        isIcon
                        className="text-red-500"
                        title="Delete Transaction"
                    >
                        <TbTrash className="size-4" />
                    </Button>
                </div>
            ),
        },
    ], [accounts, categories, onDeleteTransaction]);

    // Filter transactions by account if specified
    const filteredTransactions = useMemo(() => {
        if (viewAccount === 'all') return transactions;
        return transactions.filter(t => t.accountId === viewAccount);
    }, [transactions, viewAccount]);

    // Initialize table
    const table = useReactTable({
        data: filteredTransactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableRowSelection: true,
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
        meta: {
            setTableSettings,
        },
        state: {
            tableSettings,
        },
    });

    // Handle form submission
    const handleSaveTransaction = (transactionData) => {
        if (editingTransaction) {
            onEditTransaction({ ...transactionData, id: editingTransaction.id });
        } else {
            onAddTransaction(transactionData);
        }
        setEditingTransaction(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTransaction(null);
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Transactions
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage your financial transactions
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => setShowModal(true)}
                        variant="solid"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <TbPlus className="size-4" />
                        <span>Add Transaction</span>
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table
                        hoverable
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
                                <Tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                    <PaginationSection table={table} />
                </div>
            </Card>

            {/* Transaction Form Modal */}
            <TransactionFormModal
                isOpen={showModal}
                onClose={handleCloseModal}
                transaction={editingTransaction}
                accounts={accounts}
                categories={categories}
                onSave={handleSaveTransaction}
                isEdit={!!editingTransaction}
            />
        </div>
    );
}
