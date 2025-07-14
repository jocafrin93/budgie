import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Page } from "components/shared/Page";
import React, { useEffect, useState } from "react";
import AccountBalanceSidebar from "../../../../components/budget/AccountBalanceSidebar";
import TransactionsTab from "../../../../components/budget/TransactionsTab";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useScheduledTransactions } from "../../../../hooks/useScheduledTransactions";
import { useStorage } from "../../../../hooks/useStorage";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

// Dynamic import for mobile view
const MobileTransactionsView = React.lazy(() => import("../../../../components/budget/MobileTransactionsView"));

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
                    <div className="p-4 bg-info-50 dark:bg-info/20/20 border border-info-200 dark:border-info-800 rounded-lg">
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
                                className="w-full pl-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-info-500"
                            />
                        </div>
                        <p className="text-sm text-info-800 dark:text-info-200 mt-2">
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

                        <div className="text-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                            <div className="text-sm text-success-600 dark:text-success-400">Cleared Balance</div>
                            <div className="text-lg font-bold text-success-700 dark:text-success-300">
                                {formatCurrency(balances.clearedBalance)}
                            </div>
                            <div className="text-xs text-success-600 dark:text-success-400">Cleared transactions</div>
                        </div>

                        <div className="text-center p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                            <div className="text-sm text-warning-600 dark:text-warning-400">Pending</div>
                            <div className="text-lg font-bold text-warning-700 dark:text-warning-300">
                                {formatCurrency(balances.pendingBalance)}
                            </div>
                            <div className="text-xs text-warning-600 dark:text-warning-400">Uncleared transactions</div>
                        </div>
                    </div>

                    {/* Difference Display */}
                    <div className={`p-4 rounded-lg border ${isBalanced
                        ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                        : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                        }`}>
                        <div className="text-center">
                            <div className={`text-sm ${isBalanced ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                                Difference
                            </div>
                            <div className={`text-2xl font-bold ${isBalanced ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'}`}>
                                {formatCurrency(Math.abs(difference))}
                            </div>
                            <div className={`text-sm ${isBalanced ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
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
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
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

// Import the proper PendingTransfersAlert component
import PendingTransfersAlert from "../../../../components/budget/PendingTransfersAlert";
import { useEnvelopeBudgeting } from "../../../../hooks/useEnvelopeBudgeting";

export default function BudgetTransactions() {
    // Breakpoint context for responsive design
    const { mdAndDown } = useBreakpointsContext();

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

    // Initialize envelope budgeting hook for pending transfers
    const envelopeBudgeting = useEnvelopeBudgeting({
        categories,
        accounts,
        transactions
    });

    // Load scheduled transactions component dynamically
    const [ScheduledTransactionsRow, setScheduledTransactionsRow] = useState(null);

    // Use proper cloud storage-based scheduled transactions hook
    const scheduledTransactionsHook = useScheduledTransactions(addTransaction);

    // Create some test scheduled transactions if none exist (for production testing)
    useEffect(() => {
        if (scheduledTransactionsHook.scheduledTransactions.length === 0) {
            console.log('🔧 CREATING TEST SCHEDULED TRANSACTIONS FOR PRODUCTION');

            // Find categories with funding accounts set
            const categoriesWithFundingAccounts = categories.filter(cat => cat.accountId);

            if (categoriesWithFundingAccounts.length > 0) {
                const testScheduledTransactions = categoriesWithFundingAccounts.slice(0, 3).map((category, index) => {
                    const testData = [
                        { payee: 'Electric Company', amount: -150, days: 5 },
                        { payee: 'Rent Payment', amount: -1200, days: 10 },
                        { payee: 'Internet Bill', amount: -80, days: 15 }
                    ];

                    const test = testData[index] || testData[0];

                    return {
                        id: `test_${index + 1}`,
                        payee: test.payee,
                        amount: test.amount,
                        categoryId: category.id,
                        accountId: category.accountId, // Use the category's funding account
                        frequency: 'monthly',
                        scheduledDate: new Date(Date.now() + test.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        nextDueDate: new Date(Date.now() + test.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        dueDate: new Date(Date.now() + test.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        memo: `Monthly ${test.payee.toLowerCase()}`,
                        isActivated: false,
                        isSkipped: false,
                        recurringPattern: {
                            frequency: 'monthly',
                            interval: 1,
                            endCondition: 'indefinite'
                        }
                    };
                });

                scheduledTransactionsHook.addScheduledTransactions(testScheduledTransactions);
                console.log('✅ TEST SCHEDULED TRANSACTIONS CREATED FOR PRODUCTION:', testScheduledTransactions);
                console.log('🔍 USING FUNDING ACCOUNTS FROM CATEGORIES:', categoriesWithFundingAccounts.map(c => ({
                    categoryName: c.name,
                    fundingAccountId: c.accountId
                })));
            } else {
                console.log('⚠️ NO CATEGORIES WITH FUNDING ACCOUNTS FOUND - Cannot create test scheduled transactions');
            }
        }
    }, [scheduledTransactionsHook, accounts, categories]);

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

    // Get upcoming scheduled transactions for display with debugging
    const upcomingScheduledTransactions = React.useMemo(() => {
        if (!scheduledTransactionsHook) {
            console.log('🔍 SCHEDULED TRANSACTIONS DEBUG: No hook available');
            return [];
        }

        const upcoming = scheduledTransactionsHook.getUpcomingScheduledTransactions();

        console.log('🔍 SCHEDULED TRANSACTIONS DEBUG:', {
            allScheduledTransactions: scheduledTransactionsHook.scheduledTransactions,
            allScheduledTransactionsLength: scheduledTransactionsHook.scheduledTransactions.length,
            upcomingScheduledTransactions: upcoming,
            upcomingLength: upcoming.length,
            today: new Date(),
            futureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        return upcoming;
    }, [scheduledTransactionsHook]);

    // Debug log to see if scheduled transactions are being passed to components
    console.log('🔍 PASSING TO COMPONENTS:', {
        upcomingScheduledTransactions,
        upcomingLength: upcomingScheduledTransactions.length,
        ScheduledTransactionsRowExists: !!ScheduledTransactionsRow,
        scheduledTransactionsHookExists: !!scheduledTransactionsHook
    });

    // Payee management - use cloud storage
    const [payees, setPayees] = useStorage('budgetCalc_payees', [
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

    // Listen for account filter changes from mobile view
    useEffect(() => {
        const handleAccountFilterChange = (event) => {
            const { accountId } = event.detail;
            setSelectedAccountId(accountId);
        };

        window.addEventListener('accountFilterChange', handleAccountFilterChange);
        return () => {
            window.removeEventListener('accountFilterChange', handleAccountFilterChange);
        };
    }, []);

    // Handlers for transaction operations
    const handleAddTransaction = (transactionData) => {
        console.log("Raw transaction data received:", transactionData);

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
                accountId: parseInt(transactionData.accountId),
                categoryId: 'transfer', // Use 'transfer' as category identifier
                amount: parseFloat(transactionData.amount) || 0,
                payee: destinationAccount?.name || destinationAccount?.accountName || `Account ${transactionData.transferToAccountId}`,
                transferToAccountId: parseInt(transactionData.transferToAccountId)
            };

            console.log("Processed main transfer transaction:", mainTransaction);
            addTransaction(mainTransaction);

            // Create the inverse transaction for the destination account
            const inverseTransaction = {
                ...transactionData,
                id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                accountId: parseInt(transactionData.transferToAccountId),
                transferToAccountId: parseInt(transactionData.accountId),
                amount: -(parseFloat(transactionData.amount) || 0), // Opposite sign
                payee: sourceAccount?.name || sourceAccount?.accountName || `Account ${transactionData.accountId}`, // Source account as payee
                categoryId: 'transfer', // Use 'transfer' as category identifier
                isTransfer: true
            };

            console.log("Processed inverse transfer transaction:", inverseTransaction);
            // Add the inverse transaction
            addTransaction(inverseTransaction);
        } else {
            // Regular transaction
            const processedData = {
                ...transactionData,
                accountId: parseInt(transactionData.accountId),
                categoryId: transactionData.categoryId ? parseInt(transactionData.categoryId) : null,
                amount: parseFloat(transactionData.amount) || 0,
                transferAccountId: transactionData.transferAccountId ? parseInt(transactionData.transferAccountId) : undefined
            };

            console.log("Processed regular transaction:", processedData);
            addTransaction(processedData);
        }
        console.log("Transaction(s) added successfully");
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
                            onCreateTransfers={(transfers) => {
                                console.log('Creating transfers:', transfers);

                                // Create both outgoing and incoming transactions for each transfer
                                transfers.forEach(transfer => {
                                    const sourceAccount = accounts.find(acc => acc.id === transfer.fromAccountId);
                                    const destinationAccount = accounts.find(acc => acc.id === transfer.toAccountId);

                                    if (sourceAccount && destinationAccount) {
                                        // Create outgoing transaction (negative amount)
                                        const outgoingTransaction = {
                                            date: new Date().toISOString().split('T')[0],
                                            accountId: transfer.fromAccountId,
                                            transferToAccountId: transfer.toAccountId,
                                            amount: -Math.abs(transfer.amount), // Negative for outgoing
                                            payee: destinationAccount.name,
                                            memo: transfer.reason || 'Account transfer',
                                            categoryId: 'transfer',
                                            isTransfer: true,
                                            isCleared: false
                                        };

                                        // Create incoming transaction (positive amount)
                                        const incomingTransaction = {
                                            date: new Date().toISOString().split('T')[0],
                                            accountId: transfer.toAccountId,
                                            transferToAccountId: transfer.fromAccountId,
                                            amount: Math.abs(transfer.amount), // Positive for incoming
                                            payee: sourceAccount.name,
                                            memo: transfer.reason || 'Account transfer',
                                            categoryId: 'transfer',
                                            isTransfer: true,
                                            isCleared: false
                                        };

                                        // Add both transactions
                                        addTransaction(outgoingTransaction);
                                        addTransaction(incomingTransaction);

                                        // Mark the pending transfer as completed
                                        envelopeBudgeting.completePendingTransfer(transfer.id);
                                    }
                                });

                                console.log(`✅ Created ${transfers.length * 2} transfer transactions (${transfers.length} pairs)`);
                            }}
                            onReviewDetails={(transfers) => {
                                console.log('Reviewing transfer details:', transfers);
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

                        {/* Responsive Transaction Views */}
                        {mdAndDown ? (
                            <React.Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                                <MobileTransactionsView
                                    transactions={transactions}
                                    accounts={accounts}
                                    categories={categories}
                                    payees={payees}
                                    onAddPayee={handleAddPayee}
                                    onAddTransaction={handleAddTransaction}
                                    onEditTransaction={handleEditTransaction}
                                    onDeleteTransaction={handleDeleteTransaction}
                                    viewAccount={selectedAccountId}
                                    scheduledTransactions={upcomingScheduledTransactions}
                                    onEditScheduledTransaction={scheduledTransactionsHook.editScheduledTransaction}
                                    onSkipScheduledTransaction={scheduledTransactionsHook.skipScheduledTransaction}
                                    onActivateScheduledTransactionEarly={scheduledTransactionsHook.activateScheduledTransactionEarly}
                                    onDeleteScheduledTransaction={scheduledTransactionsHook.deleteScheduledTransaction}
                                />
                            </React.Suspense>
                        ) : (
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
                                scheduledTransactions={upcomingScheduledTransactions}
                                onEditScheduledTransaction={scheduledTransactionsHook.editScheduledTransaction}
                                onSkipScheduledTransaction={scheduledTransactionsHook.skipScheduledTransaction}
                                onActivateScheduledTransactionEarly={scheduledTransactionsHook.activateScheduledTransactionEarly}
                                onDeleteScheduledTransaction={scheduledTransactionsHook.deleteScheduledTransaction}
                            />
                        )}
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
