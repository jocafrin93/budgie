import { useBreakpointsContext } from 'app/contexts/breakpoint/context';
import { CheckCircle, Edit, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Mobile Transaction Form Component
const MobileTransactionForm = ({
    isOpen,
    onClose,
    accounts = [],
    categories = [],
    payees = [],
    onAddPayee,
    onSave,
    viewAccount = 'all'
}) => {
    // Get today's date in local timezone
    const getTodayLocalDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        date: getTodayLocalDate(),
        payee: '',
        amount: '',
        categoryId: '',
        accountId: viewAccount !== 'all' ? viewAccount : '',
        memo: '',
        isCleared: false,
        isTransfer: false,
        transferToAccountId: '',
        splits: []
    });

    const [transactionType, setTransactionType] = useState('outflow');
    const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
    const [filteredPayees, setFilteredPayees] = useState(payees);
    const [showSplits, setShowSplits] = useState(false);
    const payeeInputRef = useRef(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: getTodayLocalDate(),
                payee: '',
                amount: '',
                categoryId: '',
                accountId: viewAccount !== 'all' ? viewAccount : '',
                memo: '',
                isCleared: false,
                isTransfer: false,
                transferToAccountId: '',
                splits: []
            });
            setTransactionType('outflow');
            setShowPayeeDropdown(false);
            setShowSplits(false);
        }
    }, [isOpen, viewAccount]);

    // Filter payees based on input
    useEffect(() => {
        if (!formData.payee.trim()) {
            setFilteredPayees(payees);
        } else {
            const filtered = payees.filter(payee =>
                payee.toLowerCase().includes(formData.payee.toLowerCase())
            );
            setFilteredPayees(filtered);
        }
    }, [formData.payee, payees]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.accountId || !formData.amount) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.isTransfer && !formData.transferToAccountId) {
            alert('Please select a transfer destination account');
            return;
        }

        if (!formData.isTransfer && !formData.payee.trim()) {
            alert('Please enter a payee');
            return;
        }

        // Validate split transactions
        if (showSplits && formData.splits.length > 0 && !isBalanced) {
            alert('Split amounts must equal the transaction amount. Please balance the splits or use auto-distribute.');
            return;
        }

        // Prepare transaction data
        const parsedAmount = parseFloat(formData.amount) || 0;
        const finalAmount = transactionType === 'outflow' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

        const transactionData = {
            ...formData,
            amount: finalAmount,
            payee: formData.isTransfer ? '' : formData.payee.trim(),
            isSplit: showSplits && formData.splits.length > 0,
            splits: showSplits ? formData.splits : []
        };

        onSave(transactionData);
        onClose();
    };

    const handlePayeeSelect = (payee) => {
        setFormData(prev => ({ ...prev, payee }));
        setShowPayeeDropdown(false);
    };

    const handleAddNewPayee = () => {
        if (formData.payee.trim() && !payees.includes(formData.payee.trim())) {
            const newPayee = formData.payee.trim();
            onAddPayee?.(newPayee);
            setShowPayeeDropdown(false);
        }
    };

    const showAddPayeeOption = formData.payee.trim() &&
        !payees.some(payee => payee.toLowerCase() === formData.payee.toLowerCase()) &&
        filteredPayees.length === 0;

    // Split transaction calculations
    const splitTotal = formData.splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
    const transactionAmount = parseFloat(formData.amount) || 0;
    const remaining = transactionAmount - splitTotal;
    const isBalanced = Math.abs(remaining) < 0.01;

    // Split transaction functions
    const addSplit = () => {
        setFormData(prev => ({
            ...prev,
            splits: [...prev.splits, { categoryId: '', amount: 0 }]
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

    const autoDistribute = () => {
        if (formData.splits.length === 0 || Math.abs(remaining) < 0.01) return;

        const amountPerSplit = remaining / formData.splits.length;
        setFormData(prev => ({
            ...prev,
            splits: prev.splits.map(split => ({
                ...split,
                amount: (parseFloat(split.amount) || 0) + amountPerSplit
            }))
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200 sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-base-content">Add Transaction</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-base-content" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Transaction Type Toggle */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-base-content">Transaction Type</label>
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

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-base-content">
                            Date <span className="text-error">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                            className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Account */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-base-content">
                            Account <span className="text-error">*</span>
                        </label>
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                            required
                            className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                        >
                            <option value="">Select Account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transfer Toggle */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="isTransfer"
                            checked={formData.isTransfer}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                isTransfer: e.target.checked,
                                payee: e.target.checked ? '' : prev.payee
                            }))}
                            className="form-checkbox-rounded this:info"
                        />
                        <label htmlFor="isTransfer" className="text-sm font-medium text-base-content">
                            This is a transfer
                        </label>
                    </div>

                    {/* Transfer To Account */}
                    {formData.isTransfer && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-base-content">
                                Transfer To Account <span className="text-error">*</span>
                            </label>
                            <select
                                value={formData.transferToAccountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, transferToAccountId: e.target.value }))}
                                required
                                className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                            >
                                <option value="">Select Account</option>
                                {accounts.filter(acc => acc.id !== formData.accountId).map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Payee - Only show for non-transfers */}
                    {!formData.isTransfer && (
                        <div className="space-y-2 relative">
                            <label className="block text-sm font-medium text-base-content">
                                Payee <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={payeeInputRef}
                                    type="text"
                                    value={formData.payee}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, payee: e.target.value }));
                                        setShowPayeeDropdown(true);
                                    }}
                                    onFocus={() => setShowPayeeDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowPayeeDropdown(false), 200)}
                                    placeholder="Enter payee name..."
                                    required
                                    className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                />

                                {/* Payee Dropdown */}
                                {showPayeeDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                        {filteredPayees.length > 0 && (
                                            <div>
                                                {filteredPayees.map((payee, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handlePayeeSelect(payee)}
                                                        className="w-full px-3 py-2 text-left hover:bg-base-200 text-base-content transition-colors first:rounded-t-lg last:rounded-b-lg"
                                                    >
                                                        {payee}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {showAddPayeeOption && (
                                            <button
                                                type="button"
                                                onClick={handleAddNewPayee}
                                                className="w-full px-3 py-2 text-left hover:bg-base-200 text-info transition-colors border-t border-base-300 flex items-center space-x-2"
                                            >
                                                <span>+</span>
                                                <span>Add &#34;{formData.payee}&#34;</span>
                                            </button>
                                        )}

                                        {filteredPayees.length === 0 && !showAddPayeeOption && formData.payee.trim() && (
                                            <div className="px-3 py-2 text-base-content/60 text-sm">
                                                No payees found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-base-content">
                            Amount <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                required
                                className="w-full pl-8 pr-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Category - Only show for non-transfers */}
                    {!formData.isTransfer && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-base-content">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Memo */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-base-content">Memo</label>
                        <input
                            type="text"
                            value={formData.memo}
                            onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                            placeholder="Optional memo..."
                            className="w-full px-3 py-3 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Cleared Status */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="isCleared"
                            checked={formData.isCleared}
                            onChange={(e) => setFormData(prev => ({ ...prev, isCleared: e.target.checked }))}
                            className="form-checkbox-rounded this:success"
                        />
                        <label htmlFor="isCleared" className="text-sm font-medium text-base-content">
                            Mark as cleared
                        </label>
                    </div>

                    {/* Split Transaction Toggle - Only show for non-transfers */}
                    {!formData.isTransfer && (
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="showSplits"
                                checked={showSplits}
                                onChange={(e) => {
                                    setShowSplits(e.target.checked);
                                    if (!e.target.checked) {
                                        setFormData(prev => ({ ...prev, splits: [] }));
                                    }
                                }}
                                className="form-checkbox-rounded this:warning"
                            />
                            <label htmlFor="showSplits" className="text-sm font-medium text-base-content">
                                Split transaction across categories
                            </label>
                        </div>
                    )}

                    {/* Split Transaction Section */}
                    {showSplits && !formData.isTransfer && (
                        <div className="space-y-4 border-t border-base-300 pt-4">
                            {/* Split Balance Indicator */}
                            <div className="bg-base-200 p-3 rounded-lg">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-base-content/60">Transaction Amount:</span>
                                    <span className="font-semibold">${parseFloat(formData.amount) || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-base-content/60">Split Total:</span>
                                    <span className="font-semibold">${splitTotal}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-base-content/60">Remaining:</span>
                                    <span className={`font-semibold ${isBalanced ? 'text-success' : 'text-error'}`}>
                                        ${remaining}
                                    </span>
                                </div>
                                {!isBalanced && (
                                    <div className="mt-2 text-xs text-warning">
                                        ⚠️ Splits must equal transaction amount
                                    </div>
                                )}
                            </div>

                            {/* Split Rows */}
                            <div className="space-y-3">
                                {formData.splits.map((split, index) => (
                                    <div key={index} className="bg-base-100 border border-base-300 rounded-lg p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-base-content">Split {index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSplit(index)}
                                                className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <select
                                            value={split.categoryId}
                                            onChange={(e) => updateSplit(index, 'categoryId', e.target.value)}
                                            className="w-full px-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={split.amount}
                                                onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Split Actions */}
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={addSplit}
                                    className="flex-1 py-2 px-3 bg-base-300 text-base-content rounded-lg text-sm font-medium hover:bg-base-200 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Split</span>
                                </button>
                                {formData.splits.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={autoDistribute}
                                        className="flex-1 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        Auto-Distribute
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex space-x-3 pt-6 pb-4 border-t border-base-300">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-base-300 text-base-content rounded-lg font-medium hover:bg-base-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Add Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MobileTransactionsView = ({
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
}) => {
    const { mdAndDown } = useBreakpointsContext();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showScheduledTransactions, setShowScheduledTransactions] = useState(true);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(Math.abs(amount));
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
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

    // Check if a transaction is reconciled
    const isTransactionReconciled = (transaction) => {
        if (!transaction.isCleared) return false;
        const account = accounts.find(acc => acc.id === transaction.accountId);
        if (!account || !account.lastReconciledDate) return false;
        const transactionDate = new Date(transaction.date);
        const reconciledDate = new Date(account.lastReconciledDate);
        return transactionDate <= reconciledDate;
    };

    // Handle cleared status toggle
    const handleToggleCleared = (transactionId, currentStatus) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

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

    // Handle delete with transfer linking
    const handleDeleteTransaction = (transaction) => {
        if (transaction.isTransfer && transaction.transferToAccountId) {
            const linkedTransaction = transactions.find(t =>
                String(t.transferToAccountId) === String(transaction.accountId) &&
                String(t.accountId) === String(transaction.transferToAccountId) &&
                t.id !== transaction.id &&
                t.isTransfer
            );

            onDeleteTransaction(transaction.id);
            if (linkedTransaction) {
                onDeleteTransaction(linkedTransaction.id);
            }
        } else {
            onDeleteTransaction(transaction.id);
        }
    };

    // Filter and group transactions by date
    const groupedTransactions = useMemo(() => {
        // Filter transactions by account if specified
        const filteredTransactions = viewAccount === 'all'
            ? transactions
            : transactions.filter(t => String(t.accountId) === String(viewAccount));

        // Sort transactions by date (newest first)
        const sortedTransactions = [...filteredTransactions].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        // Group by date
        const grouped = {};
        sortedTransactions.forEach(transaction => {
            const dateKey = transaction.date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(transaction);
        });

        return grouped;
    }, [transactions, viewAccount]);

    // Calculate daily totals
    const getDayTotal = (dayTransactions) => {
        return dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    };

    // Selection handlers
    const handleToggleSelection = (transactionId) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(transactionId)) {
            newSelected.delete(transactionId);
        } else {
            newSelected.add(transactionId);
        }
        setSelectedTransactions(newSelected);

        // Exit selection mode if no transactions are selected
        if (newSelected.size === 0) {
            setIsSelectionMode(false);
        }
    };

    const handleSelectAll = () => {
        const allTransactionIds = Object.values(groupedTransactions)
            .flat()
            .map(t => t.id);
        setSelectedTransactions(new Set(allTransactionIds));
    };

    const handleClearSelection = () => {
        setSelectedTransactions(new Set());
        setIsSelectionMode(false);
    };

    const handleBulkDelete = () => {
        if (selectedTransactions.size === 0) return;

        const confirmMessage = `Are you sure you want to delete ${selectedTransactions.size} selected transaction${selectedTransactions.size > 1 ? 's' : ''}? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            // Process each selected transaction
            selectedTransactions.forEach(transactionId => {
                const transaction = transactions.find(t => t.id === transactionId);
                if (transaction) {
                    handleDeleteTransaction(transaction);
                }
            });

            // Clear selection after deletion
            handleClearSelection();
        }
    };

    const selectedCount = selectedTransactions.size;

    if (!mdAndDown) {
        // Return null on desktop - this component is mobile-only
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="space-y-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-base-content">
                            Transactions
                        </h2>
                        <p className="text-sm text-base-content/60">
                            {viewAccount === 'all' ? 'All Accounts' : getAccountName(viewAccount)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isSelectionMode ? (
                            <>
                                <button
                                    onClick={() => setIsSelectionMode(true)}
                                    className="flex items-center gap-2 bg-base-300 hover:bg-base-200 text-base-content px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Select
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleSelectAll}
                                    className="flex items-center gap-2 bg-base-300 hover:bg-base-200 text-base-content px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={handleClearSelection}
                                    className="flex items-center gap-2 bg-base-300 hover:bg-base-200 text-base-content px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Account Filter */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-base-content flex-shrink-0">
                        Filter by Account:
                    </label>
                    <select
                        value={viewAccount}
                        onChange={(e) => {
                            // Since this component doesn't control viewAccount directly,
                            // we need to emit an event or call a callback
                            // For now, we'll use a custom event that the parent can listen to
                            const event = new CustomEvent('accountFilterChange', {
                                detail: { accountId: e.target.value }
                            });
                            window.dispatchEvent(event);
                        }}
                        className="flex-1 px-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:outline-none focus:border-primary text-sm"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Delete Bar - Only show when transactions are selected */}
            {selectedCount > 0 && (
                <div className="bg-error-lighter/20 border border-error rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="text-error">
                            <span className="font-medium">{selectedCount} transaction{selectedCount > 1 ? 's' : ''} selected</span>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-error hover:bg-error/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Scheduled Transactions Section */}
            {scheduledTransactions && scheduledTransactions.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
                    {/* Scheduled Header */}
                    <div className="bg-warning/10 border-b border-base-300">
                        <button
                            onClick={() => setShowScheduledTransactions(!showScheduledTransactions)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-warning/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-warning">
                                    ⏰
                                </div>
                                <div>
                                    <h3 className="font-medium text-base-content">
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

                    {/* Scheduled Transactions List */}
                    {showScheduledTransactions && (
                        <div className="divide-y divide-base-300">
                            {scheduledTransactions.map(scheduledTxn => {
                                const dueDate = new Date(scheduledTxn.nextDueDate || scheduledTxn.dueDate);
                                const isOverdue = dueDate < new Date();
                                const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

                                return (
                                    <div
                                        key={scheduledTxn.id}
                                        className={`relative flex items-center p-4 ${isOverdue ? 'border-l-4 border-l-error bg-error/5' : 'border-l-4 border-l-warning bg-warning/5'}`}
                                    >
                                        {/* Left side - Transaction details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                {/* Schedule indicator */}
                                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${isOverdue ? 'bg-error text-white' : 'bg-warning text-white'}`}>
                                                    ⏰
                                                </div>

                                                {/* Payee */}
                                                <div className="font-medium text-base-content truncate">
                                                    {scheduledTxn.payee || 'No Payee'}
                                                </div>

                                                {/* Due status */}
                                                <div className={`text-xs px-2 py-1 rounded-full ${isOverdue
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

                                            {/* Memo and Category */}
                                            <div className="space-y-1">
                                                {scheduledTxn.memo && (
                                                    <div className="text-sm text-base-content/70 truncate">
                                                        {scheduledTxn.memo}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-base-200 text-base-content/60">
                                                        {getCategoryName(scheduledTxn.categoryId)}
                                                    </span>
                                                    <span className="text-xs text-base-content/60">
                                                        {getAccountName(scheduledTxn.accountId)}
                                                    </span>
                                                    <span className="text-xs text-base-content/60">
                                                        • {scheduledTxn.frequency}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side - Amount and actions */}
                                        <div className="flex items-center gap-3 ml-4">
                                            {/* Amount */}
                                            <div className={`text-right font-semibold ${scheduledTxn.amount >= 0
                                                ? 'text-success'
                                                : 'text-error'
                                                }`}>
                                                <div className="text-base">
                                                    {scheduledTxn.amount >= 0 ? '+' : '-'}{formatCurrency(scheduledTxn.amount)}
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-1">
                                                {/* Activate Early */}
                                                <button
                                                    onClick={() => onActivateScheduledTransactionEarly?.(scheduledTxn.id)}
                                                    className="p-2 text-success hover:bg-success/10 rounded transition-colors"
                                                    title="Activate Now"
                                                >
                                                    ▶
                                                </button>

                                                {/* Skip */}
                                                <button
                                                    onClick={() => onSkipScheduledTransaction?.(scheduledTxn.id)}
                                                    className="p-2 text-warning hover:bg-warning/10 rounded transition-colors"
                                                    title="Skip This Occurrence"
                                                >
                                                    ⏭
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => onEditScheduledTransaction?.(scheduledTxn.id, scheduledTxn)}
                                                    className="p-2 text-base-content/60 hover:text-base-content transition-colors"
                                                    title="Edit Schedule"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => onDeleteScheduledTransaction?.(scheduledTxn.id)}
                                                    className="p-2 text-base-content/60 hover:text-error transition-colors"
                                                    title="Delete Schedule"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Transactions grouped by day */}
            <div className="space-y-4">
                {Object.keys(groupedTransactions).length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-base-content/60 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-base-content mb-2">
                            No transactions yet
                        </h3>
                        <p className="text-base-content/60 mb-4">
                            Start by adding your first transaction
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Add Transaction
                        </button>
                    </div>
                ) : (
                    Object.entries(groupedTransactions).map(([date, dayTransactions]) => {
                        const dayTotal = getDayTotal(dayTransactions);

                        return (
                            <div key={date} className="bg-base-100 rounded-lg shadow-sm border border-base-300 overflow-hidden">
                                {/* Day Header */}
                                <div className="bg-base-200 px-4 py-3 border-b border-base-300">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-base-content">
                                            {formatDate(date)}
                                        </h3>
                                        <div className={`text-sm font-semibold ${dayTotal >= 0
                                            ? 'text-success'
                                            : 'text-error'
                                            }`}>
                                            {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                                        </div>
                                    </div>
                                </div>

                                {/* Transactions for this day */}
                                <div className="divide-y divide-base-300">
                                    {dayTransactions.map(transaction => {
                                        const isTransfer = transaction.isTransfer || transaction.transferToAccountId;
                                        const isSplit = transaction.isSplit || (transaction.splits && transaction.splits.length > 0);
                                        const isReconciled = isTransactionReconciled(transaction);
                                        const isCleared = transaction.isCleared;

                                        return (
                                            <div
                                                key={transaction.id}
                                                className={`relative flex items-center p-4 ${!isCleared ? 'border-l-4 border-l-orange-400' : ''
                                                    } ${isSelectionMode ? 'pl-2' : ''}`}
                                            >
                                                {/* Selection checkbox - Only show in selection mode */}
                                                {isSelectionMode && (
                                                    <div className="flex-shrink-0 mr-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTransactions.has(transaction.id)}
                                                            onChange={() => handleToggleSelection(transaction.id)}
                                                            className="form-checkbox-rounded this:info"
                                                        />
                                                    </div>
                                                )}

                                                {/* Left side - Payee and details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {/* Cleared status indicator */}
                                                        <button
                                                            onClick={() => handleToggleCleared(transaction.id, isCleared)}
                                                            className="flex-shrink-0"
                                                        >
                                                            <CheckCircle
                                                                className={`w-5 h-5 ${isCleared
                                                                    ? 'text-success'
                                                                    : 'text-base-content/60'
                                                                    }`}
                                                            />
                                                        </button>

                                                        {/* Payee */}
                                                        <div className="font-medium text-base-content truncate">
                                                            {transaction.payee || 'No Payee'}
                                                        </div>

                                                        {/* Reconciled indicator */}
                                                        {isReconciled && (
                                                            <div className="text-info text-xs">
                                                                🔒
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Memo and Category */}
                                                    <div className="space-y-1">
                                                        {transaction.memo && (
                                                            <div className="text-sm text-base-content/70 truncate">
                                                                {transaction.memo}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            {isTransfer ? (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-info/10 text-info">
                                                                    Transfer
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-base-200 text-base-content/60">
                                                                    {isSplit ? 'Multiple' : getCategoryName(transaction.categoryId)}
                                                                </span>
                                                            )}
                                                            {viewAccount === 'all' && (
                                                                <span className="text-xs text-base-content/60">
                                                                    {getAccountName(transaction.accountId)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right side - Amount and actions */}
                                                <div className="flex items-center gap-3 ml-4">
                                                    {/* Amount */}
                                                    <div className={`text-right font-semibold ${transaction.amount >= 0
                                                        ? 'text-success'
                                                        : 'text-error'
                                                        }`}>
                                                        <div className="text-base">
                                                            {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => onEditTransaction(transaction)}
                                                            className="p-2 text-base-content/60 hover:text-base-content transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction)}
                                                            className="p-2 text-base-content/60 hover:text-error transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mobile Transaction Form Modal */}
            {showAddModal && (
                <MobileTransactionForm
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    accounts={accounts}
                    categories={categories}
                    payees={payees}
                    onAddPayee={onAddPayee}
                    onSave={onAddTransaction}
                    viewAccount={viewAccount}
                />
            )}
        </div>
    );
};

export default MobileTransactionsView;
