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
    TbTrash,
    TbPlayerSkipForward,
    TbPlayerPlay
} from 'react-icons/tb';
import { LuCalendarClock } from 'react-icons/lu';

// Import PayeeAutocomplete

// UI Components
import {
    Badge,
    Button,
    Card,
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

// Date utilities

// Inline Icon Swap Components
const CircleCheck = ({ className = "w-5 h-5", checked = false, ...props }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        {...props}
    >
        <circle cx="12" cy="12" r="10" className={checked ? "text-success" : "text-base-content/60"} />
        <path d="m9 12 2 2 4-4" className={checked ? "text-success" : "text-base-content/60"} />
    </svg>
);

const IconSwap = ({ isOn, onChange, onIcon, offIcon, className = "" }) => (
    <button
        type="button"
        onClick={() => onChange(!isOn)}
        className={`relative inline-grid place-content-center cursor-pointer transition-colors ${className}`}
        title={isOn ? "Mark as Pending" : "Mark as Cleared"}
    >
        <div className={`col-start-1 row-start-1 transition-opacity duration-300 ${isOn ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {onIcon}
        </div>
        <div className={`col-start-1 row-start-1 transition-opacity duration-300 ${!isOn ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {offIcon}
        </div>
    </button>
);

// Inline PayeeAutocomplete Component with Tab functionality
const PayeeAutocompleteInline = ({
    label,
    value,
    onChange,
    payees = [],
    onAddPayee,
    placeholder = "Enter payee name...",
    required = false,
    disabled = false,
    ...props
}) => {
    // Debug payees array
    console.log('🔍 PayeeAutocomplete Debug:', {
        payeesLength: payees.length,
        payees: payees,
        payeesType: typeof payees,
        isArray: Array.isArray(payees)
    });
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
                <label className="block text-sm font-medium text-base-content mb-1">
                    {label}
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => !disabled && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`w-full px-3 py-2 pr-10 border border-base-300 rounded-lg 
                             bg-base-100 
                             text-base-content
                             placeholder:text-base-content/60
                             focus:outline-none focus:border-primary
                             transition-colors
                             ${disabled ? 'opacity-50 cursor-not-allowed bg-base-200' : ''}`}
                    {...props}
                />

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/60 hover"
                >
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Existing payees */}
                    {filteredPayees.length > 0 && (
                        <div>
                            {filteredPayees.map((payee, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPayee(payee)}
                                    className="w-full px-3 py-2 text-left hover 
                                             text-base-content transition-colors
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
                            className="w-full px-3 py-2 text-left hover 
                                     text-info transition-colors
                                     border-t border-base-300 flex items-center space-x-2"
                        >
                            <span>+</span>
                            <span>&#34;Add {inputValue}&quot;</span>
                        </button>
                    )}

                    {/* No results */}
                    {filteredPayees.length === 0 && !showAddOption && inputValue.trim() && (
                        <div className="px-3 py-2 text-base-content/60 text-sm">
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
    isEdit = false,
    viewAccount = 'all'
}) => {
    // Get today's date in local timezone to avoid timezone issues
    const getTodayLocalDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState(transaction || {
        date: getTodayLocalDate(),
        payee: '',
        amount: '',
        categoryId: '',
        accountId: '',
        memo: '',
        isCleared: false,
        splits: [],
        isTransfer: false,
        transferToAccountId: ''
    });

    const [showSplits, setShowSplits] = useState(false);
    const [isTransfer, setIsTransfer] = useState(false); // Always start as false for new transactions
    const [transactionType, setTransactionType] = useState('outflow'); // 'inflow' or 'outflow'

    // Update form data when transaction prop changes (for editing)
    useEffect(() => {
        if (transaction) {
            // Editing existing transaction
            setFormData(transaction);
            setIsTransfer(transaction.isTransfer || false);
            setTransactionType(transaction.amount >= 0 ? 'inflow' : 'outflow');
            setShowSplits(transaction.isSplit || (transaction.splits && transaction.splits.length > 0));
        } else {
            // New transaction - reset to clean defaults with account defaulting
            const defaultAccountId = viewAccount && viewAccount !== 'all' ? viewAccount : '';
            const cleanDefaults = {
                date: getTodayLocalDate(),
                payee: '',
                amount: '',
                categoryId: '',
                accountId: defaultAccountId,
                memo: '',
                isCleared: false,
                splits: [],
                isTransfer: false,
                transferToAccountId: ''
            };
            setFormData(cleanDefaults);
            setIsTransfer(false);
            setTransactionType('outflow');
            setShowSplits(false);
        }
    }, [transaction, isOpen, viewAccount]); // Add viewAccount dependency

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
        const parsedAmount = parseFloat(formData.amount) || 0;
        const finalAmount = transactionType === 'outflow' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

        const transactionData = {
            ...formData,
            amount: finalAmount,
            isSplit: showSplits && formData.splits.length > 0,
            transferAccountId: isTransfer ? formData.transferToAccountId : undefined
        };

        // Debug logging for "to-be-allocated" transactions
        console.log('🔥 TRANSACTION FORM SUBMIT DEBUG:', {
            formData,
            transactionType,
            categoryId: formData.categoryId,
            isToBeAllocated: formData.categoryId === 'to-be-allocated',
            finalTransactionData: transactionData
        });

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/50 backdrop-blur-sm transition-opacity">
            <Card skin="shadow" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
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
                                className="border-base-300 bg-base-100 text-base-content"
                            />

                            <Select
                                label="Account"
                                value={formData.accountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                required
                                className="border-base-300 bg-base-100 text-base-content"
                            >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {/* Payee Autocomplete - Disabled for transfers */}
                        <PayeeAutocompleteInline
                            label="Payee"
                            value={formData.payee}
                            onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                            payees={payees}
                            onAddPayee={onAddPayee}
                            placeholder={isTransfer ? "Transfer (no payee needed)" : "Enter payee name..."}
                            required={!isTransfer}
                            disabled={isTransfer}
                        />

                        {/* Transaction Type Toggle */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-base-content mb-2">Transaction Type</label>
                                <div className="flex rounded-lg overflow-hidden border border-base-300">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('outflow')}
                                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${transactionType === 'outflow'
                                            ? 'bg-error text-white'
                                            : 'bg-base-200 text-base-content hover:bg-base-300'
                                            }`}
                                    >
                                        💸 Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('inflow')}
                                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${transactionType === 'inflow'
                                            ? 'bg-success text-white'
                                            : 'bg-base-200 text-base-content hover:bg-base-300'
                                            }`}
                                    >
                                        💰 Income
                                    </button>
                                </div>

                            </div>

                            {/* Transfer Toggle */}
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isTransfer"
                                    checked={isTransfer}
                                    onChange={(e) => {
                                        const isTransferChecked = e.target.checked;
                                        setIsTransfer(isTransferChecked);
                                        setFormData(prev => ({
                                            ...prev,
                                            isTransfer: isTransferChecked,
                                            payee: isTransferChecked ? '' : prev.payee // Clear payee when transfer is selected
                                        }));
                                    }}
                                    className="form-checkbox-rounded this:info"
                                />
                                <label htmlFor="isTransfer" className="text-sm font-medium text-base-content">
                                    This is a transfer
                                </label>
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
                                    {accounts.filter(acc => {
                                        // Enhanced filtering with type coercion and debugging
                                        const isFiltered = String(acc.id) !== String(formData.accountId);
                                        console.log('🔍 Transfer Account Filter:', {
                                            accountId: acc.id,
                                            accountName: acc.name,
                                            sourceAccountId: formData.accountId,
                                            isFiltered,
                                            accountIdType: typeof acc.id,
                                            sourceAccountIdType: typeof formData.accountId
                                        });
                                        return isFiltered;
                                    }).map(account => (
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
                                className="border-base-300 bg-base-100 text-base-content"
                            />

                            {/* Category (not for transfers) */}
                            {!isTransfer && (
                                <Select
                                    label="Category"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                    className="border-base-300 bg-base-100 text-base-content"
                                >
                                    <option value="">Select Category</option>
                                    {transactionType === 'inflow' && (
                                        <option value="to-be-allocated">💰 To Be Allocated</option>
                                    )}
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
                                className="border-base-300 bg-base-100 text-base-content"
                            />

                            <div className="flex items-center space-x-3">
                                <label className="text-sm font-medium text-base-content">Status</label>
                                <IconSwap
                                    isOn={formData.isCleared}
                                    onChange={(newStatus) => setFormData(prev => ({ ...prev, isCleared: newStatus }))}
                                    onIcon={<CircleCheck className="w-5 h-5" checked={true} />}
                                    offIcon={<CircleCheck className="w-5 h-5" checked={false} />}
                                    className="p-1"
                                />
                                <span className="text-sm text-base-content/60">
                                    {formData.isCleared ? 'Cleared' : 'Pending'}
                                </span>
                            </div>

                            {/* Split Transaction Section */}
                            {!isTransfer && (
                                <div className="border-t pt-4">
                                    <div className="flex items-center gap2 mb-4">
                                        <Button
                                            type="button"
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => {
                                                const newShowSplits = !showSplits;
                                                setShowSplits(newShowSplits);
                                                // Automatically add first split when enabling splits
                                                if (newShowSplits && formData.splits.length === 0) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        splits: [{ categoryId: '', amount: 0, memo: '' }]
                                                    }));
                                                }
                                            }}

                                            size="sm"
                                        >
                                            {showSplits ? 'Hide Splits' : 'Split Transaction'}
                                        </Button>
                                    </div>

                                    {showSplits && (
                                        <div className="space-y-4">
                                            {/* Balance Indicator */}
                                            <div className="bg-base-200 p-4 rounded-lg">
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div className="text-center">
                                                        <div className="text-base-content/60">Transaction Amount</div>
                                                        <div className="font-bold text-lg">{formatCurrency(formData.amount)}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-base-content/60">Total Splits</div>
                                                        <div className="font-bold text-lg">{formatCurrency(splitValidation.totalSplitAmount)}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-base-content/60">Remaining</div>
                                                        <div className={`font-bold text-lg ${splitValidation.isBalanced ? 'text-success' : 'text-error'}`}>
                                                            {formatCurrency(splitValidation.remainingToAllocate)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Balance Status */}
                                                {!splitValidation.isBalanced && (
                                                    <div className="mt-3 p-3 bg-warning/20er/20 border border-warning-light rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-warning">⚠️</span>
                                                            <span className="text-sm text-warning-dark">
                                                                Fix splits {splitValidation.isOverAllocated ? 'Over-allocated' : 'Under-allocated'} by {formatCurrency(Math.abs(splitValidation.remainingToAllocate))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Success Status */}
                                                {splitValidation.isBalanced && formData.splits.length > 0 && (
                                                    <div className="mt-3 p-3 bg-success-lighter/20 border border-success-light rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-success">✅</span>
                                                            <span className="text-sm text-success-dark">
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
                                                        Auto-Distribute
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={adjustTransactionAmount}
                                                        variant="outlined"
                                                        className="w-full"
                                                    >
                                                        Adjust Total
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={clearAllSplits}
                                                        variant="outlined"
                                                        className="w-full text-error hover"
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Split Rows */}
                                            <div className="space-y-3">
                                                {formData.splits.map((split, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-3 p-3 border rounded items-center">
                                                        {/* Category - 4 columns */}
                                                        <div className="col-span-4">
                                                            <Select
                                                                value={split.categoryId}
                                                                onChange={(e) => updateSplit(index, 'categoryId', e.target.value)}
                                                                placeholder="Category"
                                                                className="w-full"
                                                            >
                                                                <option value="">Select Category</option>
                                                                {categories.map(category => (
                                                                    <option key={category.id} value={category.id}>
                                                                        {category.name}
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                        </div>

                                                        {/* Amount - 2 columns */}
                                                        <div className="col-span-2">
                                                            <CurrencyField
                                                                value={split.amount}
                                                                onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                                                                placeholder="Amount"
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        {/* Percentage Display - 1 column */}
                                                        <div className="col-span-1 flex items-center justify-center text-sm text-base-content/60">
                                                            {formData.amount > 0 ? `${((split.amount / formData.amount) * 100).toFixed(1)}%` : '0%'}
                                                        </div>

                                                        {/* Memo - 4 columns */}
                                                        <div className="col-span-4">
                                                            <Input
                                                                value={split.memo}
                                                                onChange={(e) => updateSplit(index, 'memo', e.target.value)}
                                                                placeholder="Memo"
                                                                className="w-full bg-base-100"
                                                            />
                                                        </div>

                                                        {/* Delete Button - 1 column */}
                                                        <div className="col-span-1 flex justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSplit(index)}
                                                                className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                                                                title="Remove split"
                                                            >
                                                                <TbTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    onClick={addSplit}
                                                    variant="outlined"
                                                    color="primary"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <TbPlus className="w-4 h-4" />
                                                    Add Split
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-outline-secondary btn-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                >
                                    {isEdit ? 'Update' : 'Save'} Transaction
                                </button>
                            </div>
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
    viewAccount = 'all',
    // Scheduled transactions props
    scheduledTransactions = [],
    onEditScheduledTransaction,
    onSkipScheduledTransaction,
    onActivateScheduledTransactionEarly,
    onDeleteScheduledTransaction
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [tableSettings, setTableSettings] = useState({
        enableColumnFilters: true,
        enableSorting: true,
        enableRowDense: true,
        enableFullScreen: true
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showScheduledTransactions, setShowScheduledTransactions] = useState(true);

    // Listen for events from the main page
    useEffect(() => {
        const handleToggleFilters = () => {
            setShowFilters(prev => !prev);
        };

        const handleAddTransaction = () => {
            setShowModal(true);
        };

        window.addEventListener('toggleFilters', handleToggleFilters);
        window.addEventListener('addTransaction', handleAddTransaction);

        return () => {
            window.removeEventListener('toggleFilters', handleToggleFilters);
            window.removeEventListener('addTransaction', handleAddTransaction);
        };
    }, []);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
    };

    // Check if a transaction is reconciled (cleared and account has been reconciled after transaction date)
    const isTransactionReconciled = (transaction) => {
        if (!transaction.isCleared) return false;

        const account = accounts.find(acc => acc.id === transaction.accountId);
        if (!account || !account.lastReconciledDate) return false;

        const transactionDate = new Date(transaction.date);
        const reconciledDate = new Date(account.lastReconciledDate);

        return transactionDate <= reconciledDate;
    };

    // Handle cleared status toggle with reconciliation warning
    const handleToggleCleared = (transactionId, currentStatus) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Check if transaction is reconciled
        if (isTransactionReconciled(transaction)) {
            const shouldProceed = window.confirm(
                '⚠️ This transaction has been reconciled!\n\n' +
                'Changing its cleared status may affect your reconciliation accuracy. ' +
                'Are you sure you want to proceed?'
            );
            if (!shouldProceed) return;
        }

        onEditTransaction({ ...transaction, isCleared: !currentStatus });
    };

    // Handle linked deletion for transfer transactions
    const handleDeleteTransaction = (transaction) => {
        console.log('🗑️ DELETE TRANSACTION CALLED:', {
            transaction,
            isTransfer: transaction.isTransfer,
            transferToAccountId: transaction.transferToAccountId,
            hasTransferData: !!(transaction.isTransfer && transaction.transferToAccountId)
        });

        // Check if this is a transfer transaction
        if (transaction.isTransfer && transaction.transferToAccountId) {
            console.log('🔍 SEARCHING FOR LINKED TRANSACTION:', {
                searchCriteria: {
                    transferToAccountId: transaction.accountId,
                    accountId: transaction.transferToAccountId,
                    excludeId: transaction.id
                },
                allTransactions: transactions.map(t => ({
                    id: t.id,
                    accountId: t.accountId,
                    transferToAccountId: t.transferToAccountId,
                    isTransfer: t.isTransfer,
                    amount: t.amount
                }))
            });

            // Find the linked transaction with enhanced debugging
            const linkedTransaction = transactions.find(t => {
                const transferToMatches = String(t.transferToAccountId) === String(transaction.accountId);
                const accountMatches = String(t.accountId) === String(transaction.transferToAccountId);
                const idDifferent = t.id !== transaction.id;
                const isTransferFlag = t.isTransfer;

                console.log('🔍 CHECKING TRANSACTION FOR DELETE:', {
                    transactionId: t.id,
                    transferToAccountId: t.transferToAccountId,
                    accountId: t.accountId,
                    isTransfer: t.isTransfer,
                    checks: {
                        transferToMatches,
                        accountMatches,
                        idDifferent,
                        isTransferFlag
                    },
                    overallMatch: transferToMatches && accountMatches && idDifferent && isTransferFlag
                });

                return transferToMatches && accountMatches && idDifferent && isTransferFlag;
            });

            console.log('🗑️ DELETE OPERATION DETAILS:', {
                mainTransaction: transaction,
                linkedTransaction,
                willDeleteBoth: !!linkedTransaction,
                linkedTransactionFound: !!linkedTransaction
            });

            // Delete the main transaction
            console.log('🗑️ DELETING MAIN TRANSACTION:', transaction.id);
            onDeleteTransaction(transaction.id);

            // Delete the linked transaction if found
            if (linkedTransaction) {
                console.log('🗑️ DELETING LINKED TRANSACTION:', linkedTransaction.id);
                onDeleteTransaction(linkedTransaction.id);
                console.log('✅ DELETED BOTH TRANSFER TRANSACTIONS');
            } else {
                console.warn('⚠️ COULD NOT FIND LINKED TRANSFER TRANSACTION TO DELETE:', {
                    searchedFor: {
                        transferToAccountId: transaction.accountId,
                        accountId: transaction.transferToAccountId,
                        excludeId: transaction.id,
                        mustBeTransfer: true
                    },
                    availableTransactions: transactions.filter(t => t.isTransfer).map(t => ({
                        id: t.id,
                        accountId: t.accountId,
                        transferToAccountId: t.transferToAccountId,
                        isTransfer: t.isTransfer
                    }))
                });
            }
        } else {
            // Regular transaction deletion
            console.log('🗑️ DELETING REGULAR TRANSACTION:', transaction.id);
            onDeleteTransaction(transaction.id);
        }
    };

    // Table columns definition
    const columns = useMemo(() => {
        // Get account name
        const getAccountName = (accountId) => {
            const account = accounts.find(acc => acc.id === accountId);
            return account ? account.name : 'Unknown';
        };

        // Get category name - ensure numeric comparison
        const getCategoryName = (categoryId) => {
            if (!categoryId) return 'Uncategorized';
            const category = categories.find(cat => Number(cat.id) === Number(categoryId));
            return category ? category.name : 'Unknown';
        };

        return [
            {
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        className="form-checkbox-rounded this:secondary"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        className="form-checkbox-rounded this:secondary"
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
                cell: ({ getValue }) => {
                    // Use local date formatting to avoid timezone issues
                    const date = new Date(getValue() + 'T00:00:00'); // Force local timezone
                    return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                    });
                },
            },
            {
                accessorKey: 'payee',
                header: 'Payee',
                label: 'Payee',
                cell: ({ getValue }) => (
                    <div className="font-medium">{getValue() || '—'}</div>
                ),
            },
            {
                accessorKey: 'categoryId',
                header: 'Category',
                label: 'Category',
                filter: 'select',
                options: categories.map(cat => ({ value: cat.id, label: cat.name })),
                cell: ({ getValue, row }) => {
                    // Check if this is a transfer
                    const isTransfer = row.original.isTransfer || row.original.transferToAccountId;
                    // Check if this is a split transaction
                    const isSplit = row.original.isSplit || (row.original.splits && row.original.splits.length > 0);
                    // Check if this is "to-be-allocated"
                    const isToBeAllocated = getValue() === 'to-be-allocated';

                    if (isTransfer) {
                        return (
                            <Badge variant="soft" color="info" className="text-xs">
                                Transfer
                            </Badge>
                        );
                    }

                    if (isToBeAllocated) {
                        return (
                            <Badge variant="soft" color="success" className="text-xs">
                                💰 To Be Allocated
                            </Badge>
                        );
                    }

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
                    <div className={`font-medium ${getValue() < 0 ? 'text-error' : 'text-success'}`}>
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
                cell: ({ getValue, row }) => {
                    const isReconciled = isTransactionReconciled(row.original);
                    return (
                        <div className="flex items-center space-x-1">
                            <IconSwap
                                isOn={getValue()}
                                onChange={() => handleToggleCleared(row.original.id, getValue())}
                                onIcon={<CircleCheck className="w-5 h-5" checked={true} />}
                                offIcon={<CircleCheck className="w-5 h-5" checked={false} />}
                                className="p-1"
                            />
                            {isReconciled && (
                                <div
                                    className="text-info"
                                    title="This transaction has been reconciled"
                                >
                                    🔒
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'memo',
                header: 'Memo',
                label: 'Memo',
                cell: ({ getValue }) => (
                    <div className="text-sm text-base-content/60 truncate max-w-32">
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
                            onClick={() => handleDeleteTransaction(row.original)}
                            variant="flat"
                            size="sm"
                            isIcon
                            className="text-error"
                            title="Delete Transaction"
                        >
                            <TbTrash className="size-4" />
                        </Button>
                    </div>
                ),
            },
        ];
    }, [accounts, categories, handleDeleteTransaction, isTransactionReconciled]);

    // Filter transactions by account if specified - ensure numeric comparison
    const filteredTransactions = useMemo(() => {
        if (viewAccount === 'all') return transactions;
        return transactions.filter(t => Number(t.accountId) === Number(viewAccount));
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
            sorting: [
                {
                    id: 'date',
                    desc: true // Sort by date descending (newest first)
                }
            ],
        },
        meta: {
            setTableSettings,
        },
        state: {
            tableSettings,
        },
    });

    // Get selected rows for bulk operations
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedCount === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedCount} selected transaction${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            // Process each selected transaction
            selectedRows.forEach(row => {
                handleDeleteTransaction(row.original);
            });

            // Clear selection after deletion
            table.resetRowSelection();
        }
    };

    // Listen for bulk delete events from main page
    useEffect(() => {
        const handleBulkDeleteRequest = () => {
            handleBulkDelete();
        };

        window.addEventListener('bulkDelete', handleBulkDeleteRequest);

        return () => {
            window.removeEventListener('bulkDelete', handleBulkDeleteRequest);
        };
    }, [selectedRows, handleBulkDelete, handleDeleteTransaction]);

    // Update header actions in main page when selection changes
    useEffect(() => {
        const headerActionsContainer = document.getElementById('transaction-header-actions');
        if (headerActionsContainer) {
            // Remove existing bulk delete button
            const existingBulkButton = headerActionsContainer.querySelector('#bulk-delete-button');
            if (existingBulkButton) {
                existingBulkButton.remove();
            }

            // Add bulk delete button if transactions are selected
            if (selectedCount > 0) {
                const bulkDeleteButton = document.createElement('button');
                bulkDeleteButton.id = 'bulk-delete-button';
                bulkDeleteButton.className = 'btn btn-error btn-sm flex items-center space-x-2';
                bulkDeleteButton.innerHTML = `
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    <span>Delete ${selectedCount}</span>
                `;
                bulkDeleteButton.onclick = () => {
                    const event = new CustomEvent('bulkDelete');
                    window.dispatchEvent(event);
                };

                // Insert before the filter button
                const filterButton = headerActionsContainer.querySelector('button');
                headerActionsContainer.insertBefore(bulkDeleteButton, filterButton);
            }
        }
    }, [selectedCount]);

    // Handle form submission
    const handleSaveTransaction = (transactionData) => {
        if (editingTransaction) {
            // Check if this is editing a transfer transaction
            if (editingTransaction.isTransfer && editingTransaction.transferToAccountId) {
                // Update the main transaction
                const updatedTransaction = { ...transactionData, id: editingTransaction.id };
                onEditTransaction(updatedTransaction);

                // Enhanced linked transaction finding with debugging
                console.log('🔍 Looking for linked transaction:', {
                    editingTransaction,
                    searchCriteria: {
                        transferToAccountId: editingTransaction.accountId,
                        accountId: editingTransaction.transferToAccountId,
                        excludeId: editingTransaction.id
                    },
                    allTransactions: transactions.map(t => ({
                        id: t.id,
                        accountId: t.accountId,
                        transferToAccountId: t.transferToAccountId,
                        isTransfer: t.isTransfer,
                        amount: t.amount
                    }))
                });

                const linkedTransaction = transactions.find(t => {
                    const matches = String(t.transferToAccountId) === String(editingTransaction.accountId) &&
                        String(t.accountId) === String(editingTransaction.transferToAccountId) &&
                        t.id !== editingTransaction.id &&
                        t.isTransfer;

                    console.log('🔍 Checking transaction:', {
                        transactionId: t.id,
                        transferToAccountId: t.transferToAccountId,
                        accountId: t.accountId,
                        isTransfer: t.isTransfer,
                        matches
                    });

                    return matches;
                });

                if (linkedTransaction) {
                    // Enhanced account lookup for proper payee names
                    const sourceAccount = accounts.find(acc => String(acc.id) === String(transactionData.accountId));

                    // Parse the amount to ensure it's a number
                    const parsedAmount = parseFloat(transactionData.amount) || 0;

                    // Update the linked transaction with opposite amount and proper payee
                    const updatedLinkedTransaction = {
                        ...linkedTransaction,
                        amount: -parsedAmount, // Opposite sign with parsed amount
                        date: transactionData.date, // Keep dates in sync
                        memo: transactionData.memo, // Keep memos in sync
                        isCleared: transactionData.isCleared, // Keep status in sync
                        payee: sourceAccount?.name || sourceAccount?.accountName || `Account ${transactionData.accountId}`,
                        // Maintain the transfer relationship
                        transferToAccountId: transactionData.accountId,
                        isTransfer: true,
                        categoryId: 'transfer'
                    };

                    console.log('🔗 Updating linked transfer transaction:', {
                        originalTransaction: editingTransaction,
                        updatedTransaction,
                        linkedTransaction,
                        updatedLinkedTransaction,
                        parsedAmount,
                        oppositeAmount: -parsedAmount
                    });

                    onEditTransaction(updatedLinkedTransaction);
                } else {
                    console.warn('⚠️ Could not find linked transfer transaction for:', editingTransaction);
                }
            } else {
                // Regular transaction edit
                onEditTransaction({ ...transactionData, id: editingTransaction.id });
            }
        } else {
            // Check if this is a transfer and create inverse transaction
            if (transactionData.isTransfer && transactionData.transferToAccountId) {
                // Enhanced account lookup with type coercion
                const sourceAccount = accounts.find(acc => String(acc.id) === String(transactionData.accountId));
                const destinationAccount = accounts.find(acc => String(acc.id) === String(transactionData.transferToAccountId));

                // Debug account lookup
                console.log('🔍 Transfer Debug:', {
                    sourceAccountId: transactionData.accountId,
                    destinationAccountId: transactionData.transferToAccountId,
                    sourceAccount,
                    destinationAccount,
                    allAccounts: accounts,
                    accountsStructure: accounts.map(acc => ({ id: acc.id, name: acc.name, type: typeof acc.id }))
                });

                // Update main transaction to have destination account as payee
                const mainTransaction = {
                    ...transactionData,
                    payee: destinationAccount?.name || destinationAccount?.accountName || `Account ${transactionData.transferToAccountId}`,
                    categoryId: 'transfer' // Use 'transfer' as category identifier
                };
                onAddTransaction(mainTransaction);

                // Create the inverse transaction for the destination account
                const inverseTransaction = {
                    ...transactionData,
                    id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                    accountId: transactionData.transferToAccountId,
                    transferToAccountId: transactionData.accountId,
                    amount: -transactionData.amount, // Opposite sign
                    payee: sourceAccount?.name || sourceAccount?.accountName || `Account ${transactionData.accountId}`, // Source account as payee
                    categoryId: 'transfer', // Use 'transfer' as category identifier
                    isTransfer: true
                };

                // Add the inverse transaction
                onAddTransaction(inverseTransaction);
            } else {
                // Regular transaction
                onAddTransaction(transactionData);
            }
        }
        setEditingTransaction(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTransaction(null);
        // Reset form state for next new transaction
        setTimeout(() => {
            // This ensures the modal state is fully reset after closing
        }, 100);
    };

    return (
        <div className="space-y-4">
            {/* Scheduled Transactions Section */}
            {scheduledTransactions && scheduledTransactions.length > 0 && (
                <Card className="overflow-hidden">
                    {/* Scheduled Header */}
                    <div className="bg-warning/10 border-b border-base-300">
                        <button
                            onClick={() => setShowScheduledTransactions(!showScheduledTransactions)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-warning/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <LuCalendarClock className="w-8 h-8 text-base-content" />
                                <div>
                                    <h3 className="font-semibold text-base-content">
                                        Scheduled Transactions
                                    </h3>
                                    <p className="text-sm text-base-content/60">
                                        {scheduledTransactions.length} upcoming transaction{scheduledTransactions.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-base-content/60">
                                {showScheduledTransactions ? '▼' : '▶'}
                            </div>
                        </button>
                    </div>

                    {/* Scheduled Transactions Table */}
                    {showScheduledTransactions && (
                        <div className="overflow-x-auto">
                            <Table hoverable className="min-w-full">
                                <THead>
                                    <Tr>
                                        <Th>Due Date</Th>
                                        <Th>Payee</Th>
                                        <Th>Category</Th>
                                        <Th>Account</Th>
                                        <Th>Amount</Th>
                                        <Th>Frequency</Th>
                                        <Th>Status</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {scheduledTransactions
                                        .sort((a, b) => {
                                            // Sort by due date ascending (soonest first, which will appear at bottom)
                                            const dateA = new Date((a.nextDueDate || a.dueDate) + 'T00:00:00');
                                            const dateB = new Date((b.nextDueDate || b.dueDate) + 'T00:00:00');
                                            return dateA - dateB;
                                        })
                                        .map(scheduledTxn => {
                                            // Use local timezone parsing like the rest of the app
                                            const dueDate = new Date((scheduledTxn.nextDueDate || scheduledTxn.dueDate) + 'T00:00:00');
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0); // Reset to start of day

                                            const isOverdue = dueDate < today;
                                            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                                            // Get account and category names
                                            const getAccountName = (accountId) => {
                                                const account = accounts.find(acc => acc.id === accountId);
                                                return account ? account.name : 'Unknown';
                                            };

                                            const getCategoryName = (categoryId) => {
                                                if (!categoryId) return 'Uncategorized';

                                                // Regular category lookup using numeric comparison
                                                const category = categories.find(cat => Number(cat.id) === Number(categoryId));

                                                return category ? category.name : 'Unknown';
                                            };

                                            return (
                                                <Tr
                                                    key={scheduledTxn.id}
                                                    className={`${isOverdue ? 'border-l-4 border-l-error bg-error/5' : 'border-l-4 border-l-warning bg-warning/5'}`}
                                                >
                                                    {/* Due Date */}
                                                    <Td>
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-base-content">
                                                                {dueDate.toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: '2-digit',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${isOverdue
                                                                ? 'bg-error/20 text-error'
                                                                : daysDiff === 0
                                                                    ? 'bg-warning/20 text-warning'
                                                                    : 'bg-info/20 text-info'
                                                                }`}>
                                                                {isOverdue
                                                                    ? 'Overdue'
                                                                    : daysDiff === 0
                                                                        ? 'Due Today'
                                                                        : `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`
                                                                }
                                                            </div>
                                                        </div>
                                                    </Td>

                                                    {/* Payee */}
                                                    <Td>
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-base-content">
                                                                {scheduledTxn.payee || 'No Payee'}
                                                            </div>
                                                            {scheduledTxn.memo && (
                                                                <div className="text-sm text-base-content/60 truncate max-w-32">
                                                                    {scheduledTxn.memo}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Td>

                                                    {/* Category */}
                                                    <Td>
                                                        <Badge variant="soft" className="text-xs">
                                                            {getCategoryName(scheduledTxn.categoryId, scheduledTxn)}
                                                        </Badge>
                                                    </Td>

                                                    {/* Account */}
                                                    <Td>
                                                        <div className="text-sm text-base-content">
                                                            {getAccountName(scheduledTxn.accountId)}
                                                        </div>
                                                    </Td>

                                                    {/* Amount */}
                                                    <Td>
                                                        <div className={`font-semibold ${scheduledTxn.amount >= 0
                                                            ? 'text-success'
                                                            : 'text-error'
                                                            }`}>
                                                            {scheduledTxn.amount >= 0 ? '+' : '-'}{formatCurrency(scheduledTxn.amount)}
                                                        </div>
                                                    </Td>

                                                    {/* Frequency */}
                                                    <Td>
                                                        <div className="text-sm text-base-content/60">
                                                            {scheduledTxn.frequency}
                                                        </div>
                                                    </Td>

                                                    {/* Status */}
                                                    <Td>
                                                        <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-error' : 'text-warning'}`}>
                                                            <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-error' : 'bg-warning'}`}></div>
                                                            Scheduled
                                                        </div>
                                                    </Td>

                                                    {/* Actions */}
                                                    <Td>
                                                        <div className="flex items-center gap-1">
                                                            {/* Activate Early */}
                                                            <Button
                                                                onClick={() => onActivateScheduledTransactionEarly?.(scheduledTxn.id)}
                                                                variant="flat"
                                                                size="sm"
                                                                isIcon
                                                                className="text-base-content/60 hover:text-base-content"
                                                                title="Activate Now"
                                                            >
                                                                <TbPlayerPlay className="size-4" />
                                                            </Button>

                                                            {/* Skip */}
                                                            <Button
                                                                onClick={() => onSkipScheduledTransaction?.(scheduledTxn.id)}
                                                                variant="flat"
                                                                size="sm"
                                                                isIcon
                                                                className="text-base-content/60 hover:text-base-content"
                                                                title="Skip This Occurrence"
                                                            >
                                                                <TbPlayerSkipForward className="size-4" />
                                                            </Button>

                                                            {/* Edit */}
                                                            <Button
                                                                onClick={() => onEditScheduledTransaction?.(scheduledTxn.id, scheduledTxn)}
                                                                variant="flat"
                                                                size="sm"
                                                                isIcon
                                                                className="text-base-content/60 hover:text-base-content"
                                                                title="Edit Schedule"
                                                            >
                                                                <TbEdit className="size-4" />
                                                            </Button>

                                                            {/* Delete */}
                                                            <Button
                                                                onClick={() => onDeleteScheduledTransaction?.(scheduledTxn.id)}
                                                                variant="flat"
                                                                size="sm"
                                                                isIcon
                                                                className="text-base-content/60 hover:text-base-content"
                                                                title="Delete Schedule"
                                                            >
                                                                <TbTrash className="size-4" />
                                                            </Button>
                                                        </div>
                                                    </Td>
                                                </Tr>
                                            );
                                        })}
                                </TBody>
                            </Table>
                        </div>
                    )}
                </Card>
            )}


            {/* Table Container */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table
                        hoverable
                        zebra
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
                                                tableSettings.enableColumnFilters &&
                                                showFilters && (
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
                                <Tr key={row.id} className="hover">
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
                <div className="border-t border-base-300 px-4 py-3">
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
                viewAccount={viewAccount}
            />
        </div>
    );
}
