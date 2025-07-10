import { useState } from 'react';
import { useAccountManagement } from '../../hooks/useAccountManagement';
import { useEnvelopeBudgeting } from '../../hooks/useEnvelopeBudgeting';

const PendingTransfersAlert = ({
    onCreateTransfers,
    onReviewDetails,
    className = ""
}) => {
    const { accounts } = useAccountManagement();
    const {
        getPendingTransfers,
        getTotalPendingTransferAmount,
        completePendingTransfer,
        cancelPendingTransfer
    } = useEnvelopeBudgeting({ accounts });

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
        if (onReviewDetails) {
            onReviewDetails(pendingTransfers);
        }
    };

    const handleCancelTransfer = (transferId) => {
        cancelPendingTransfer(transferId);
    };

    return (
        <div className={`bg-warning dark:bg-warning border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 ${className}`}>
            {/* Main Alert Header */}
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🔄</span>
                <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Pending Account Transfers
                    </h3>
                    <p className="text-warning-700 dark:text-warning-300 text-sm">
                        You have allocated funds that require {pendingTransfers.length} account transfer{pendingTransfers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-yellow-800 dark:text-warning-200">
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

export default PendingTransfersAlert;
