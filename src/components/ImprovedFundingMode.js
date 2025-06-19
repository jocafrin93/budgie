import React, { useState, useMemo, useEffect } from 'react';
import {
    DollarSign,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Zap,
    Target,
    Calendar,
    Clock,
    ArrowRight,
    Wallet,
    Calculator,
    Lightbulb,
    PieChart,
    RefreshCw
} from 'lucide-react';
import CurrencyInput from './CurrencyInput';

// Smart Funding Suggestion Card
const FundingSuggestion = ({
    suggestion,
    onAccept,
    onCustomAmount,
    availableFunds
}) => {
    const [customAmount, setCustomAmount] = useState(suggestion.amount);

    const getPriorityColor = () => {
        switch (suggestion.priority) {
            case 'critical': return 'border-red-400 bg-red-50 dark:bg-red-900/20';
            case 'high': return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
            case 'medium': return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
            default: return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const getPriorityIcon = () => {
        switch (suggestion.priority) {
            case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
            case 'high': return <TrendingUp className="w-4 h-4 text-orange-600" />;
            case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
            default: return <Target className="w-4 h-4 text-blue-600" />;
        }
    };

    return (
        <div className={`p-4 rounded-lg border-2 ${getPriorityColor()}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                    {getPriorityIcon()}
                    <div className="flex-1">
                        <h4 className="font-semibold text-theme-primary">{suggestion.categoryName}</h4>
                        <p className="text-sm text-theme-secondary mt-1">{suggestion.reason}</p>

                        {suggestion.urgentItems && suggestion.urgentItems.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-theme-tertiary">Upcoming:</p>
                                <div className="text-xs text-theme-secondary">
                                    {suggestion.urgentItems.slice(0, 2).map(item => (
                                        <div key={item.id} className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{item.name} - ${item.amount}</span>
                                            {item.dueDate && (
                                                <span className="text-theme-tertiary">
                                                    ({new Date(item.dueDate).toLocaleDateString()})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {suggestion.urgentItems.length > 2 && (
                                        <div className="text-theme-tertiary">
                                            +{suggestion.urgentItems.length - 2} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-lg font-bold text-theme-primary">
                        ${suggestion.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-theme-secondary">
                        {suggestion.priority.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <CurrencyInput
                        value={customAmount}
                        onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                        className="w-24 text-sm"
                    />
                    <button
                        onClick={() => onCustomAmount(suggestion.categoryId, customAmount)}
                        disabled={customAmount <= 0 || customAmount > availableFunds}
                        className="btn-secondary px-3 py-1 text-sm rounded disabled:opacity-50"
                    >
                        Fund Custom
                    </button>
                </div>

                <button
                    onClick={() => onAccept(suggestion)}
                    disabled={suggestion.amount > availableFunds}
                    className="btn-success px-4 py-2 text-sm rounded disabled:opacity-50 flex items-center space-x-1"
                >
                    <span>Fund ${suggestion.amount.toFixed(0)}</span>
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

// Funding Allocation Summary
const AllocationSummary = ({ allocations, totalBudget }) => {
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const remaining = totalBudget - totalAllocated;

    return (
        <div className="bg-theme-secondary rounded-lg p-4">
            <h3 className="font-semibold text-theme-primary mb-3 flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                Funding Allocation Summary
            </h3>

            <div className="space-y-2">
                {allocations.map(allocation => (
                    <div key={allocation.categoryId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${allocation.categoryColor}`}></div>
                            <span className="text-theme-primary">{allocation.categoryName}</span>
                        </div>
                        <span className="font-medium text-theme-primary">
                            ${allocation.amount.toFixed(2)}
                        </span>
                    </div>
                ))}

                <div className="border-t border-theme-primary pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                        <span className="text-theme-primary">Remaining</span>
                        <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${remaining.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Improved Funding Mode Component
const ImprovedFundingMode = ({
    categories,
    availableFunds: initialAvailableFunds,
    onFundCategory,
    paySchedule,
    planningItems = [],
    activeBudgetAllocations = []
}) => {
    const [availableFunds, setAvailableFunds] = useState(initialAvailableFunds);
    const [fundingAllocations, setFundingAllocations] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setAvailableFunds(initialAvailableFunds);
    }, [initialAvailableFunds]);


    // Calculate funding needs and priorities
    const fundingAnalysis = useMemo(() => {
        const categoryAnalysis = categories.map(category => {
            // Get active items for this category
            const activeItems = planningItems.filter(item =>
                item.categoryId === category.id && item.isActive
            );

            // Calculate monthly needs
            const monthlyNeeds = activeItems.reduce((total, item) => {
                if (item.type === 'savings-goal') {
                    return total + (item.monthlyContribution || 0);
                } else {
                    const frequencyMap = {
                        'weekly': item.amount * 4.33,
                        'bi-weekly': item.amount * 2.17,
                        'monthly': item.amount,
                        'quarterly': item.amount / 3,
                        'annually': item.amount / 12
                    };
                    return total + (frequencyMap[item.frequency] || item.amount);
                }
            }, 0);

            // Current envelope balance
            const currentBalance = (category.allocated || 0) - (category.spent || 0);
            const shortfall = Math.max(0, monthlyNeeds - currentBalance);

            // Find urgent items (due soon)
            const urgentItems = activeItems.filter(item => {
                if (item.dueDate) {
                    const dueDate = new Date(item.dueDate);
                    const now = new Date();
                    const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
                    return daysUntilDue <= 30 && daysUntilDue >= 0;
                }
                return false;
            }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            // Calculate priority
            let priority = 'low';
            let priorityScore = 0;

            if (currentBalance < 0) {
                priority = 'critical';
                priorityScore = 100;
            } else if (urgentItems.length > 0) {
                const nearestDue = Math.min(...urgentItems.map(item =>
                    (new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                ));
                if (nearestDue <= 7) {
                    priority = 'critical';
                    priorityScore = 90;
                } else if (nearestDue <= 14) {
                    priority = 'high';
                    priorityScore = 75;
                } else {
                    priority = 'medium';
                    priorityScore = 50;
                }
            } else if (shortfall > 0) {
                if (shortfall >= monthlyNeeds * 0.5) {
                    priority = 'high';
                    priorityScore = 60;
                } else {
                    priority = 'medium';
                    priorityScore = 30;
                }
            }

            // Determine funding reason
            let reason = 'Maintain healthy balance';
            if (currentBalance < 0) {
                reason = 'Negative balance - needs immediate funding';
            } else if (urgentItems.length > 0) {
                reason = `${urgentItems.length} item(s) due within 30 days`;
            } else if (shortfall > 0) {
                reason = `$${shortfall.toFixed(0)} short for monthly needs`;
            }

            return {
                categoryId: category.id,
                categoryName: category.name,
                categoryColor: category.color,
                monthlyNeeds,
                currentBalance,
                shortfall,
                urgentItems,
                priority,
                priorityScore,
                reason,
                suggestedAmount: Math.min(shortfall || monthlyNeeds * 0.25, availableFunds)
            };
        }).filter(analysis => analysis.shortfall > 0 || analysis.urgentItems.length > 0)
            .sort((a, b) => b.priorityScore - a.priorityScore);

        return categoryAnalysis;
    }, [categories, planningItems, availableFunds]);

    // Generate smart funding suggestions
    const smartSuggestions = useMemo(() => {
        let remainingFunds = availableFunds;
        const suggestions = [];

        fundingAnalysis.forEach(analysis => {
            if (remainingFunds <= 0) return;

            const suggestedAmount = Math.min(
                analysis.shortfall || analysis.monthlyNeeds * 0.25,
                remainingFunds
            );

            if (suggestedAmount > 0) {
                suggestions.push({
                    categoryId: analysis.categoryId,
                    categoryName: analysis.categoryName,
                    amount: suggestedAmount,
                    priority: analysis.priority,
                    reason: analysis.reason,
                    urgentItems: analysis.urgentItems
                });
                remainingFunds -= suggestedAmount;
            }
        });

        return suggestions;
    }, [fundingAnalysis, availableFunds]);

    // Handle funding actions
    const handleAcceptSuggestion = (suggestion) => {
        onFundCategory(suggestion.categoryId, suggestion.amount);
        setAvailableFunds(prev => prev - suggestion.amount);

        setFundingAllocations(prev => [
            ...prev,
            {
                categoryId: suggestion.categoryId,
                categoryName: suggestion.categoryName,
                categoryColor: categories.find(c => c.id === suggestion.categoryId)?.color,
                amount: suggestion.amount
            }
        ]);
    };

    const handleCustomFunding = (categoryId, amount) => {
        if (amount <= availableFunds && amount > 0) {
            onFundCategory(categoryId, amount);
            setAvailableFunds(prev => prev - amount);

            const category = categories.find(c => c.id === categoryId);
            setFundingAllocations(prev => [
                ...prev,
                {
                    categoryId,
                    categoryName: category?.name || 'Unknown',
                    categoryColor: category?.color,
                    amount
                }
            ]);
        }
    };

    const handleAutoFundAll = () => {
        smartSuggestions.forEach(suggestion => {
            handleAcceptSuggestion(suggestion);
        });
    };

    const handleResetFunding = () => {
        setAvailableFunds(initialAvailableFunds);
        setFundingAllocations([]);
    };

    const totalSuggested = smartSuggestions.reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="space-y-6">
            {/* Funding Header */}
            <div className="bg-theme-primary rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary flex items-center">
                            <Zap className="w-6 h-6 mr-2 text-blue-500" />
                            Smart Funding Assistant
                        </h2>
                        <p className="text-theme-secondary">
                            AI-powered funding recommendations based on your available money
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-theme-secondary">Available to Allocate</div>
                        <div className="text-3xl font-bold text-green-600">
                            ${availableFunds.toFixed(2)}
                        </div>
                        <div className="text-sm text-theme-tertiary">
                            from your account balances
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleAutoFundAll}
                        disabled={smartSuggestions.length === 0 || totalSuggested > availableFunds}
                        className="btn-success px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Zap className="w-4 h-4" />
                        <span>Auto-Fund All (${totalSuggested.toFixed(0)})</span>
                    </button>

                    <button
                        onClick={handleResetFunding}
                        className="btn-secondary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>

                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="btn-secondary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <Calculator className="w-4 h-4" />
                        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                    </button>
                </div>
            </div>

            {/* Funding Suggestions */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-theme-primary flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Smart Funding Recommendations
                </h3>

                {smartSuggestions.length === 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                            All Categories Well Funded!
                        </h3>
                        <p className="text-green-700 dark:text-green-300">
                            Your categories have sufficient funds for upcoming expenses.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {smartSuggestions.map(suggestion => (
                            <FundingSuggestion
                                key={suggestion.categoryId}
                                suggestion={suggestion}
                                onAccept={handleAcceptSuggestion}
                                onCustomAmount={handleCustomFunding}
                                availableFunds={availableFunds}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Allocation Summary */}
            {fundingAllocations.length > 0 && (
                <AllocationSummary
                    allocations={fundingAllocations}
                    totalBudget={initialAvailableFunds}
                />
            )}

            {/* Advanced Options */}
            {showAdvanced && (
                <div className="bg-theme-secondary rounded-lg p-6">
                    <h3 className="font-semibold text-theme-primary mb-4">Advanced Funding Options</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium text-theme-primary mb-2">Funding Strategy</h4>
                            <div className="space-y-2 text-sm">
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="strategy" defaultChecked />
                                    <span>Priority-based (recommended)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="strategy" />
                                    <span>Equal distribution</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="radio" name="strategy" />
                                    <span>Emergency-only</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-theme-primary mb-2">Buffer Settings</h4>
                            <div className="space-y-2 text-sm">
                                <label className="flex items-center justify-between">
                                    <span>Reserve buffer:</span>
                                    <input
                                        type="number"
                                        defaultValue={10}
                                        className="w-16 px-2 py-1 text-xs border rounded"
                                    />
                                    <span>%</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>Consider upcoming paycheck</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImprovedFundingMode;