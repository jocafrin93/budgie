import { Page } from "components/shared/Page";
import React, { useEffect, useState } from "react";
import AccountBalanceSidebar from "../../../../components/budget/AccountBalanceSidebar";
import TransactionsTab from "../../../../components/budget/TransactionsTab";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

// Quick Reconcile Modal Component
const QuickReconcileModal = ({ account, transactions, onClose, onReconcile }) => {
    const [bankBalance, setBankBalance] = useState(0);

    // Currency field logic (from CurrencyField component)
    const formatDisplayValue = (numericValue) => {
        if (numericValue === '' || numericValue === null || numericValue === undefined) {
            return '';
        }

        const num = typeof numericValue === 'number' ? numericValue : parseFloat(numericValue);
        if (isNaN(num)) return '';

        return num.toFixed(2);
    };

    const formatCentsInput = (centsString) => {
        // Remove any non-digit characters
        const digitsOnly = centsString.replace(/[^0-9]/g, '');

        if (digitsOnly === '') return '';

        // Convert to cents, then to dollars
        const cents = parseInt(digitsOnly, 10);
        const dollars = cents / 100;

        return dollars.toFixed(2);
    };

    const handleCurrencyChange = (e) => {
        const inputValue = e.target.value;

        // If user is typing digits, treat as cents input
        if (/^\d+$/.test(inputValue.replace(/[^0-9]/g, ''))) {
            const formattedValue = formatCentsInput(inputValue);
            setBankBalance(parseFloat(formattedValue) || 0);
        } else {
            // Handle direct decimal input (like copy/paste)
            let cleanValue = inputValue.replace(/[^0-9.]/g, '');

            // Ensure only one decimal point
            const parts = cleanValue.split('.');
            if (parts.length > 2) {
                cleanValue = parts[0] + '.' + parts.slice(1).join('');
            }

            // Limit to 2 decimal places
            if (parts[1] && parts[1].length > 2) {
                cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
            }

            setBankBalance(parseFloat(cleanValue) || 0);
        }
    };

    // Calculate account balances
    const calculateBalances = (account, transactions) => {
        if (!account) return { workingBalance: 0, clearedBalance: 0, pendingBalance: 0 };

        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const startingBalance = account.startingBalance || account.balance || 0;

        const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const clearedBalance = startingBalance + accountTransactions
            .filter(t => t.isCleared)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingBalance = workingBalance - clearedBalance;

        return { workingBalance, clearedBalance, pendingBalance };
    };

    const balances = calculateBalances(account, transactions);
    const difference = bankBalance - balances.clearedBalance;
    const isBalanced = Math.abs(difference) < 0.01;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isBalanced) {
            onReconcile(account.id, bankBalance);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Quick Reconcile: {account.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Bank Balance Input */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bank Statement Balance
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                $
                            </span>
                            <input
                                type="text"
                                value={formatDisplayValue(bankBalance)}
                                onChange={handleCurrencyChange}
                                required
                                placeholder="0.00"
                                className="w-full pl-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                            Enter the balance shown on your bank statement or online banking.
                        </p>
                    </div>

                    {/* Balance Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Working Balance</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(balances.workingBalance)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">All transactions</div>
                        </div>

                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-green-600 dark:text-green-400">Cleared Balance</div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                {formatCurrency(balances.clearedBalance)}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400">Cleared transactions</div>
                        </div>

                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
                            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                                {formatCurrency(balances.pendingBalance)}
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">Uncleared transactions</div>
                        </div>
                    </div>

                    {/* Difference Display */}
                    <div className={`p-4 rounded-lg border ${isBalanced
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                        <div className="text-center">
                            <div className={`text-sm ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                Difference
                            </div>
                            <div className={`text-2xl font-bold ${isBalanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                {formatCurrency(Math.abs(difference))}
                            </div>
                            <div className={`text-sm ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isBalanced ? '✅ Perfect match!' : `${difference > 0 ? 'Bank higher' : 'Bank lower'} - Review transactions`}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isBalanced}
                            className={`px-4 py-2 rounded-lg font-medium ${isBalanced
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isBalanced ? 'Complete Reconciliation' : 'Balance Required'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Inline PendingTransfersAlert Component (NEW - Smart Cross-Account Allocation)
const PendingTransfersAlert = ({ accounts, onCreateTransfers, className = "" }) => {
    // Mock pending transfers for demonstration (replace with actual hook integration)
    const mockPendingTransfers = [
        {
            id: 'transfer-1',
            fromAccountId: 2,
            toAccountId: 1,
            amount: 300,
            reason: 'Allocation to Groceries category',
            categoryId: 'groceries',
            createdAt: '2025-01-07T19:50:00Z',
            status: 'pending'
        }
    ];

    const getPendingTransfers = () => mockPendingTransfers;
    const getTotalPendingTransferAmount = () => mockPendingTransfers.reduce((sum, t) => sum + t.amount, 0);
    const cancelPendingTransfer = (transferId) => {
        console.log('Cancelling transfer:', transferId);
    };

    const [showDetails, setShowDetails] = useState(false);
    const pendingTransfers = getPendingTransfers();
    const totalAmount = getTotalPendingTransferAmount();

    // Don't show if no pending transfers
    if (pendingTransfers.length === 0) {
        return null;
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account?.name || `Account ${accountId}`;
    };

    const handleCreateAllTransfers = () => {
        if (onCreateTransfers) {
            onCreateTransfers(pendingTransfers);
        }
    };

    const handleReviewDetails = () => {
        setShowDetails(!showDetails);
    };

    const handleCancelTransfer = (transferId) => {
        cancelPendingTransfer(transferId);
    };

    return (
        <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 ${className}`}>
            {/* Main Alert Header */}
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🔄</span>
                <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Pending Account Transfers
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        You have allocated funds that require {pendingTransfers.length} account transfer{pendingTransfers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        Total transfer amount
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={handleCreateAllTransfers}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <span>💸</span>
                    Create All Transfers
                </button>
                <button
                    onClick={handleReviewDetails}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <span>📋</span>
                    {showDetails ? 'Hide Details' : 'Review Details'}
                </button>
            </div>

            {/* Transfer Details (Expandable) */}
            {showDetails && (
                <div className="border-t border-yellow-200 dark:border-yellow-700 pt-3">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                        Transfer Details:
                    </h4>
                    <div className="space-y-2">
                        {pendingTransfers.map((transfer) => (
                            <div
                                key={transfer.id}
                                className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                            {getAccountName(transfer.fromAccountId)}
                                        </span>
                                        <span className="text-yellow-600 dark:text-yellow-400">→</span>
                                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                            {getAccountName(transfer.toAccountId)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                        {transfer.reason}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-yellow-800 dark:text-yellow-200">
                                        {formatCurrency(transfer.amount)}
                                    </span>
                                    <button
                                        onClick={() => handleCancelTransfer(transfer.id)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                        title="Cancel this transfer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 border-t border-yellow-200 dark:border-yellow-700 pt-2">
                💡 <strong>Tip:</strong> These transfers were created when you allocated money to categories funded by accounts with insufficient funds.
                Creating the transfers will move money between your accounts to support the allocations.
            </div>
        </div>
    );
};

export default function BudgetTransactions() {
    // State for sidebar account selection
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcilingAccount, setReconcilingAccount] = useState(null);

    // Use persistent data management hooks
    const { accounts, setAccounts } = useAccountManagement();
    const { categories, setCategories } = useCategoryManagement();
    const {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    } = useTransactionManagement(accounts, setAccounts, categories, setCategories);

    // Load scheduled transactions component dynamically
    const [ScheduledTransactionsRow, setScheduledTransactionsRow] = useState(null);

    // Use scheduled transactions hook directly (not dynamically)
    const scheduledTransactionsHook = React.useMemo(() => {
        try {
            // Import the hook functions directly and create a simple wrapper
            const getUpcomingScheduledTransactions = (days = 30) => {
                const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
                const scheduledTransactions = stored ? JSON.parse(stored) : [];

                const today = new Date();
                const futureDate = new Date();
                futureDate.setDate(today.getDate() + days);

                return scheduledTransactions
                    .filter(txn => !txn.isActivated && new Date(txn.nextDueDate || txn.dueDate) <= futureDate)
                    .sort((a, b) => new Date(a.nextDueDate || a.dueDate) - new Date(b.nextDueDate || b.dueDate));
            };

            const editScheduledTransaction = (id, updates) => {
                const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
                const scheduledTransactions = stored ? JSON.parse(stored) : [];

                const updated = scheduledTransactions.map(txn =>
                    txn.id === id ? { ...txn, ...updates } : txn
                );

                localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(updated));
            };

            const skipScheduledTransaction = (id) => {
                editScheduledTransaction(id, { isSkipped: true, skippedAt: new Date().toISOString() });
            };

            const activateScheduledTransactionEarly = (id) => {
                const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
                const scheduledTransactions = stored ? JSON.parse(stored) : [];

                const transaction = scheduledTransactions.find(txn => txn.id === id);
                if (transaction) {
                    // Create actual transaction
                    const actualTransaction = {
                        ...transaction,
                        id: undefined, // Let addTransaction generate new ID
                        isScheduled: false,
                        scheduledTransactionId: transaction.id,
                        date: new Date().toISOString().split('T')[0] // Use today's date
                    };

                    addTransaction(actualTransaction);

                    // Mark as activated
                    editScheduledTransaction(id, {
                        isActivated: true,
                        activatedAt: new Date().toISOString(),
                        activatedEarly: true
                    });
                }
            };

            const deleteScheduledTransaction = (id) => {
                const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
                const scheduledTransactions = stored ? JSON.parse(stored) : [];

                const filtered = scheduledTransactions.filter(txn => txn.id !== id);
                localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(filtered));
            };

            return {
                getUpcomingScheduledTransactions,
                editScheduledTransaction,
                skipScheduledTransaction,
                activateScheduledTransactionEarly,
                deleteScheduledTransaction
            };
        } catch (error) {
            console.error('Error creating scheduled transactions wrapper:', error);
            return null;
        }
    }, [addTransaction]);

    // Load scheduled transactions component dynamically
    useEffect(() => {
        const loadScheduledTransactionsComponent = async () => {
            try {
                const componentModule = await import('../../../../components/budget/ScheduledTransactionsWidget');
                setScheduledTransactionsRow(() => componentModule.default);
            } catch (error) {
                console.error('Failed to load scheduled transactions component:', error);
            }
        };
        loadScheduledTransactionsComponent();
    }, []);

    // Get upcoming scheduled transactions for display
    const upcomingScheduledTransactions = scheduledTransactionsHook
        ? scheduledTransactionsHook.getUpcomingScheduledTransactions(30)
        : [];

    // Payee management
    const [payees, setPayees] = useLocalStorage('budgetCalc_payees', [
        'Amazon',
        'Target',
        'Walmart',
        'Starbucks',
        'Shell Gas Station',
        'Electric Company',
        'Water Department',
        'Internet Provider'
    ]);

    const handleAddPayee = (newPayee) => {
        if (newPayee.trim() && !payees.includes(newPayee.trim())) {
            setPayees(prev => [...prev, newPayee.trim()]);
        }
    };

    // Handlers for transaction operations
    const handleAddTransaction = (transactionData) => {
        console.log("Raw transaction data received:", transactionData);

        const processedData = {
            ...transactionData,
            accountId: parseInt(transactionData.accountId),
            categoryId: transactionData.categoryId ? parseInt(transactionData.categoryId) : null,
            amount: parseFloat(transactionData.amount) || 0,
            transferAccountId: transactionData.transferAccountId ? parseInt(transactionData.transferAccountId) : undefined
        };

        console.log("Processed transaction:", processedData);
        addTransaction(processedData);
        console.log("Transaction added successfully");
    };

    const handleEditTransaction = (updatedTransaction) => {
        const processedData = {
            ...updatedTransaction,
            accountId: parseInt(updatedTransaction.accountId),
            categoryId: updatedTransaction.categoryId ? parseInt(updatedTransaction.categoryId) : null,
            amount: parseFloat(updatedTransaction.amount) || 0,
            transferAccountId: updatedTransaction.transferAccountId ? parseInt(updatedTransaction.transferAccountId) : undefined
        };

        updateTransaction(updatedTransaction.id, processedData);
        console.log("Updated transaction:", processedData);
    };

    const handleDeleteTransaction = (transactionId) => {
        deleteTransaction(transactionId);
        console.log("Deleted transaction:", transactionId);
    };

    // Sidebar handlers
    const handleAccountSelect = (accountId) => {
        setSelectedAccountId(accountId);
        console.log("Selected account:", accountId);
    };

    const handleReconcileAccount = (account) => {
        setReconcilingAccount(account);
        setShowReconcileModal(true);
    };


    return (
        <Page title="Transactions">
            <div className="flex h-full">
                {/* Account Balance Sidebar */}
                <AccountBalanceSidebar
                    accounts={accounts}
                    transactions={transactions}
                    selectedAccountId={selectedAccountId}
                    onAccountSelect={handleAccountSelect}
                    onReconcileAccount={handleReconcileAccount}
                    className="w-80 flex-shrink-0 hidden lg:block"
                />

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                    <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6 h-full">
                        {/* Pending Transfers Alert */}
                        <PendingTransfersAlert
                            accounts={accounts}
                            onCreateTransfers={(transfers) => {
                                console.log('Creating transfers:', transfers);
                                // TODO: Integrate with transaction creation
                                alert(`Would create ${transfers.length} transfer transactions totaling $${transfers.reduce((sum, t) => sum + t.amount, 0)}`);
                            }}
                        />

                        {/* Scheduled Transactions Widget */}
                        {ScheduledTransactionsRow && scheduledTransactionsHook && (
                            <ScheduledTransactionsRow
                                scheduledTransactions={upcomingScheduledTransactions}
                                selectedAccountId={selectedAccountId}
                                accounts={accounts}
                                onEditScheduledTransaction={scheduledTransactionsHook.editScheduledTransaction}
                                onSkipScheduledTransaction={scheduledTransactionsHook.skipScheduledTransaction}
                                onActivateScheduledTransactionEarly={scheduledTransactionsHook.activateScheduledTransactionEarly}
                                onDeleteScheduledTransaction={scheduledTransactionsHook.deleteScheduledTransaction}
                            />
                        )}

                        <TransactionsTab
                            transactions={transactions}
                            accounts={accounts}
                            categories={categories}
                            payees={payees}
                            onAddPayee={handleAddPayee}
                            onAddTransaction={handleAddTransaction}
                            onEditTransaction={handleEditTransaction}
                            onDeleteTransaction={handleDeleteTransaction}
                            viewAccount={selectedAccountId}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Reconciliation Modal */}
            {showReconcileModal && reconcilingAccount && (
                <QuickReconcileModal
                    account={reconcilingAccount}
                    transactions={transactions}
                    onClose={() => {
                        setShowReconcileModal(false);
                        setReconcilingAccount(null);
                    }}
                    onReconcile={(accountId, bankBalance) => {
                        // Update account with reconciliation data
                        const updatedAccounts = accounts.map(acc =>
                            acc.id === accountId
                                ? {
                                    ...acc,
                                    lastReconciledDate: new Date().toISOString().split('T')[0],
                                    lastReconciledBalance: bankBalance
                                }
                                : acc
                        );
                        setAccounts(updatedAccounts);
                        setShowReconcileModal(false);
                        setReconcilingAccount(null);
                    }}
                />
            )}
        </Page>
    );
}
