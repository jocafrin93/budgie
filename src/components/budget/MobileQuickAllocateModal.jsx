import { CheckCircle, DollarSign, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const MobileQuickAllocateModal = ({
    isOpen,
    onClose,
    availableToAllocate,
    categories = [],
    onBulkAllocate
}) => {
    const [allocations, setAllocations] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(true);

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
        }
    }, [isOpen, suggestedAllocations, showSuggestions]);

    // Calculate totals
    const { totalAllocated, remaining } = useMemo(() => {
        const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        const remaining = availableToAllocate - totalAllocated;
        return { totalAllocated, remaining };
    }, [allocations, availableToAllocate]);

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

    // Handle bulk allocation
    const handleBulkAllocate = useCallback(() => {
        const allocationsToApply = Object.entries(allocations)
            .filter(([, amount]) => parseFloat(amount) > 0)
            .map(([categoryId, amount]) => ({
                categoryId: parseInt(categoryId, 10),
                amount: parseFloat(amount)
            }));

        if (allocationsToApply.length > 0) {
            onBulkAllocate?.(allocationsToApply);
            onClose();
        }
    }, [allocations, onBulkAllocate, onClose]);

    // Format currency
    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    };

    if (!isOpen) return null;

    const canAllocate = totalAllocated > 0;
    const isOverAllocated = remaining < 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40 md:items-center">
            <div className="bg-white dark:bg-dark-800 rounded-t-lg md:rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden md:max-h-[80vh] mb-16 md:mb-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-600">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Quick Allocate
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(availableToAllocate)} available
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary Bar */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Allocating:</span>
                                <span className="ml-1 font-semibold text-info-600 dark:text-info-400">
                                    {formatCurrency(totalAllocated)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                                <span className={`ml-1 font-semibold ${remaining >= 0
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-error dark:text-error-light'
                                    }`}>
                                    {formatCurrency(remaining)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={applySuggestions}
                                className="px-2 py-1 text-xs bg-info/10 dark:bg-info/20/30 text-info-700 dark:text-info-300 rounded hover:bg-info/20 dark:hover:bg-info/20/50 transition-colors"
                            >
                                Suggest
                            </button>
                            <button
                                onClick={clearAll}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${isOverAllocated ? 'bg-error' : 'bg-success'
                                }`}
                            style={{ width: `${Math.min(100, (totalAllocated / availableToAllocate) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Categories List */}
                <div className="overflow-y-auto max-h-96">
                    <div className="p-4 space-y-3">
                        {categories.map(category => {
                            const allocation = allocations[category.id] || 0;
                            const suggested = suggestedAllocations[category.id] || 0;
                            const isSuggested = allocation === suggested && suggested > 0;

                            return (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                                >
                                    {/* Category Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-3 h-3 rounded-full ${category.color} border border-gray-200 dark:border-gray-600`}></div>
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                                {category.name}
                                            </h4>
                                            {isSuggested && (
                                                <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                            <span>Need: {formatCurrency(category.perPaycheck || 0)}</span>
                                            <span>Available: {formatCurrency(category.available || 0)}</span>
                                        </div>
                                    </div>

                                    {/* Allocation Input */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                value={allocation || ''}
                                                onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                                                placeholder="0"
                                                min="0"
                                                step="0.01"
                                                className="w-20 pl-5 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-info-500 focus:border-transparent"
                                            />
                                        </div>
                                        {suggested > 0 && (
                                            <button
                                                onClick={() => handleAllocationChange(category.id, suggested)}
                                                className="px-2 py-1 text-xs bg-info/10 dark:bg-info/20/30 text-info-700 dark:text-info-300 rounded hover:bg-info/20 dark:hover:bg-info/20/50 transition-colors"
                                            >
                                                {formatCurrency(suggested)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {Object.keys(allocations).filter(id => parseFloat(allocations[id]) > 0).length} categories
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkAllocate}
                            disabled={!canAllocate}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${canAllocate
                                ? isOverAllocated
                                    ? 'bg-warning hover:bg-warning-dark text-white'
                                    : 'bg-success hover:bg-success-dark text-white'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <DollarSign className="w-4 h-4" />
                            Allocate {formatCurrency(totalAllocated)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileQuickAllocateModal;
