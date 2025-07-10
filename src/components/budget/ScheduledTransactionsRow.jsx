import { ChevronDown, ChevronRight, Edit, Play, SkipForward, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';

const ScheduledTransactionsRow = ({
    scheduledTransactions = [],
    onEditScheduledTransaction,
    onSkipScheduledTransaction,
    onActivateScheduledTransactionEarly,
    onDeleteScheduledTransaction,
    accounts = []
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (scheduledTransactions.length === 0) {
        return null;
    }

    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account?.name || `Account ${accountId}`;
    };

    const formatScheduledDate = (dateString) => {
        if (!dateString) return 'No date';

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString);
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
        } catch (error) {
            console.error('Error formatting scheduled date:', error, 'Date string:', dateString);
            return 'Invalid date';
        }
    };

    const getOccurrenceInfo = (scheduledTxn) => {
        const pattern = scheduledTxn.recurringPattern;
        if (!pattern) return '';

        if (pattern.endCondition === 'max_occurrences') {
            return `Payment ${pattern.currentOccurrence} of ${pattern.maxOccurrences}`;
        } else if (pattern.endCondition === 'until_date') {
            return `Payment ${pattern.currentOccurrence} (until ${formatDate(new Date(pattern.endDate))})`;
        } else {
            return `Payment ${pattern.currentOccurrence} (ongoing)`;
        }
    };

    const handleEditClick = (scheduledTxn, e) => {
        e.stopPropagation();
        // For now, we'll just edit this occurrence
        // In a full implementation, we'd show a modal asking "this occurrence only" vs "all future"
        onEditScheduledTransaction(scheduledTxn.id, {}, 'this_only');
    };

    const handleSkipClick = (scheduledTxn, e) => {
        e.stopPropagation();
        onSkipScheduledTransaction(scheduledTxn.id);
    };

    const handlePayNowClick = (scheduledTxn, e) => {
        e.stopPropagation();
        onActivateScheduledTransactionEarly(scheduledTxn.id);
    };

    const handleDeleteClick = (scheduledTxn, e) => {
        e.stopPropagation();
        // For now, we'll just delete this occurrence
        // In a full implementation, we'd show a modal asking "this occurrence only" vs "all future"
        onDeleteScheduledTransaction(scheduledTxn.id, 'this_only');
    };

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
            {/* Header Row */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <button className="text-yellow-600 dark:text-yellow-400">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <span className="text-2xl">📅</span>
                    <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Scheduled Transactions
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {scheduledTransactions.length} upcoming transaction{scheduledTransactions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(scheduledTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0))}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        Total upcoming
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-yellow-200 dark:border-yellow-700 bg-yellow-25 dark:bg-yellow-900/10">
                    <div className="p-4 space-y-3">
                        {scheduledTransactions.map((scheduledTxn) => (
                            <div
                                key={scheduledTxn.id}
                                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700"
                            >
                                {/* Transaction Info */}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                    {formatScheduledDate(scheduledTxn.nextDueDate || scheduledTxn.dueDate)}
                                                </span>
                                                <span className="text-gray-500 dark:text-gray-400">•</span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {scheduledTxn.payee}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {getAccountName(scheduledTxn.accountId)}
                                                </span>
                                                {scheduledTxn.recurringPattern && (
                                                    <>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {getOccurrenceInfo(scheduledTxn)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {scheduledTxn.memo && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {scheduledTxn.memo}
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${scheduledTxn.amount >= 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {formatCurrency(scheduledTxn.amount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={(e) => handleEditClick(scheduledTxn, e)}
                                        className="p-2 text-gray-500 hover:text-info-600 hover:bg-info-50 dark:hover:bg-info/20/20 rounded transition-colors"
                                        title="Edit scheduled transaction"
                                    >
                                        <Edit size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handleSkipClick(scheduledTxn, e)}
                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                        title="Skip this occurrence"
                                    >
                                        <SkipForward size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handlePayNowClick(scheduledTxn, e)}
                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Pay now (activate early)"
                                    >
                                        <Play size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handleDeleteClick(scheduledTxn, e)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Delete scheduled transaction"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Help Text */}
                    <div className="px-4 pb-4">
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 rounded p-2">
                            <strong>💡 Tip:</strong> Scheduled transactions will automatically become real transactions on their due date.
                            Use &quot;Pay Now&quot; to activate early, &quot;Skip&quot; to skip an occurrence, or &quot;Edit&quot; to modify details.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduledTransactionsRow;
