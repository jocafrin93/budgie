import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    TbEdit,
    TbPlus,
    TbTrash
} from 'react-icons/tb';

// Import PayeeAutocomplete

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

// Inline PayeeAutocomplete Component with Tab functionality
const PayeeAutocompleteInline = ({
    label,
    value,
    onChange,
    payees = [],
    onAddPayee,
    placeholder = "Enter payee name...",
    required = false,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredPayees, setFilteredPayees] = useState(payees);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Filter payees based on input
    useEffect(() => {
        if (!inputValue.trim()) {
            setFilteredPayees(payees);
        } else {
            const filtered = payees.filter(payee =>
                payee.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredPayees(filtered);
        }
    }, [inputValue, payees]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(e);
        setIsOpen(true);
    };

    const handleSelectPayee = (payee) => {
        setInputValue(payee);
        onChange?.({ target: { value: payee } });
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleAddNewPayee = () => {
        if (inputValue.trim() && !payees.includes(inputValue.trim())) {
            const newPayee = inputValue.trim();
            onAddPayee?.(newPayee);
            handleSelectPayee(newPayee);
        }
    };

    const handleKeyDown = (e) => {
        console.log('🔑 TRANSACTIONS - Key pressed:', e.key, {
            inputValue,
            filteredPayees,
            isOpen,
            filteredPayeesLength: filteredPayees.length
        });

        if (e.key === 'Enter') {
            console.log('✅ TRANSACTIONS - Enter key processing...');
            e.preventDefault();

            const exactMatch = filteredPayees.find(payee =>
                payee.toLowerCase() === inputValue.toLowerCase()
            );

            if (exactMatch) {
                console.log('✅ TRANSACTIONS - Exact match:', exactMatch);
                handleSelectPayee(exactMatch);
            } else if (inputValue.trim() && filteredPayees.length === 0) {
                console.log('✅ TRANSACTIONS - Adding new payee:', inputValue.trim());
                handleAddNewPayee();
            } else if (filteredPayees.length > 0) {
                console.log('✅ TRANSACTIONS - Selecting first option:', filteredPayees[0]);
                handleSelectPayee(filteredPayees[0]);
            }
        } else if (e.key === 'Tab') {
            console.log('🔥 TRANSACTIONS - TAB KEY DETECTED!', {
                filteredPayeesLength: filteredPayees.length,
                inputValueTrimmed: inputValue.trim(),
                isOpen,
                conditions: {
                    hasFilteredPayees: filteredPayees.length > 0,
                    hasInputValue: !!inputValue.trim(),
                    dropdownIsOpen: isOpen
                }
            });

            if (filteredPayees.length > 0 && inputValue.trim() && isOpen) {
                console.log('🚀 TRANSACTIONS - TAB CONDITIONS MET!');
                e.preventDefault();
                e.stopPropagation();

                const startsWithMatch = filteredPayees.find(payee =>
                    payee.toLowerCase().startsWith(inputValue.toLowerCase())
                );

                const bestMatch = startsWithMatch || filteredPayees[0];
                console.log('🎯 TRANSACTIONS - Best match:', bestMatch, {
                    startsWithMatch,
                    firstFiltered: filteredPayees[0]
                });

                handleSelectPayee(bestMatch);

                setTimeout(() => {
                    console.log('🔄 TRANSACTIONS - Cleanup complete');
                    setIsOpen(false);
                    inputRef.current?.blur();
                }, 0);
            } else {
                console.log('❌ TRANSACTIONS - TAB CONDITIONS NOT MET:', {
                    hasFilteredPayees: filteredPayees.length > 0,
                    hasInputValue: !!inputValue.trim(),
                    dropdownIsOpen: isOpen
                });
            }
        } else if (e.key === 'Escape') {
            console.log('🔄 TRANSACTIONS - Escape key');
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const showAddOption = inputValue.trim() &&
        !payees.some(payee => payee.toLowerCase() === inputValue.toLowerCase()) &&
        filteredPayees.length === 0;

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    className="w-full px-3 py-2 pr-10 border border-gray-400 dark:border-gray-500 rounded-lg 
                             bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-gray-100
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             transition-colors"
                    {...props}
                />

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Existing payees */}
                    {filteredPayees.length > 0 && (
                        <div>
                            {filteredPayees.map((payee, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPayee(payee)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 
                                             text-gray-900 dark:text-gray-100 transition-colors
                                             first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {payee}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Add new payee option */}
                    {showAddOption && (
                        <button
                            type="button"
                            onClick={handleAddNewPayee}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 
                                     text-blue-600 dark:text-blue-400 transition-colors
                                     border-t border-gray-200 dark:border-gray-600 flex items-center space-x-2"
                        >
                            <span>+</span>
                            <span>Add `&quot;`{inputValue}`&quot;`</span>
                        </button>
                    )}

                    {/* No results */}
                    {filteredPayees.length === 0 && !showAddOption && inputValue.trim() && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                            No payees found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Transaction Form Modal Component
const TransactionFormModal = ({
    isOpen,
    onClose,
    transaction,
    accounts,
    categories,
    payees = [],
    onAddPayee,
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
    const [transactionType, setTransactionType] = useState('outflow'); // 'inflow' or 'outflow'

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Calculate split validation
    const splitValidation = useMemo(() => {
        if (!showSplits || formData.splits.length === 0) {
            return {
                isBalanced: true,
                difference: 0,
                totalSplitAmount: 0,
                isOverAllocated: false,
                remainingToAllocate: formData.amount || 0
            };
        }

        const totalSplitAmount = formData.splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
        const transactionAmount = parseFloat(formData.amount) || 0;
        const difference = transactionAmount - totalSplitAmount;
        const isBalanced = Math.abs(difference) < 0.01; // Account for floating point precision

        return {
            isBalanced,
            difference,
            totalSplitAmount,
            isOverAllocated: totalSplitAmount > transactionAmount,
            remainingToAllocate: difference
        };
    }, [formData.amount, formData.splits, showSplits]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate split balance before saving
        if (showSplits && formData.splits.length > 0 && !splitValidation.isBalanced) {
            alert('Split amounts must equal the transaction amount. Please balance the splits or use auto-distribute.');
            return;
        }

        // Prepare transaction data with proper amount sign based on transaction type
        const finalAmount = transactionType === 'outflow' ? -Math.abs(formData.amount) : Math.abs(formData.amount);

        const transactionData = {
            ...formData,
            amount: finalAmount,
            isSplit: showSplits && formData.splits.length > 0,
            transferAccountId: isTransfer ? formData.transferToAccountId : undefined
        };

        onSave(transactionData);
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

    // Auto-distribute functions
    const distributeEvenly = () => {
        if (formData.splits.length === 0) return;

        const remainingAmount = splitValidation.remainingToAllocate;
        if (Math.abs(remainingAmount) < 0.01) return; // Already balanced

        const amountPerSplit = remainingAmount / formData.splits.length;

        setFormData(prev => ({
            ...prev,
            splits: prev.splits.map(split => ({
                ...split,
                amount: (parseFloat(split.amount) || 0) + amountPerSplit
            }))
        }));
    };


    const adjustTransactionAmount = () => {
        setFormData(prev => ({
            ...prev,
            amount: splitValidation.totalSplitAmount
        }));
    };

    const clearAllSplits = () => {
        setFormData(prev => ({
            ...prev,
            splits: prev.splits.map(split => ({
                ...split,
                amount: 0
            }))
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
                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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

                        {/* Payee Autocomplete - Using inline component to avoid import issues */}
                        <PayeeAutocompleteInline
                            label="Payee"
                            value={formData.payee}
                            onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                            payees={payees}
                            onAddPayee={onAddPayee}
                            placeholder="Enter payee name..."
                            required
                        />

                        {/* Transaction Type Toggle */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="transactionType"
                                            value="outflow"
                                            checked={transactionType === 'outflow'}
                                            onChange={(e) => setTransactionType(e.target.value)}
                                            className="text-red-600"
                                        />
                                        <span className="text-red-600">💸 Outflow (Expense)</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="transactionType"
                                            value="inflow"
                                            checked={transactionType === 'inflow'}
                                            onChange={(e) => setTransactionType(e.target.value)}
                                            className="text-green-600"
                                        />
                                        <span className="text-green-600">💰 Inflow (Income)</span>
                                    </label>
                                </div>
                            </div>

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
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
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
                                    <div className="space-y-4">
                                        {/* Balance Indicator */}
                                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="text-gray-600 dark:text-gray-400">Transaction Amount</div>
                                                    <div className="font-bold text-lg">{formatCurrency(formData.amount)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-gray-600 dark:text-gray-400">Total Splits</div>
                                                    <div className="font-bold text-lg">{formatCurrency(splitValidation.totalSplitAmount)}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-gray-600 dark:text-gray-400">Remaining</div>
                                                    <div className={`font-bold text-lg ${splitValidation.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(splitValidation.remainingToAllocate)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Balance Status */}
                                            {!splitValidation.isBalanced && (
                                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                                                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                                                            Fix splits {splitValidation.isOverAllocated ? 'Over-allocated' : 'Under-allocated'} by {formatCurrency(Math.abs(splitValidation.remainingToAllocate))}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Success Status */}
                                            {splitValidation.isBalanced && formData.splits.length > 0 && (
                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-green-600 dark:text-green-400">✅</span>
                                                        <span className="text-sm text-green-800 dark:text-green-200">
                                                            Splits are perfectly balanced!
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Auto-Balance Actions - Outside the callout */}
                                        {formData.splits.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 justify-center">
                                                <Button
                                                    type="button"
                                                    onClick={distributeEvenly}
                                                    variant="filled"
                                                    color="primary"
                                                    className="w-full"
                                                >
                                                    Auto-Distribute Evenly
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={adjustTransactionAmount}
                                                    variant="outlined"
                                                    className="w-full"
                                                >
                                                    Adjust Transaction Amount
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={clearAllSplits}
                                                    variant="outlined"
                                                    className="w-full text-red-600 hover:text-red-700"
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                        )}

                                        {/* Split Rows */}
                                        <div className="space-y-3">
                                            {formData.splits.map((split, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded">
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
                                                        onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                                                        placeholder="Amount"
                                                    />

                                                    {/* Percentage Display */}
                                                    <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                                                        {formData.amount > 0 ? `${((split.amount / formData.amount) * 100).toFixed(1)}%` : '0%'}
                                                    </div>

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
                                        </div>

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
                            <Button type="button" onClick={onClose} variant="filled" color="secondary">
                                Cancel
                            </Button>
                            <Button type="submit"
                                variant="filled"
                                color="primary">
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
    payees = [],
    onAddPayee,
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

    // Table columns definition
    const columns = useMemo(() => {
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

        return [
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
                    <div className="font-mediumxs">{getValue()}</div>
                ),
            },
            {
                accessorKey: 'categoryId',
                header: 'Category',
                label: 'Category',
                filter: 'select',
                options: categories.map(cat => ({ value: cat.id, label: cat.name })),
                cell: ({ getValue, row }) => {
                    // Check if this is a split transaction
                    const isSplit = row.original.isSplit || (row.original.splits && row.original.splits.length > 0);

                    return (
                        <Badge variant="soft" className="text-xs">
                            {isSplit ? 'Multiple' : getCategoryName(getValue())}
                        </Badge>
                    );
                },
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
        ];
    }, [accounts, categories, onDeleteTransaction]);

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
                        variant="filled"
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
                payees={payees}
                onAddPayee={onAddPayee}
                onSave={handleSaveTransaction}
                isEdit={!!editingTransaction}
            />
        </div>
    );
}
