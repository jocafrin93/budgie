import { CheckCircle, DollarSign, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const QuickAllocateModal = ({
    isOpen,
    onClose,
    availableToAllocate,
    categories = [],
    accounts = [],
    onBulkAllocate
}) => {
    const [allocations, setAllocations] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showSourceAccountModal, setShowSourceAccountModal] = useState(false);
    const [pendingAllocations, setPendingAllocations] = useState([]);
    const [viewMode, setViewMode] = useState('total'); // 'total' or 'by-account'
    const [selectedAccounts, setSelectedAccounts] = useState({}); // Track account selection per category

    // Calculate suggested allocations based on category needs
    const suggestedAllocations = useMemo(() => {
        const suggestions = {};
        let totalSuggested = 0;

        categories.forEach(category => {
            // Calculate suggested amount based on per-paycheck need
            const suggested = Math.min(
                category.perPaycheck || 0,
                availableToAllocate - totalSuggested
            );

            if (suggested > 0) {
                suggestions[category.id] = suggested;
                totalSuggested += suggested;
            }
        });

        return suggestions;
    }, [categories, availableToAllocate]);

    // Reset allocations when modal opens
    useEffect(() => {
        if (isOpen) {
            if (showSuggestions) {
                setAllocations(suggestedAllocations);
            } else {
                setAllocations({});
            }
            // Initialize selected accounts with category defaults
            const defaultAccounts = {};
            categories.forEach(category => {
                defaultAccounts[category.id] = category.accountId || accounts[0]?.id;
            });
            setSelectedAccounts(defaultAccounts);
        }
    }, [isOpen, suggestedAllocations, showSuggestions, categories, accounts]);

    // Calculate totals and account-specific validation
    const { totalAllocated, remaining, accountValidation, accountSummaries } = useMemo(() => {
        const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        const remaining = availableToAllocate - totalAllocated;

        // Calculate per-account allocations and validation
        const accountAllocations = {};
        const accountValidation = {};
        const accountSummaries = {};

        // Initialize account summaries for all accounts
        accounts.forEach(account => {
            // Calculate account's available balance (working balance - already allocated)
            const accountTransactions = []; // Empty for now - will be populated when transaction management is implemented
            const startingBalance = account.startingBalance || account.balance || 0;
            const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

            // Get already allocated amount for this account's categories
            const accountCategories = categories.filter(cat => cat.accountId === account.id);
            const alreadyAllocated = accountCategories.reduce((sum, cat) => sum + (cat.allocated || 0), 0);
            const accountAvailable = workingBalance - alreadyAllocated;

            accountSummaries[account.id] = {
                account,
                totalAvailable: accountAvailable,
                currentlyAllocating: 0,
                remainingAvailable: accountAvailable
            };
        });

        // Group allocations by account (using selected accounts)
        categories.forEach(category => {
            const allocation = parseFloat(allocations[category.id]) || 0;
            if (allocation > 0) {
                const accountId = selectedAccounts[category.id] || category.accountId || accounts[0]?.id;
                if (!accountAllocations[accountId]) {
                    accountAllocations[accountId] = 0;
                }
                accountAllocations[accountId] += allocation;

                // Update account summary
                if (accountSummaries[accountId]) {
                    accountSummaries[accountId].currentlyAllocating += allocation;
                    accountSummaries[accountId].remainingAvailable = accountSummaries[accountId].totalAvailable - accountSummaries[accountId].currentlyAllocating;
                }
            }
        });

        // Validate each account's available balance
        Object.keys(accountAllocations).forEach(accountId => {
            const account = accounts.find(a => a.id === parseInt(accountId));
            const accountAllocation = accountAllocations[accountId];

            if (account && accountSummaries[accountId]) {
                accountValidation[accountId] = {
                    account,
                    allocated: accountAllocation,
                    available: accountSummaries[accountId].totalAvailable,
                    shortfall: Math.max(0, accountAllocation - accountSummaries[accountId].totalAvailable),
                    isValid: accountAllocation <= accountSummaries[accountId].totalAvailable
                };
            }
        });

        return { totalAllocated, remaining, accountValidation, accountSummaries };
    }, [allocations, availableToAllocate, categories, accounts]);

    // Handle individual allocation change
    const handleAllocationChange = useCallback((categoryId, value) => {
        const numValue = parseFloat(value) || 0;
        setAllocations(prev => ({
            ...prev,
            [categoryId]: numValue
        }));
    }, []);

    // Apply suggested amounts
    const applySuggestions = useCallback(() => {
        setAllocations(suggestedAllocations);
        setShowSuggestions(true);
    }, [suggestedAllocations]);

    // Clear all allocations
    const clearAll = useCallback(() => {
        setAllocations({});
        setShowSuggestions(false);
    }, []);

    // Cross-account validation logic
    const validateCrossAccountAllocation = useCallback((allocationsToApply) => {
        // Check if we have insufficient funds and need cross-account transfers
        const shortfall = Math.abs(Math.min(0, remaining));

        if (shortfall > 0) {
            // We need cross-account transfers
            setPendingAllocations(allocationsToApply);
            setShowSourceAccountModal(true);
            return false; // Don't proceed with allocation yet
        }

        return true; // Sufficient funds, can proceed
    }, [remaining]);

    // Handle bulk allocation with cross-account validation
    const handleBulkAllocate = useCallback(() => {
        const allocationsToApply = Object.entries(allocations)
            .filter(([, amount]) => parseFloat(amount) > 0)
            .map(([categoryId, amount]) => ({
                categoryId: parseInt(categoryId, 10),
                amount: parseFloat(amount)
            }));

        if (allocationsToApply.length > 0) {
            // Validate cross-account requirements
            if (validateCrossAccountAllocation(allocationsToApply)) {
                // Sufficient funds - proceed directly
                onBulkAllocate?.(allocationsToApply);
                onClose();
            }
            // If insufficient funds, the source account modal will be shown
        }
    }, [allocations, validateCrossAccountAllocation, onBulkAllocate, onClose]);

    // Handle source account selection and create pending transfers
    const handleSourceAccountSelection = useCallback((sourceAccountId) => {
        const shortfall = Math.abs(Math.min(0, remaining));

        // Create pending transfer record
        const pendingTransfer = {
            id: `transfer-${Date.now()}`,
            fromAccountId: sourceAccountId,
            toAccountId: 1, // Assuming primary account ID is 1 - this should be dynamic
            amount: shortfall,
            reason: `Cross-account allocation for ${pendingAllocations.length} categories`,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // Store pending transfer in localStorage
        const existingTransfers = JSON.parse(localStorage.getItem('budgetCalc_pendingTransfers') || '[]');
        existingTransfers.push(pendingTransfer);
        localStorage.setItem('budgetCalc_pendingTransfers', JSON.stringify(existingTransfers));

        // Now proceed with the original allocations
        onBulkAllocate?.(pendingAllocations);

        // Close modals
        setShowSourceAccountModal(false);
        onClose();
    }, [remaining, pendingAllocations, onBulkAllocate, onClose]);

    // Format currency
    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    };

    if (!isOpen) return null;

    const canAllocate = totalAllocated > 0;
    const needsCrossAccountTransfer = remaining < 0;

    // Source Account Selection Modal Component
    const SourceAccountSelectionModal = () => {
        const shortfall = Math.abs(Math.min(0, remaining));
        const availableAccounts = accounts.filter(account =>
            account.id !== 1 && // Don't show primary account as source
            (account.balance || 0) >= shortfall // Only show accounts with sufficient funds
        );

        return (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40">
                <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center text-white">
                                🔄
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Cross-Account Transfer Required
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    You need {formatCurrency(shortfall)} more to complete this allocation
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSourceAccountModal(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="bg-warning-lighter/20 dark:bg-warning/20 border border-warning-light dark:border-warning rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-warning dark:text-warning-light">⚠️</span>
                                    <span className="font-medium text-warning-darker dark:text-warning-lighter">Insufficient Funds</span>
                                </div>
                                <p className="text-sm text-warning-dark dark:text-warning-light">
                                    You&lsquo;re trying to allocate {formatCurrency(totalAllocated)} but only have {formatCurrency(availableToAllocate)} available.
                                    Choose an account to transfer {formatCurrency(shortfall)} from:
                                </p>
                            </div>
                        </div>

                        {/* Account Selection */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 dark:text-dark-100">Select Source Account:</h4>
                            {availableAccounts.length > 0 ? (
                                <div className="space-y-2">
                                    {availableAccounts.map(account => (
                                        <button
                                            key={account.id}
                                            onClick={() => handleSourceAccountSelection(account.id)}
                                            className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-info/50 rounded-full flex items-center justify-center text-white text-sm">
                                                    {account.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-gray-900 dark:text-dark-100">
                                                        {account.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-dark-400">
                                                        Available: {formatCurrency(account.balance || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 dark:text-dark-400">Transfer</div>
                                                <div className="font-medium text-info-600 dark:text-info-400">
                                                    {formatCurrency(shortfall)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-dark-400 mb-2">😔</div>
                                    <p className="text-gray-600 dark:text-dark-400">
                                        No accounts have sufficient funds for this transfer.
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-dark-500 mt-1">
                                        You need {formatCurrency(shortfall)} more to complete this allocation.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-750">
                        <div className="text-sm text-gray-600 dark:text-dark-400">
                            💡 This will create a pending transfer reminder
                        </div>
                        <button
                            onClick={() => setShowSourceAccountModal(false)}
                            className="px-4 py-2 text-gray-700 dark:text-dark-300 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Main Quick Allocate Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40">
                <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    Quick Allocate
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Allocate {formatCurrency(availableToAllocate)} to multiple categories at once
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Summary Bar */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-dark-750 border-b border-gray-200 dark:border-dark-600">
                        {/* View Mode Toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-dark-400">View:</span>
                                <div className="flex bg-white dark:bg-dark-700 rounded-lg p-1 border border-gray-200 dark:border-dark-600">
                                    <button
                                        onClick={() => setViewMode('total')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'total'
                                            ? 'bg-info/50 text-white'
                                            : 'text-gray-600 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        Total Available
                                    </button>
                                    <button
                                        onClick={() => setViewMode('by-account')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'by-account'
                                            ? 'bg-info/50 text-white'
                                            : 'text-gray-600 dark:text-dark-400 hover:bg-gray-100 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        By Account
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={applySuggestions}
                                    className="px-3 py-1 text-sm bg-info/10 dark:bg-info/20/30 text-info-700 dark:text-info-300 rounded-lg hover:bg-info/20 dark:hover:bg-info/20/50 transition-colors"
                                >
                                    Use Suggestions
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-dark-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Summary Display */}
                        {viewMode === 'total' ? (
                            // Total View
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-dark-400">Available:</span>
                                    <span className="ml-2 font-semibold text-success dark:text-success-light">
                                        {formatCurrency(availableToAllocate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-dark-400">Allocating:</span>
                                    <span className="ml-2 font-semibold text-info-600 dark:text-info-400">
                                        {formatCurrency(totalAllocated)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-dark-400">Remaining:</span>
                                    <span className={`ml-2 font-semibold ${remaining >= 0
                                        ? 'text-gray-900 dark:text-dark-100'
                                        : 'text-error dark:text-error-light'
                                        }`}>
                                        {formatCurrency(remaining)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            // By Account View
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(accountSummaries).map(summary => (
                                    <div
                                        key={summary.account.id}
                                        className="bg-white dark:bg-dark-700 rounded-lg p-4 border border-gray-200 dark:border-dark-600"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${summary.account.color || 'bg-gray-500'}`}></div>
                                            <span className="font-medium text-gray-900 dark:text-dark-100">
                                                {summary.account.name}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-dark-400">Available:</span>
                                                <span className="font-medium text-success dark:text-success-light">
                                                    {formatCurrency(summary.totalAvailable)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-dark-400">Allocating:</span>
                                                <span className="font-medium text-info-600 dark:text-info-400">
                                                    {formatCurrency(summary.currentlyAllocating)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t border-gray-200 dark:border-dark-600 pt-1">
                                                <span className="text-gray-600 dark:text-dark-400">Remaining:</span>
                                                <span className={`font-medium ${summary.remainingAvailable >= 0
                                                    ? 'text-gray-900 dark:text-dark-100'
                                                    : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {formatCurrency(summary.remainingAvailable)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Categories List */}
                    <div className="overflow-y-auto max-h-96">
                        <div className="p-6 space-y-3">
                            {categories.map(category => {
                                const allocation = allocations[category.id] || 0;
                                const suggested = suggestedAllocations[category.id] || 0;
                                const isSuggested = allocation === suggested && suggested > 0;

                                // Get account info for this category (use selected account if available)
                                const selectedAccountId = selectedAccounts[category.id] || category.accountId || accounts[0]?.id;
                                const categoryAccount = accounts.find(acc => acc.id === selectedAccountId) || accounts[0];
                                const accountValidationInfo = accountValidation[selectedAccountId];

                                return (
                                    <div
                                        key={category.id}
                                        className="flex items-center gap-4 p-4 border border-gray-200 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-750 transition-colors"
                                    >
                                        {/* Category Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${category.color} border border-gray-200 dark:border-dark-600`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-gray-900 dark:text-dark-100 truncate">
                                                            {category.name}
                                                        </h4>
                                                        {/* Account Selection Dropdown */}
                                                        <select
                                                            value={selectedAccounts[category.id] || category.accountId || accounts[0]?.id || ''}
                                                            onChange={(e) => {
                                                                const newAccountId = parseInt(e.target.value);
                                                                setSelectedAccounts(prev => ({
                                                                    ...prev,
                                                                    [category.id]: newAccountId
                                                                }));
                                                            }}
                                                            className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 focus:ring-2 focus:ring-info-500 focus:border-transparent"
                                                        >
                                                            {accounts.map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {/* Show indicator if account was changed from default */}
                                                        {selectedAccounts[category.id] && selectedAccounts[category.id] !== category.accountId && (
                                                            <span className="text-orange-500 text-xs" title="Account changed from default">
                                                                ⚡
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-400">
                                                        <span>Per paycheck: {formatCurrency(category.perPaycheck || 0)}</span>
                                                        <span>Available: {formatCurrency(category.available || 0)}</span>
                                                        {/* Account Balance Info */}
                                                        {categoryAccount && (
                                                            <span className="text-info-600 dark:text-info-400">
                                                                Account: {formatCurrency(categoryAccount.balance || 0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Suggested Amount */}
                                        {suggested > 0 && (
                                            <div className="text-center">
                                                <div className="text-xs text-gray-500 dark:text-dark-400">Suggested</div>
                                                <div className="font-medium text-info-600 dark:text-info-400">
                                                    {formatCurrency(suggested)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Allocation Input */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-400 text-sm">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    value={allocation || ''}
                                                    onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-24 pl-6 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent ${accountValidationInfo && !accountValidationInfo.isValid && allocation > 0
                                                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 focus:ring-red-500'
                                                        : 'border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 focus:ring-info-500'
                                                        }`}
                                                />
                                            </div>
                                            {isSuggested && (
                                                <CheckCircle className="w-4 h-4 text-green-500" title="Using suggested amount" />
                                            )}
                                            {/* Account Validation Warning */}
                                            {accountValidationInfo && !accountValidationInfo.isValid && allocation > 0 && (
                                                <span className="text-red-500 text-xs" title={`Exceeds ${categoryAccount?.name} balance by ${formatCurrency(accountValidationInfo.shortfall)}`}>
                                                    ⚠️
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Amount Buttons */}
                                        <div className="flex items-center gap-1">
                                            {suggested > 0 && (
                                                <button
                                                    onClick={() => handleAllocationChange(category.id, suggested)}
                                                    className="px-2 py-1 text-xs bg-info/10 dark:bg-info/20/30 text-info-700 dark:text-info-300 rounded hover:bg-info/20 dark:hover:bg-info/20/50 transition-colors"
                                                    title="Use suggested amount"
                                                >
                                                    Suggested
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAllocationChange(category.id, category.perPaycheck || 0)}
                                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-dark-300 rounded hover:bg-gray-200 dark:hover:bg-dark-500 transition-colors"
                                                title="Use full per-paycheck amount"
                                            >
                                                Full
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-750">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 dark:text-dark-400">
                                {Object.keys(allocations).filter(id => parseFloat(allocations[id]) > 0).length} categories selected
                            </div>
                            {needsCrossAccountTransfer && (
                                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                    <span>⚠️</span>
                                    <span>Cross-account transfer needed</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-dark-300 bg-white dark:bg-dark-600 border border-gray-300 dark:border-dark-500 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAllocate}
                                disabled={!canAllocate}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${canAllocate
                                    ? needsCrossAccountTransfer
                                        ? 'bg-warning hover:bg-warning-dark text-white'
                                        : 'bg-success hover:bg-success-dark text-white'
                                    : 'bg-gray-300 dark:bg-dark-600 text-gray-500 dark:text-dark-400 cursor-not-allowed'
                                    }`}
                            >
                                {needsCrossAccountTransfer ? (
                                    <>
                                        <span>🔄</span>
                                        Transfer & Allocate {formatCurrency(totalAllocated)}
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-4 h-4" />
                                        Allocate {formatCurrency(totalAllocated)}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Source Account Selection Modal */}
            {showSourceAccountModal && <SourceAccountSelectionModal />}
        </>
    );
};

export default QuickAllocateModal;
