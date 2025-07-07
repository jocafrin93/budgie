import { AlertTriangle, ArrowRight, CheckCircle, Info, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountManagement } from '../../hooks/useAccountManagement';
import { useEnvelopeBudgeting } from '../../hooks/useEnvelopeBudgeting';

const TransferModal = ({
    isOpen,
    onClose,
    targetCategory,
    categories = [],
    activeBudgetAllocations = [],
    onTransferComplete
}) => {
    const [fromSource, setFromSource] = useState('');
    const [toCategory, setToCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [alerts, setAlerts] = useState([]);

    const { accounts } = useAccountManagement();
    const { createMoveMoneyUpdates, calculateToBeAllocated } = useEnvelopeBudgeting({
        categories,
        accounts
    });

    // Calculate "To be allocated" amount
    const toBeAllocated = useMemo(() => {
        return calculateToBeAllocated();
    }, [calculateToBeAllocated]);

    // Get funding account for a category
    const getCategoryFundingAccount = useCallback((categoryId) => {
        const allocation = activeBudgetAllocations.find(a => a.categoryId === categoryId);
        const accountId = allocation?.sourceAccountId;
        return accounts.find(acc => acc.id === accountId);
    }, [activeBudgetAllocations, accounts]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && targetCategory) {
            // Default to transferring INTO the target category
            setToCategory(targetCategory.id);

            // Default source to "To be allocated" if available, otherwise blank
            if (toBeAllocated > 0) {
                setFromSource('to-be-allocated');
            } else {
                setFromSource('');
            }

            setAmount('');
            setAlerts([]);
        } else if (!isOpen) {
            // Reset form when closing
            setFromSource('');
            setToCategory('');
            setAmount('');
            setAlerts([]);
        }
    }, [isOpen, targetCategory, toBeAllocated]);

    // Calculate alerts when form changes
    useEffect(() => {
        if (!fromSource || !toCategory || !amount || parseFloat(amount) <= 0) {
            setAlerts([]);
            return;
        }

        const transferAmount = parseFloat(amount);
        const newAlerts = [];

        if (fromSource === 'to-be-allocated') {
            // Transferring from unallocated funds
            if (transferAmount > toBeAllocated) {
                newAlerts.push({
                    type: 'error',
                    message: `Not enough unallocated funds. Available: $${toBeAllocated.toFixed(2)}`
                });
            } else {
                newAlerts.push({
                    type: 'success',
                    message: `Allocating $${transferAmount.toFixed(2)} from unassigned funds`
                });
            }
        } else {
            // Transferring between categories
            const fromCategoryId = parseInt(fromSource, 10);
            const toCategoryId = parseInt(toCategory, 10);

            const fromCategory = categories.find(c => c.id === fromCategoryId);
            const toCategory = categories.find(c => c.id === toCategoryId);

            if (fromCategory && toCategory) {
                // Check if source category has enough funds
                const fromAvailable = fromCategory.available || 0;
                if (transferAmount > fromAvailable) {
                    newAlerts.push({
                        type: 'error',
                        message: `${fromCategory.name} only has $${fromAvailable.toFixed(2)} available`
                    });
                } else {
                    // Check account implications
                    const fromAccount = getCategoryFundingAccount(fromCategoryId);
                    const toAccount = getCategoryFundingAccount(toCategoryId);

                    if (fromAccount && toAccount) {
                        if (fromAccount.id === toAccount.id) {
                            // Same account transfer
                            newAlerts.push({
                                type: 'success',
                                message: `Moving money within ${fromAccount.name} - no account transfer needed`
                            });
                        } else {
                            // Cross-account transfer
                            newAlerts.push({
                                type: 'warning',
                                message: `Remember to transfer $${transferAmount.toFixed(2)} from ${fromAccount.name} to ${toAccount.name} to keep accounts balanced`
                            });

                            // Check if source account has sufficient balance
                            if (fromAccount.balance < transferAmount) {
                                newAlerts.push({
                                    type: 'info',
                                    message: `Note: ${fromAccount.name} balance ($${fromAccount.balance.toFixed(2)}) is less than transfer amount`
                                });
                            }
                        }
                    }
                }
            }
        }

        setAlerts(newAlerts);
    }, [fromSource, toCategory, amount, categories, toBeAllocated, accounts, activeBudgetAllocations, getCategoryFundingAccount]);

    // Get available source options
    const sourceOptions = useMemo(() => {
        const options = [];

        // Add "To be allocated" if there are unallocated funds
        if (toBeAllocated > 0) {
            options.push({
                value: 'to-be-allocated',
                label: `To be allocated ($${toBeAllocated.toFixed(2)} available)`,
                available: toBeAllocated,
                account: null
            });
        }

        // Add categories with available funds
        categories.forEach(category => {
            if (category.available > 0 && category.id !== parseInt(toCategory, 10)) {
                const account = getCategoryFundingAccount(category.id);
                options.push({
                    value: category.id.toString(),
                    label: `${category.name} ($${category.available.toFixed(2)} available)${account ? ` - ${account.name}` : ''}`,
                    available: category.available,
                    account
                });
            }
        });

        return options;
    }, [categories, toBeAllocated, toCategory, getCategoryFundingAccount]);

    // Get destination category options
    const destinationOptions = useMemo(() => {
        return categories.map(category => {
            const account = getCategoryFundingAccount(category.id);
            return {
                value: category.id.toString(),
                label: `${category.name}${account ? ` - ${account.name}` : ''}`,
                account
            };
        });
    }, [categories, getCategoryFundingAccount]);

    const handleTransfer = () => {
        console.log('🔄 Transfer initiated');
        console.log('📊 Transfer details:', { fromSource, toCategory, amount });

        if (!fromSource || !toCategory || !amount) {
            console.log('❌ Missing required fields:', { fromSource, toCategory, amount });
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

        console.log('✅ Transfer validation passed');

        try {
            if (fromSource === 'to-be-allocated') {
                console.log('💰 Handling allocation from unassigned funds');
                const transferData = {
                    type: 'allocation',
                    fromSource: 'unallocated',
                    toCategory: parseInt(toCategory, 10),
                    amount: transferAmount,
                    alerts: alerts.filter(alert => alert.type !== 'error')
                };
                console.log('📤 Calling onTransferComplete with:', transferData);
                console.log('🔗 onTransferComplete function:', onTransferComplete);

                onTransferComplete?.(transferData);
            } else {
                console.log('🔄 Handling category-to-category transfer');
                const fromCategoryId = parseInt(fromSource, 10);
                const toCategoryId = parseInt(toCategory, 10);

                console.log('🏗️ Creating move money updates...');
                console.log('📋 createMoveMoneyUpdates function:', createMoveMoneyUpdates);

                const transferUpdates = createMoveMoneyUpdates(fromCategoryId, toCategoryId, transferAmount);
                console.log('📊 Transfer updates result:', transferUpdates);

                if (transferUpdates) {
                    const transferData = {
                        type: 'transfer',
                        fromCategory: fromCategoryId,
                        toCategory: toCategoryId,
                        amount: transferAmount,
                        updates: transferUpdates.updates,
                        alerts: alerts.filter(alert => alert.type !== 'error')
                    };
                    console.log('📤 Calling onTransferComplete with:', transferData);
                    console.log('🔗 onTransferComplete function:', onTransferComplete);

                    onTransferComplete?.(transferData);
                } else {
                    console.log('❌ createMoveMoneyUpdates returned null/undefined');
                }
            }

            console.log('🚪 Closing modal');
            onClose();
        } catch (error) {
            console.error('💥 Transfer failed with error:', error);
            setAlerts(prev => [...prev, {
                type: 'error',
                message: 'Transfer failed. Please try again.'
            }]);
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            case 'info':
                return <Info className="w-4 h-4 text-blue-600" />;
            default:
                return null;
        }
    };

    const getAlertStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    if (!isOpen) return null;

    const maxAmount = fromSource === 'to-be-allocated'
        ? toBeAllocated
        : sourceOptions.find(opt => opt.value === fromSource)?.available || 0;

    const canTransfer = fromSource && toCategory && amount && parseFloat(amount) > 0 &&
        !alerts.some(alert => alert.type === 'error');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
                        Transfer Money
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* From Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                            FROM
                        </label>
                        <select
                            value={fromSource}
                            onChange={(e) => setFromSource(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select source...</option>
                            {sourceOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transfer Arrow */}
                    <div className="flex justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* To Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                            TO
                        </label>
                        <select
                            value={toCategory}
                            onChange={(e) => setToCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                            AMOUNT
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-400">
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
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {maxAmount > 0 && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                                Maximum: ${maxAmount.toFixed(2)}
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toString())}
                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Use max
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div className="space-y-2">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-2 p-3 rounded-lg border ${getAlertStyles(alert.type)}`}
                                >
                                    {getAlertIcon(alert.type)}
                                    <span className="text-sm">{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-600">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-dark-300 bg-gray-100 dark:bg-dark-600 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={!canTransfer}
                        className={`px-4 py-2 rounded-lg transition-colors ${canTransfer
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-dark-600 text-gray-500 dark:text-dark-400 cursor-not-allowed'
                            }`}
                    >
                        Transfer Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
