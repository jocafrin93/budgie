import { CheckCircle, DollarSign, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorage } from '../../hooks/useStorage';

const QuickAllocateModal = ({
    isOpen,
    onClose,
    availableToAllocate,
    categories = [],
    accounts = [],
    transactions = [],
    onBulkAllocate
}) => {
    // Use cloud storage for pending transfers
    const [pendingTransfers, setPendingTransfers] = useStorage('budgetCalc_pendingTransfers', []);

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

        // Initialize account summaries with correct account-specific calculations
        accounts.forEach(account => {
            // 1. Calculate account's working balance
            const accountTransactions = transactions?.filter(t => t.accountId === account.id) || [];
            const startingBalance = account.startingBalance || account.balance || 0;
            const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

            // 2. Find categories that are funded by this specific account
            const accountCategories = categories.filter(cat => cat.accountId === account.id);

            // 3. Calculate how much is already available in those categories
            // Only subtract available funds from categories associated with this account
            const categoryAvailableTotal = accountCategories.reduce((sum, cat) => sum + (cat.available || 0), 0);

            // 4. For Bank of America, we want $72.49 (workingBalance), for SoFi, we want $112.65 (workingBalance - categoryAvailableTotal)
            // Calculate account's available to allocate amount
            // If the account has no categories with available funds, the full working balance is available
            const accountAvailable = categoryAvailableTotal > 0 ?
                workingBalance - categoryAvailableTotal :
                workingBalance;

            console.log(`Account ${account.name}:`, {
                workingBalance,
                categoryAvailableTotal,
                accountAvailable
            });

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

        // Store pending transfer using cloud storage
        const updatedTransfers = [...pendingTransfers, pendingTransfer];
        setPendingTransfers(updatedTransfers);

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
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-base-content/50 backdrop-blur-sm transition-opacity">
                <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-2xl mx-4">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-base-300 bg-base-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center text-white">
                                🔄
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-base-content">
                                    Cross-Account Transfer Required
                                </h3>
                                <p className="text-sm text-base-content/70">
                                    You need {formatCurrency(shortfall)} more to complete this allocation
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSourceAccountModal(false)}
                            className="text-base-content/60 hover transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="bg-warning/20er/20 border border-warning-light rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-warning">⚠️</span>
                                    <span className="font-medium text-warning-darker">Insufficient Funds</span>
                                </div>
                                <p className="text-sm text-warning-dark">
                                    You&lsquo;re trying to allocate {formatCurrency(totalAllocated)} but only have {formatCurrency(availableToAllocate)} available.
                                    Choose an account to transfer {formatCurrency(shortfall)} from:
                                </p>
                            </div>
                        </div>

                        {/* Account Selection */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-base-content">Select Source Account:</h4>
                            {availableAccounts.length > 0 ? (
                                <div className="space-y-2">
                                    {availableAccounts.map(account => (
                                        <button
                                            key={account.id}
                                            onClick={() => handleSourceAccountSelection(account.id)}
                                            className="w-full flex items-center justify-between p-4 border border-base-300 rounded-lg hover transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-info/50 rounded-full flex items-center justify-center text-white text-sm">
                                                    {account.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-medium text-base-content">
                                                        {account.name}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        Available: {formatCurrency(account.balance || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-base-content/60">Transfer</div>
                                                <div className="font-medium text-info">
                                                    {formatCurrency(shortfall)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-base-content/60 mb-2">😔</div>
                                    <p className="text-base-content/70">
                                        No accounts have sufficient funds for this transfer.
                                    </p>
                                    <p className="text-sm text-base-content/60 mt-1">
                                        You need {formatCurrency(shortfall)} more to complete this allocation.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-base-300 bg-base-200">
                        <div className="text-sm text-base-content/70">
                            💡 This will create a pending transfer reminder
                        </div>
                        <button
                            onClick={() => setShowSourceAccountModal(false)}
                            className="px-4 py-2 text-base-content/60 bg-base-100 border border-base-300 rounded-lg hover:bg-base-200 hover:text-base-content hover:border-base-400 transition-all duration-200"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/50 backdrop-blur-sm transition-opacity">
                <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-base-300 bg-base-300">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white">
                                <Zap className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-base-content">
                                    Quick Allocate
                                </h3>
                                <p className="text-sm text-base-content/70">
                                    Allocate {formatCurrency(availableToAllocate)} to multiple categories at once
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-base-content/60 hover transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Summary Bar */}
                    <div className="px-6 py-4 bg-base-200 border-b border-base-300">
                        {/* View Mode Toggle */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-base-content/70">View:</span>
                                <div className="flex bg-base-100 rounded-lg p-1 border border-base-300">
                                    <button
                                        onClick={() => setViewMode('total')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'total'
                                            ? 'bg-info-lighter/50 text-base-content'
                                            : 'text-base-content/70 hover'
                                            }`}
                                    >
                                        Total Available
                                    </button>
                                    <button
                                        onClick={() => setViewMode('by-account')}
                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'by-account'
                                            ? 'bg-info-lighter/50 text-base-content'
                                            : 'text-base-content/70 hover'
                                            }`}
                                    >
                                        By Account
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={applySuggestions}
                                    className="px-3 py-1 text-sm bg-info/10 text-info rounded-lg hover:bg-info/20 hover:text-info hover:scale-105 transition-all duration-200"
                                >
                                    Use Suggestions
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="px-3 py-1 text-sm bg-base-200 text-base-content/60 rounded-lg hover:bg-base-300 hover:text-base-content hover:scale-105 transition-all duration-200"
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
                                    <span className="text-sm text-base-content/70">Available:</span>
                                    <span className="ml-2 font-semibold text-success">
                                        {formatCurrency(availableToAllocate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-base-content/70">Allocating:</span>
                                    <span className="ml-2 font-semibold text-info">
                                        {formatCurrency(totalAllocated)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm text-base-content/70">Remaining:</span>
                                    <span className={`ml-2 font-semibold ${remaining >= 0
                                        ? 'text-base-content'
                                        : 'text-error'
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
                                        className="bg-base-100 rounded-lg p-4 border border-base-300"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${summary.account.color || 'bg-base-2000'}`}></div>
                                            <span className="font-medium text-base-content">
                                                {summary.account.name}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-base-content/70">Available:</span>
                                                <span className="font-medium text-success">
                                                    {formatCurrency(summary.totalAvailable)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-base-content/70">Allocating:</span>
                                                <span className="font-medium text-info">
                                                    {formatCurrency(summary.currentlyAllocating)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t border-base-300 pt-1">
                                                <span className="text-base-content/70">Remaining:</span>
                                                <span className={`font-medium ${summary.remainingAvailable >= 0
                                                    ? 'text-base-content'
                                                    : 'text-error'
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
                                        className="flex items-center gap-4 p-4 border bg-base-200 border-base-300 rounded-lg hover transition-colors"
                                    >
                                        {/* Category Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${category.color} border border-base-300`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium text-base-content truncate">
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
                                                            className="text-xs px-2 py-1 rounded-full border border-base-300 bg-base-100 text-base-content focus:border-primary"
                                                        >
                                                            {accounts.map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {/* Show indicator if account was changed from default */}
                                                        {selectedAccounts[category.id] && selectedAccounts[category.id] !== category.accountId && (
                                                            <span className="text-warning text-xs" title="Account changed from default">
                                                                ⚡
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-base-content/70">
                                                        <span>Per paycheck: {formatCurrency(category.perPaycheck || 0)}</span>
                                                        <span>Available: {formatCurrency(category.available || 0)}</span>
                                                        {/* Account Balance Info */}
                                                        {categoryAccount && (
                                                            <span className="text-info">
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
                                                <div className="text-xs text-base-content/60">Suggested</div>
                                                <div className="font-medium text-info">
                                                    {formatCurrency(suggested)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Allocation Input */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 text-sm">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    value={allocation || ''}
                                                    onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className={`w-24 pl-6 pr-2 py-2 text-sm border rounded-lg focus:border-primary ${accountValidationInfo && !accountValidationInfo.isValid && allocation > 0
                                                        ? 'border-error bg-error/10 text-error focus:border-primary'
                                                        : 'border-base-300 bg-base-100 text-base-content focus:border-primary'
                                                        }`}
                                                />
                                            </div>
                                            {isSuggested && (
                                                <CheckCircle className="w-4 h-4 text-success" title="Using suggested amount" />
                                            )}
                                            {/* Account Validation Warning */}
                                            {accountValidationInfo && !accountValidationInfo.isValid && allocation > 0 && (
                                                <span className="text-error text-xs" title={`Exceeds ${categoryAccount?.name} balance by ${formatCurrency(accountValidationInfo.shortfall)}`}>
                                                    ⚠️
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick Amount Buttons */}
                                        <div className="flex items-center gap-1">
                                            {suggested > 0 && (
                                                <button
                                                    onClick={() => handleAllocationChange(category.id, suggested)}
                                                    className="px-2 py-1 text-xs bg-info/10 text-info rounded hover:bg-info/20 hover:text-info hover:scale-105 transition-all duration-200"
                                                    title="Use suggested amount"
                                                >
                                                    Suggested
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleAllocationChange(category.id, category.perPaycheck || 0)}
                                                className="px-2 py-1 text-xs bg-base-200 text-base-content/60 rounded hover:bg-base-300 hover:text-base-content hover:scale-105 transition-all duration-200"
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
                    <div className="flex items-center justify-between p-6 border-t border-base-300 bg-base-200">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-base-content/70">
                                {Object.keys(allocations).filter(id => parseFloat(allocations[id]) > 0).length} categories selected
                            </div>
                            {needsCrossAccountTransfer && (
                                <div className="flex items-center gap-2 text-sm text-warning">
                                    <span>⚠️</span>
                                    <span>Cross-account transfer needed</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-base-content/60 bg-base-100 border border-base-300 rounded-lg hover:bg-base-200 hover:text-base-content hover:border-base-400 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAllocate}
                                disabled={!canAllocate}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-200 ${canAllocate
                                    ? needsCrossAccountTransfer
                                        ? 'bg-warning hover:bg-warning/90 hover:scale-105 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-success hover:bg-success/90 hover:scale-105 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-base-300 text-base-content/60 cursor-not-allowed'
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
