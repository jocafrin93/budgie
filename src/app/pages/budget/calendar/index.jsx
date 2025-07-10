import { Page } from "components/shared/Page";
import { Calendar, ChevronLeft, Edit, Play, SkipForward, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Timeline, TimelineItem } from '../../../../components/ui/Timeline';
import { useAccountManagement } from '../../../../hooks/useAccountManagement';
import { formatCurrency } from '../../../../utils/formatUtils';

export default function BudgetCalendar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { accounts } = useAccountManagement();

    // Get selected account from navigation state or default to 'all'
    const [selectedAccountId, setSelectedAccountId] = useState(
        location.state?.selectedAccountId || 'all'
    );

    const [scheduledTransactions, setScheduledTransactions] = useState([]);

    // Load scheduled transactions
    useEffect(() => {
        const loadScheduledTransactions = () => {
            const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
            const transactions = stored ? JSON.parse(stored) : [];

            // Filter by account if specific account is selected
            const filtered = selectedAccountId === 'all'
                ? transactions
                : transactions.filter(txn => String(txn.accountId) === String(selectedAccountId));

            // Sort by due date
            const sorted = filtered
                .filter(txn => !txn.isActivated) // Only show non-activated transactions
                .sort((a, b) => new Date(a.nextDueDate || a.dueDate) - new Date(b.nextDueDate || b.dueDate));

            setScheduledTransactions(sorted);
        };

        loadScheduledTransactions();

        // Listen for localStorage changes
        const handleStorageChange = (e) => {
            if (e.key === 'budgetCalc_scheduledTransactions') {
                loadScheduledTransactions();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [selectedAccountId]);

    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account?.name || `Account ${accountId}`;
    };

    const getUrgencyColor = (dateString) => {
        if (!dateString) return 'neutral';

        const date = new Date(dateString);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'error'; // Overdue
        if (diffDays === 0) return 'warning'; // Due today
        if (diffDays <= 3) return 'info'; // Due soon
        return 'primary'; // Future
    };

    const formatRelativeDate = (dateString) => {
        if (!dateString) return 'No date';

        const date = new Date(dateString);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
    };

    const handleQuickAction = (action, txn) => {
        const stored = localStorage.getItem('budgetCalc_scheduledTransactions');
        const transactions = stored ? JSON.parse(stored) : [];

        switch (action) {
            case 'skip': {
                const updatedTransactions = transactions.map(t =>
                    t.id === txn.id ? { ...t, isSkipped: true, skippedAt: new Date().toISOString() } : t
                );
                localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(updatedTransactions));

                // Trigger a storage event to update the UI
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'budgetCalc_scheduledTransactions',
                    newValue: JSON.stringify(updatedTransactions)
                }));
                break;
            }

            case 'payNow': {
                // Create actual transaction from scheduled transaction
                const actualTransactions = JSON.parse(localStorage.getItem('budgetCalc_transactions') || '[]');
                const newTransactionId = Math.max(...actualTransactions.map(t => t.id), 0) + 1;

                const newTransaction = {
                    id: newTransactionId,
                    date: new Date().toISOString().split('T')[0], // Today's date
                    payee: txn.payee,
                    amount: txn.amount,
                    categoryId: txn.categoryId,
                    accountId: txn.accountId,
                    memo: `${txn.memo || ''} (Paid early from scheduled)`.trim(),
                    isCleared: false,
                    scheduledTransactionId: txn.id,
                    createdAt: new Date().toISOString()
                };

                // Add the new transaction
                const updatedTransactions = [...actualTransactions, newTransaction];
                localStorage.setItem('budgetCalc_transactions', JSON.stringify(updatedTransactions));

                // Mark scheduled transaction as activated
                const updatedScheduledTransactions = transactions.map(t =>
                    t.id === txn.id ? {
                        ...t,
                        isActivated: true,
                        activatedAt: new Date().toISOString(),
                        activatedEarly: true
                    } : t
                );
                localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(updatedScheduledTransactions));

                // Update account balance
                const accounts = JSON.parse(localStorage.getItem('budgetCalc_accounts') || '[]');
                const updatedAccounts = accounts.map(account => {
                    if (account.id === txn.accountId) {
                        return { ...account, balance: (account.balance || 0) + txn.amount };
                    }
                    return account;
                });
                localStorage.setItem('budgetCalc_accounts', JSON.stringify(updatedAccounts));

                // Update category spending if it's an expense
                if (txn.amount < 0 && txn.categoryId) {
                    const categories = JSON.parse(localStorage.getItem('budgetCalc_categories') || '[]');
                    const updatedCategories = categories.map(category => {
                        if (category.id === txn.categoryId) {
                            const newSpent = (category.spent || 0) + Math.abs(txn.amount);
                            return {
                                ...category,
                                spent: newSpent,
                                available: (category.allocated || 0) - newSpent
                            };
                        }
                        return category;
                    });
                    localStorage.setItem('budgetCalc_categories', JSON.stringify(updatedCategories));
                }

                // Trigger storage events to update UI
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'budgetCalc_transactions',
                    newValue: JSON.stringify(updatedTransactions)
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'budgetCalc_scheduledTransactions',
                    newValue: JSON.stringify(updatedScheduledTransactions)
                }));

                alert(`✅ Transaction created successfully!\n${txn.payee}: ${formatCurrency(txn.amount)}`);
                break;
            }

            case 'edit': {
                // For now, show a simple prompt to edit the payee
                const newPayee = prompt('Edit payee name:', txn.payee);
                if (newPayee && newPayee !== txn.payee) {
                    const updatedTransactions = transactions.map(t =>
                        t.id === txn.id ? { ...t, payee: newPayee, lastModified: new Date().toISOString() } : t
                    );
                    localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(updatedTransactions));

                    // Trigger storage event
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'budgetCalc_scheduledTransactions',
                        newValue: JSON.stringify(updatedTransactions)
                    }));
                }
                break;
            }

            case 'delete': {
                if (window.confirm(`Are you sure you want to delete the scheduled transaction for "${txn.payee}"?\n\nThis action cannot be undone.`)) {
                    const filteredTransactions = transactions.filter(t => t.id !== txn.id);
                    localStorage.setItem('budgetCalc_scheduledTransactions', JSON.stringify(filteredTransactions));

                    // Trigger storage event
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'budgetCalc_scheduledTransactions',
                        newValue: JSON.stringify(filteredTransactions)
                    }));
                }
                break;
            }

            default:
                break;
        }
    };

    const handleAccountChange = (accountId) => {
        setSelectedAccountId(accountId);
    };

    const handleBackToTransactions = () => {
        navigate('/budget/transactions', {
            state: { selectedAccountId }
        });
    };

    // Group transactions by account for display
    const groupedTransactions = selectedAccountId === 'all'
        ? accounts.reduce((groups, account) => {
            const accountTransactions = scheduledTransactions.filter(txn => String(txn.accountId) === String(account.id));
            if (accountTransactions.length > 0) {
                groups[account.id] = {
                    account,
                    transactions: accountTransactions
                };
            }
            return groups;
        }, {})
        : (() => {
            const account = accounts.find(acc => String(acc.id) === String(selectedAccountId));
            // scheduledTransactions is already filtered for the selected account in useEffect
            return account && scheduledTransactions.length > 0 ? {
                [selectedAccountId]: {
                    account,
                    transactions: scheduledTransactions
                }
            } : {};
        })();

    return (
        <Page title="Budget Calendar">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="min-w-0">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleBackToTransactions}
                                className="flex items-center space-x-2 text-info-600 hover:text-info-800 dark:text-info-400 dark:hover:text-info-300"
                            >
                                <ChevronLeft size={20} />
                                <span>Back to Transactions</span>
                            </button>
                        </div>
                        <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50 mt-2">
                            Scheduled Transactions Timeline
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
                            {selectedAccountId === 'all'
                                ? 'View all upcoming scheduled transactions across accounts'
                                : `View scheduled transactions for ${getAccountName(selectedAccountId)}`
                            }
                        </p>
                    </div>

                    {/* Account Filter */}
                    <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Account:
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-info-500"
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

                {/* Timeline Content */}
                <div className="space-y-8">
                    {Object.keys(groupedTransactions).length === 0 ? (
                        <div className="bg-white dark:bg-dark-700 rounded-lg p-8 shadow-sm text-center">
                            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No Scheduled Transactions
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {selectedAccountId === 'all'
                                    ? 'You don\'t have any scheduled transactions set up yet.'
                                    : `No scheduled transactions found for ${getAccountName(selectedAccountId)}.`
                                }
                            </p>
                            <button
                                onClick={handleBackToTransactions}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Go to Transactions
                            </button>
                        </div>
                    ) : (
                        Object.values(groupedTransactions).map(({ account, transactions }) => (
                            <div key={account.id} className="bg-white dark:bg-dark-700 rounded-lg p-6 shadow-sm">
                                {/* Account Header (only show if viewing all accounts) */}
                                {selectedAccountId === 'all' && (
                                    <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                            <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
                                            <span>{account.name}</span>
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {transactions.length} scheduled transaction{transactions.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}

                                {/* Timeline */}
                                <Timeline variant="filled" pointSize="12px" lineWidth="2px">
                                    {transactions.map((txn) => (
                                        <TimelineItem
                                            key={txn.id}
                                            title={txn.payee}
                                            time={txn.nextDueDate || txn.dueDate}
                                            color={getUrgencyColor(txn.nextDueDate || txn.dueDate)}
                                            isPing={getUrgencyColor(txn.nextDueDate || txn.dueDate) === 'error'}
                                        >
                                            <div className="space-y-3">
                                                {/* Transaction Details */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`font-bold text-lg ${txn.amount >= 0
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-red-600 dark:text-red-400'
                                                                }`}>
                                                                {formatCurrency(txn.amount)}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                • {formatRelativeDate(txn.nextDueDate || txn.dueDate)}
                                                            </span>
                                                        </div>

                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            <span className="capitalize">{txn.frequency}</span>
                                                            {txn.endCondition && txn.endCondition !== 'indefinite' && (
                                                                <span> • {txn.endCondition === 'until_date' ? `Until ${new Date(txn.endDate).toLocaleDateString()}` : `${txn.currentOccurrence}/${txn.maxOccurrences} payments`}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex items-center space-x-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                                    <button
                                                        onClick={() => handleQuickAction('payNow', txn)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-md transition-colors"
                                                    >
                                                        <Play size={12} />
                                                        <span>Pay Now</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleQuickAction('skip', txn)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-md transition-colors"
                                                    >
                                                        <SkipForward size={12} />
                                                        <span>Skip</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleQuickAction('edit', txn)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                    >
                                                        <Edit size={12} />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleQuickAction('delete', txn)}
                                                        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Page>
    );
}
