import { useBreakpointsContext } from 'app/contexts/breakpoint/context';
import { CheckCircle, Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const MobileTransactionsView = ({
    transactions = [],
    accounts = [],
    categories = [],
    // payees = [],
    // onAddPayee,
    // onAddTransaction,
    onEditTransaction,
    onDeleteTransaction,
    viewAccount = 'all'
}) => {
    const { mdAndDown } = useBreakpointsContext();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

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
            : transactions.filter(t => t.accountId === viewAccount);

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
            <div className="flex items-center justify-between mb-4">
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
                                className="flex items-center gap-2 bg-base-300 hover text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Select
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-info/60 hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSelectAll}
                                className="flex items-center gap-2 bg-base-300 hover text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleClearSelection}
                                className="flex items-center gap-2 bg-base-300 hover text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Bulk Delete Bar - Only show when transactions are selected */}
            {selectedCount > 0 && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="text-error-dark">
                            <span className="font-medium">{selectedCount} transaction{selectedCount > 1 ? 's' : ''} selected</span>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-error hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
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
                            className="bg-info/60 hover text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
                                <div className="bg-base-200 bg-base-200 px-4 py-3 border-b border-base-300">
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
                                <div className="divide-y divide-gray-200">
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
                                                            className="p-2 text-base-content/60 hover transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction)}
                                                            className="p-2 text-base-content/60 hover transition-colors"
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

            {/* Add Transaction Modal - Placeholder for now */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-base-content/50 backdrop-blur-sm transition-opacity md:items-center">
                    <div className="bg-base-100 rounded-t-lg md:rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden md:max-h-[80vh] mb-16 md:mb-0">
                        <div className="p-4 text-center">
                            <h3 className="text-lg font-semibold text-base-content mb-4">
                                Add Transaction
                            </h3>
                            <p className="text-base-content/60 mb-4">
                                Transaction form will be integrated here
                            </p>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="mt-4 px-4 py-2 bg-base-300 text-white rounded-lg hover transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileTransactionsView;
