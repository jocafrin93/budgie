import { Calendar, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';

const ScheduledTransactionsWidget = ({
    scheduledTransactions = [],
    selectedAccountId = 'all',
    accounts = [],
    onEditScheduledTransaction,
    onSkipScheduledTransaction,
    onActivateScheduledTransactionEarly
}) => {
    const navigate = useNavigate();

    console.log('🔍 SCHEDULED TRANSACTIONS WIDGET DEBUG:', {
        scheduledTransactionsLength: scheduledTransactions.length,
        scheduledTransactions: scheduledTransactions,
        accountsLength: accounts.length,
        accounts: accounts,
        selectedAccountId
    });

    // Filter transactions based on selected account - ensure numeric comparison
    const filteredTransactions = selectedAccountId === 'all'
        ? scheduledTransactions
        : scheduledTransactions.filter(txn => Number(txn.accountId) === Number(selectedAccountId));

    console.log('🔍 FILTERED TRANSACTIONS DEBUG:', {
        originalLength: scheduledTransactions.length,
        filteredLength: filteredTransactions.length,
        filteredTransactions: filteredTransactions,
        selectedAccountId
    });

    if (filteredTransactions.length === 0) {
        console.log('🔍 NO FILTERED TRANSACTIONS - Widget will not render');
        return null;
    }

    const getAccountName = (accountId) => {
        console.log('🔍 ACCOUNT LOOKUP DEBUG:', {
            lookingForAccountId: accountId,
            accountIdType: typeof accountId,
            availableAccounts: accounts.map(acc => ({
                id: acc.id,
                idType: typeof acc.id,
                name: acc.name,
                accountName: acc.accountName
            })),
            stringComparison: accounts.map(acc => ({
                accountId: acc.id,
                stringAccountId: String(acc.id),
                lookingFor: String(accountId),
                matches: String(acc.id) === String(accountId)
            }))
        });

        // Try multiple lookup strategies to handle data type mismatches
        let account = accounts.find(acc => String(acc.id) === String(accountId));

        // If not found with string comparison, try numeric comparison
        if (!account) {
            account = accounts.find(acc => Number(acc.id) === Number(accountId));
        }

        // If still not found, try direct equality
        if (!account) {
            account = accounts.find(acc => acc.id === accountId);
        }

        console.log('🔍 ACCOUNT LOOKUP RESULT:', {
            accountId,
            foundAccount: account,
            accountName: account?.name || account?.accountName || `Unknown Account (ID: ${accountId})`,
            lookupStrategy: account ? 'found' : 'not_found'
        });

        if (!account) {
            console.warn('⚠️ ACCOUNT NOT FOUND:', {
                searchingFor: accountId,
                availableAccountIds: accounts.map(acc => acc.id),
                possibleIssue: 'Account ID mismatch or non-existent account'
            });
        }

        return account?.name || account?.accountName || `Unknown Account (ID: ${accountId})`;
    };

    const formatScheduledDate = (dateString) => {
        if (!dateString) return 'No date';

        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === tomorrow.toDateString()) {
                return 'Tomorrow';
            } else {
                return formatDate(date);
            }
        } catch {
            return 'Invalid date';
        }
    };

    const getUrgencyColor = (dateString) => {
        if (!dateString) return 'text-base-content/60';

        const date = new Date(dateString);
        const today = new Date();
        const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'text-error'; // Overdue
        if (diffDays === 0) return 'text-warning'; // Due today
        if (diffDays <= 3) return 'text-warning-light'; // Due soon
        return 'text-info'; // Future
    };

    const getUrgencyStats = () => {
        const today = new Date();
        const stats = {
            overdue: 0,
            dueToday: 0,
            dueThisWeek: 0,
            total: filteredTransactions.length
        };

        filteredTransactions.forEach(txn => {
            const date = new Date(txn.scheduledDate || txn.nextDueDate || txn.dueDate);
            const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) stats.overdue++;
            else if (diffDays === 0) stats.dueToday++;
            else if (diffDays <= 7) stats.dueThisWeek++;
        });

        return stats;
    };

    const getTotalAmount = () => {
        return filteredTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    };

    // Sort transactions by due date and take the first 5
    const sortedTransactions = [...filteredTransactions]
        .sort((a, b) => new Date(a.scheduledDate || a.nextDueDate || a.dueDate) - new Date(b.scheduledDate || b.nextDueDate || b.dueDate))
        .slice(0, 5);

    const stats = getUrgencyStats();
    const totalAmount = getTotalAmount();

    const handleNavigateToCalendar = () => {
        navigate('/budget/calendar', {
            state: { selectedAccountId }
        });
    };

    const handleQuickAction = (action, txn, e) => {
        e.stopPropagation();

        switch (action) {
            case 'skip':
                onSkipScheduledTransaction(txn.id);
                break;
            case 'payNow':
                onActivateScheduledTransactionEarly(txn.id);
                break;
            case 'edit':
                onEditScheduledTransaction(txn.id, {}, 'this_only');
                break;
            default:
                break;
        }
    };

    const getSelectedAccountName = () => {
        if (selectedAccountId === 'all') return 'All Accounts';
        return getAccountName(selectedAccountId);
    };

    return (
        <div className="bg-info/10 bg-base-100 border border-info rounded-lg mb-6">
            {/* Header */}
            <div className="p-4 border-b border-info">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Calendar className="text-info" size={24} />
                        <div>
                            <h3 className="font-semibold text-info">
                                Upcoming Scheduled Transactions
                                {selectedAccountId !== 'all' && (
                                    <span className="text-sm font-normal text-info ml-2">
                                        for {getSelectedAccountName()}
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center space-x-4 text-xs text-info mt-1">
                                {stats.overdue > 0 && (
                                    <span className="text-error">
                                        {stats.overdue} overdue
                                    </span>
                                )}
                                {stats.dueToday > 0 && (
                                    <span className="text-warning">
                                        {stats.dueToday} due today
                                    </span>
                                )}
                                {stats.dueThisWeek > 0 && (
                                    <span>{stats.dueThisWeek} due this week</span>
                                )}
                                <span>{stats.total} total</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-lg font-bold text-info">
                            {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-sm text-info">
                            Total upcoming
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="p-4">
                <div className="space-y-3">
                    {sortedTransactions.map((txn) => (
                        <div
                            key={txn.id}
                            className="flex items-center justify-between bg-base-100 rounded-lg p-3 border border-info hover transition-colors"
                        >
                            {/* Transaction Info */}
                            <div className="flex items-center space-x-3 flex-1">
                                <div className="flex-shrink-0">
                                    <Clock
                                        size={16}
                                        className={getUrgencyColor(txn.scheduledDate || txn.nextDueDate || txn.dueDate)}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-medium ${getUrgencyColor(txn.scheduledDate || txn.nextDueDate || txn.dueDate)}`}>
                                            {formatScheduledDate(txn.scheduledDate || txn.nextDueDate || txn.dueDate)}
                                        </span>
                                        <span className="text-base-content/60">•</span>
                                        <span className="text-base-content truncate">
                                            {txn.payee}
                                        </span>
                                    </div>

                                    {selectedAccountId === 'all' && (
                                        <div className="text-xs text-base-content/60 mt-1">
                                            {getAccountName(txn.accountId)}
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="flex-shrink-0">
                                    <span className={`font-bold ${txn.amount >= 0
                                        ? 'text-success'
                                        : 'text-error'
                                        }`}>
                                        {formatCurrency(txn.amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center space-x-1 ml-3">
                                <button
                                    onClick={(e) => handleQuickAction('skip', txn, e)}
                                    className="p-1.5 text-base-content/60 hover:text-base-content rounded transition-colors"
                                    title="Skip this occurrence"
                                >
                                    <span className="text-xs">Skip</span>
                                </button>

                                <button
                                    onClick={(e) => handleQuickAction('payNow', txn, e)}
                                    className="p-1.5 text-base-content/60 hover:text-base-content rounded transition-colors"
                                    title="Pay now"
                                >
                                    <span className="text-xs">Pay</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Button */}
                <div className="mt-4 pt-3 border-t border-info">
                    <button
                        onClick={handleNavigateToCalendar}
                        className="w-full flex items-center justify-center space-x-2 bg-info hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Calendar size={16} />
                        <span>View All on Calendar</span>
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Help Text */}
                <div className="text-xs text-info mt-3 text-center">
                    💡 <strong>Tip:</strong> Click &ldquo;View All on Calendar&rdquo; to see your complete scheduled transaction timeline
                </div>
            </div>
        </div>
    );
};

export default ScheduledTransactionsWidget;
