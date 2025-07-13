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
        cancelPendingTransfer
    } = useEnvelopeBudgeting({ accounts });

    const [showDetails, setShowDetails] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const pendingTransfers = getPendingTransfers();
    const totalAmount = getTotalPendingTransferAmount();

    // Don't show if no pending transfers or if dismissed
    if (pendingTransfers.length === 0 || isDismissed) {
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
        <div className={`alert alert-warning shadow-lg mb-6 ${className}`}>
            {/* Main Alert Header */}
            <div className="flex items-center gap-3 mb-3 w-full">
                <span className="text-2xl">🔄</span>
                <div className="flex-1">
                    <h3 className="font-semibold text-warning-content">
                        Pending Account Transfers
                    </h3>
                    <p className="text-warning-content/80 text-sm">
                        You have allocated funds that require {pendingTransfers.length} account transfer{pendingTransfers.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-warning-content">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-sm text-warning-content/70">
                        Total transfer amount
                    </div>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="btn btn-ghost btn-sm btn-circle text-warning-content/60 hover:text-warning-content"
                    title="Dismiss alert"
                >
                    ✕
                </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={handleCreateAllTransfers}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                >
                    <span>💸</span>
                    Create All Transfers
                </button>
                <button
                    onClick={handleReviewDetails}
                    className="btn btn-outline btn-sm flex items-center gap-2"
                >
                    <span>📋</span>
                    {showDetails ? 'Hide Details' : 'Review Details'}
                </button>
            </div>

            {/* Transfer Details (Expandable) */}
            {showDetails && (
                <div className="border-t border-warning-content/20 pt-3">
                    <h4 className="font-medium text-warning-content mb-3">
                        Transfer Details:
                    </h4>
                    <div className="space-y-2">
                        {pendingTransfers.map((transfer) => (
                            <div
                                key={transfer.id}
                                className="flex items-center justify-between bg-warning-content/10 rounded-lg p-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-warning-content">
                                            {getAccountName(transfer.fromAccountId)}
                                        </span>
                                        <span className="text-warning-content/70">→</span>
                                        <span className="font-medium text-warning-content">
                                            {getAccountName(transfer.toAccountId)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-warning-content/70 mt-1">
                                        {transfer.reason}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-warning-content">
                                        {formatCurrency(transfer.amount)}
                                    </span>
                                    <button
                                        onClick={() => handleCancelTransfer(transfer.id)}
                                        className="btn btn-ghost btn-xs btn-circle text-error hover:text-error"
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
            <div className="text-xs text-warning-content/70 mt-3 border-t border-warning-content/20 pt-2">
                💡 <strong>Tip:</strong> These transfers were created when you allocated money to categories funded by accounts with insufficient funds.
                Creating the transfers will move money between your accounts to support the allocations.
            </div>
        </div>
    );
};

export default PendingTransfersAlert;
