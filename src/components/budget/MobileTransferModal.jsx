import { ArrowRight, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const MobileTransferModal = ({
    isOpen,
    onClose,
    targetCategory,
    categories = [],
    onTransferComplete
}) => {
    const [toCategory, setToCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [alerts, setAlerts] = useState([]);


    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && targetCategory) {
            // Pre-fill the amount with the full available amount
            setAmount(targetCategory.available?.toString() || '0');
            // Clear destination - user will select where to move it
            setToCategory('');
            setAlerts([]);
        } else if (!isOpen) {
            // Reset form when closing
            setToCategory('');
            setAmount('');
            setAlerts([]);
        }
    }, [isOpen, targetCategory]);

    // Calculate alerts when form changes
    useEffect(() => {
        if (!toCategory || !amount || parseFloat(amount) <= 0) {
            setAlerts([]);
            return;
        }

        const transferAmount = parseFloat(amount);
        const newAlerts = [];

        if (toCategory === 'to-be-allocated') {
            // Transferring back to unallocated funds
            newAlerts.push({
                type: 'success',
                message: `Moving $${transferAmount.toFixed(2)} back to unassigned funds`
            });
        } else {
            // Transferring to another category
            const toCategoryData = categories.find(c => c.id === parseInt(toCategory, 10));
            if (toCategoryData) {
                newAlerts.push({
                    type: 'success',
                    message: `Moving $${transferAmount.toFixed(2)} to ${toCategoryData.name}`
                });
            }
        }

        // Check if source category has enough funds
        const fromAvailable = targetCategory?.available || 0;
        if (transferAmount > fromAvailable) {
            newAlerts.push({
                type: 'error',
                message: `${targetCategory?.name} only has $${fromAvailable.toFixed(2)} available`
            });
        }

        setAlerts(newAlerts);
    }, [toCategory, amount, categories, targetCategory]);

    // Get destination category options
    const destinationOptions = useMemo(() => {
        const options = [];

        // Add "To be allocated" as first option
        options.push({
            value: 'to-be-allocated',
            label: 'To be allocated (unassigned funds)'
        });

        // Add all categories except the source category
        const sourceId = targetCategory?.id;
        categories.forEach(category => {
            if (category.id !== sourceId) {
                options.push({
                    value: category.id.toString(),
                    label: category.name
                });
            }
        });

        return options;
    }, [categories, targetCategory]);

    const handleTransfer = () => {
        console.log('🔄 Mobile Transfer initiated');
        console.log('📊 Transfer details:', { fromCategory: targetCategory?.id, toCategory, amount });

        if (!toCategory || !amount) {
            console.log('❌ Missing required fields:', { toCategory, amount });
            return;
        }

        const transferAmount = parseFloat(amount);
        if (transferAmount <= 0) {
            console.log('❌ Invalid transfer amount:', transferAmount);
            return;
        }

        // Check for errors in alerts
        const hasErrors = alerts.some(alert => alert.type === 'error');
        if (hasErrors) {
            console.log('❌ Transfer blocked by errors:', alerts.filter(alert => alert.type === 'error'));
            return;
        }

        console.log('✅ Mobile Transfer validation passed');

        try {
            if (toCategory === 'to-be-allocated') {
                console.log('💰 Handling transfer back to unallocated funds');
                const transferData = {
                    type: 'deallocate',
                    fromCategory: targetCategory.id,
                    toSource: 'unallocated',
                    amount: transferAmount,
                    alerts: alerts.filter(alert => alert.type !== 'error')
                };
                console.log('📤 Calling onTransferComplete with:', transferData);
                onTransferComplete?.(transferData);
            } else {
                console.log('🔄 Handling category-to-category transfer');
                const fromCategoryId = targetCategory.id;
                const toCategoryId = parseInt(toCategory, 10);

                const transferData = {
                    type: 'transfer',
                    fromCategory: fromCategoryId,
                    toCategory: toCategoryId,
                    amount: transferAmount,
                    alerts: alerts.filter(alert => alert.type !== 'error')
                };
                console.log('📤 Calling onTransferComplete with:', transferData);
                onTransferComplete?.(transferData);
            }

            console.log('🚪 Closing mobile modal');
            onClose();
        } catch (error) {
            console.error('💥 Mobile Transfer failed with error:', error);
            setAlerts(prev => [...prev, {
                type: 'error',
                message: 'Transfer failed. Please try again.'
            }]);
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-success" />;
            case 'error':
                return <X className="w-4 h-4 text-error" />;
            case 'info':
                return <Info className="w-4 h-4 text-info" />;
            default:
                return null;
        }
    };

    const getAlertStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-success/10 border-success text-success';
            case 'error':
                return 'bg-error/10 border-error text-error';
            case 'info':
                return 'bg-info/10 border-info text-info';
            default:
                return 'bg-base-200 border-base-300 text-base-content';
        }
    };

    if (!isOpen) return null;

    const maxAmount = targetCategory?.available || 0;
    const canTransfer = toCategory && amount && parseFloat(amount) > 0 &&
        !alerts.some(alert => alert.type === 'error');

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-base-content/50 backdrop-blur-sm transition-opacity pb-16">
            <div className="bg-base-200 rounded-t-xl shadow-xl w-full max-h-[80vh] overflow-y-auto mb-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-300">
                    <h3 className="text-lg font-semibold text-base-content">
                        Move Money
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-base-content/40 hover:text-base-content transition-colors p-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-4 space-y-4">
                    {/* From Source - Display only */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-2">
                            FROM
                        </label>
                        <div className="w-full px-4 py-3 border border-base-300 bg-base-300 text-base-content rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{targetCategory?.name || 'Unknown Category'}</span>
                                <span className="text-success font-bold">
                                    ${(targetCategory?.available || 0).toFixed(2)} available
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Arrow */}
                    <div className="flex justify-center py-2">
                        <div className="bg-primary/20 rounded-full p-2">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    {/* To Category */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-2">
                            MOVE TO
                        </label>
                        <select
                            value={toCategory}
                            onChange={(e) => setToCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-base-300 bg-base-100 text-base-content rounded-lg focus:border-secondary text-base"
                        >
                            <option value="">Select destination...</option>
                            {destinationOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-2">
                            AMOUNT
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/60 text-lg">
                                $
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                max={maxAmount}
                                step="0.01"
                                className="w-full pl-10 pr-4 py-3 border border-base-300 bg-base-100 text-base-content rounded-lg focus:border-primary text-lg"
                            />
                        </div>
                        {maxAmount > 0 && (
                            <div className="mt-2 flex items-center justify-between text-sm text-base-content/60">
                                <span>Maximum: ${maxAmount.toFixed(2)}</span>
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toString())}
                                    className="text-info hover:underline font-medium"
                                >
                                    Use max
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div className="space-y-3">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertStyles(alert.type)}`}
                                >
                                    {getAlertIcon(alert.type)}
                                    <span className="text-sm flex-1">{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 p-4 border-t border-base-300 sticky bottom-0 bg-base-300">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-base-content/60 bg-base-100 border border-base-300 rounded-lg hover:bg-base-200 hover:text-base-content hover:border-base-400 transition-all duration-200 flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={!canTransfer}
                        className="btn btn-primary flex-1"
                    >
                        Move Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileTransferModal;
