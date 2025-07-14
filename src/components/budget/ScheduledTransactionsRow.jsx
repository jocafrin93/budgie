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
            // Use local timezone parsing like the rest of the app
            const date = new Date(dateString + 'T00:00:00');

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date string:', dateString);
                return 'Invalid date';
            }

            // Get today in local timezone consistently
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset to start of day

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Reset date to start of day for comparison
            const dateToCompare = new Date(date);
            dateToCompare.setHours(0, 0, 0, 0);

            if (dateToCompare.getTime() === today.getTime()) {
                return 'Today';
            } else if (dateToCompare.getTime() === tomorrow.getTime()) {
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
        <div className="bg-warning/10 border border-warning rounded-lg mb-4">
            {/* Header Row */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <button className="text-warning">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <span className="text-2xl">📅</span>
                    <div>
                        <h3 className="font-semibold text-warning">
                            Scheduled Transactions
                        </h3>
                        <p className="text-sm text-warning">
                            {scheduledTransactions.length} upcoming transaction{scheduledTransactions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-lg font-bold text-warning">
                        {formatCurrency(scheduledTransactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0))}
                    </div>
                    <div className="text-sm text-warning">
                        Total upcoming
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-warning bg-warning/10">
                    <div className="p-4 space-y-3">
                        {scheduledTransactions.map((scheduledTxn) => (
                            <div
                                key={scheduledTxn.id}
                                className="flex items-center justify-between bg-base-100 rounded-lg p-3 border border-warning"
                            >
                                {/* Transaction Info */}
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-base-content">
                                                    {formatScheduledDate(scheduledTxn.nextDueDate || scheduledTxn.dueDate)}
                                                </span>
                                                <span className="text-base-content/60">•</span>
                                                <span className="text-base-content">
                                                    {scheduledTxn.payee}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-sm text-base-content/60">
                                                    {getAccountName(scheduledTxn.accountId)}
                                                </span>
                                                {scheduledTxn.recurringPattern && (
                                                    <>
                                                        <span className="text-base-content/60">•</span>
                                                        <span className="text-xs text-base-content/60">
                                                            {getOccurrenceInfo(scheduledTxn)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {scheduledTxn.memo && (
                                                <div className="text-sm text-base-content/60 mt-1">
                                                    {scheduledTxn.memo}
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${scheduledTxn.amount >= 0
                                                ? 'text-success'
                                                : 'text-error'
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
                                        className="p-2 text-base-content/60 hover:text-base-content rounded transition-colors"
                                        title="Edit scheduled transaction"
                                    >
                                        <Edit size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handleSkipClick(scheduledTxn, e)}
                                        className="p-2 text-base-content/60 hover:text-base-content rounded transition-colors"
                                        title="Skip this occurrence"
                                    >
                                        <SkipForward size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handlePayNowClick(scheduledTxn, e)}
                                        className="p-2 text-base-content/60 hover:text-base-content rounded transition-colors"
                                        title="Pay now (activate early)"
                                    >
                                        <Play size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => handleDeleteClick(scheduledTxn, e)}
                                        className="p-2 text-base-content/60 hover:text-base-content rounded transition-colors"
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
                        <div className="text-xs text-warning bg-warning/20 rounded p-2">
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
