// components/FundingMode.js
import React, { useState, useMemo } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp, Zap, Target } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

const FundingMode = ({
    categories,
    expenses,
    savingsGoals,
    timeline,
    currentPay,
    onFundCategory,
    onAutoFund,
    viewMode = 'funding' // 'funding' or 'planning'
}) => {
    const [availableFunds, setAvailableFunds] = useState(currentPay);
    const [selectedCategories, setSelectedCategories] = useState(new Set());
    const [fundingAmounts, setFundingAmounts] = useState({});

    // Helper to get available balance
    const getAvailableBalance = (category) => {
        return (category.allocated || 0) - (category.spent || 0);
    };

    // Get upcoming expenses for a category
    const getUpcomingExpenses = (categoryId) => {
        const cutoffDate = new Date(Date.now() + (28 * 24 * 60 * 60 * 1000)); // 4 weeks ahead
        return expenses
            .filter(exp => exp.categoryId === categoryId && exp.dueDate)
            .filter(exp => new Date(exp.dueDate) <= cutoffDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    // Calculate category funding priority
    const getCategoryPriority = (category) => {
        const upcomingExpenses = getUpcomingExpenses(category.id);
        const available = getAvailableBalance(category);
        const needed = upcomingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const shortfall = Math.max(0, needed - available);

        // Get urgency from timeline
        const timelineItems = timeline?.timelines?.all?.filter(item =>
            expenses.some(exp => exp.id === item.id && exp.categoryId === category.id) ||
            savingsGoals.some(goal => goal.id === item.id && goal.categoryId === category.id)
        ) || [];

        const maxUrgency = Math.max(0, ...timelineItems.map(item => item.urgencyScore || 0));

        return {
            shortfall,
            urgency: maxUrgency,
            priority: maxUrgency > 80 ? 'critical' : maxUrgency > 60 ? 'high' : shortfall > 0 ? 'medium' : 'low',
            upcomingExpenses,
            needed,
            available
        };
    };

    // Prioritized categories for funding
    const prioritizedCategories = useMemo(() => {
        return categories
            .map(category => ({
                ...category,
                ...getCategoryPriority(category)
            }))
            .filter(cat => cat.shortfall > 0 || cat.urgency > 30) // Only show categories that need attention
            .sort((a, b) => {
                // Sort by urgency first, then by shortfall amount
                if (a.urgency !== b.urgency) return b.urgency - a.urgency;
                return b.shortfall - a.shortfall;
            });
    }, [categories, expenses, timeline]);

    // Calculate suggested auto-funding
    const getAutoFundingSuggestion = () => {
        let remainingFunds = availableFunds;
        const suggestions = [];

        prioritizedCategories.forEach(category => {
            const suggestedAmount = Math.min(category.shortfall, remainingFunds);
            if (suggestedAmount > 0) {
                suggestions.push({
                    categoryId: category.id,
                    name: category.name,
                    amount: suggestedAmount,
                    reason: category.priority === 'critical' ? 'Critical deadline' :
                        category.priority === 'high' ? 'High priority' : 'Upcoming expenses'
                });
                remainingFunds -= suggestedAmount;
            }
        });

        return { suggestions, totalAmount: availableFunds - remainingFunds };
    };

    const autoFundingSuggestion = getAutoFundingSuggestion();

    // Handle individual category funding
    const handleFundCategory = (categoryId, amount) => {
        onFundCategory(categoryId, amount);
        setAvailableFunds(prev => prev - amount);
        setFundingAmounts(prev => ({ ...prev, [categoryId]: 0 }));
    };

    // Handle auto-funding
    const handleAutoFund = () => {
        autoFundingSuggestion.suggestions.forEach(suggestion => {
            onFundCategory(suggestion.categoryId, suggestion.amount);
        });
        setAvailableFunds(prev => prev - autoFundingSuggestion.totalAmount);
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'high': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
            case 'medium': return <Target className="w-4 h-4 text-blue-500" />;
            default: return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return 'border-red-400 bg-red-50';
            case 'high': return 'border-yellow-400 bg-yellow-50';
            case 'medium': return 'border-blue-400 bg-blue-50';
            default: return 'border-green-400 bg-green-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Funding Header */}
            <div className="bg-theme-primary rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary flex items-center">
                            <DollarSign className="w-6 h-6 mr-2" />
                            Category Funding
                        </h2>
                        <p className="text-theme-secondary">
                            Fund your category envelopes based on upcoming needs
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-theme-secondary">Available to Allocate</div>
                        <div className="text-2xl font-bold text-theme-blue">
                            ${availableFunds.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Auto-funding suggestion */}
                {autoFundingSuggestion.suggestions.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Smart Funding Suggestion
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Fund {autoFundingSuggestion.suggestions.length} categories with ${autoFundingSuggestion.totalAmount.toFixed(2)}
                                </p>
                            </div>
                            <button
                                onClick={handleAutoFund}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Auto-Fund All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Categories Needing Funding */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-theme-primary">Categories Needing Attention</h3>

                {prioritizedCategories.length === 0 ? (
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
                    prioritizedCategories.map(category => (
                        <div
                            key={category.id}
                            className={`rounded-lg border-2 ${getPriorityColor(category.priority)} p-4`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                        {getPriorityIcon(category.priority)}
                                        <div className={`w-4 h-4 rounded-full ${category.color} mr-2 ml-2 border border-white`}></div>
                                        <h4 className="font-semibold text-theme-primary">{category.name}</h4>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${category.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                            category.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                            {category.priority.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                        <div>
                                            <span className="text-theme-secondary">Available:</span>
                                            <div className={`font-semibold ${category.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${category.available.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-theme-secondary">Needed:</span>
                                            <div className="font-semibold text-theme-primary">
                                                ${category.needed.toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-theme-secondary">Shortfall:</span>
                                            <div className="font-semibold text-red-600">
                                                ${category.shortfall.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming expenses preview */}
                                    {category.upcomingExpenses.length > 0 && (
                                        <div className="text-sm">
                                            <span className="text-theme-secondary">Next up: </span>
                                            <span className="text-theme-primary">
                                                {category.upcomingExpenses[0].name} - ${category.upcomingExpenses[0].amount}
                                                ({new Date(category.upcomingExpenses[0].dueDate).toLocaleDateString()})
                                            </span>
                                            {category.upcomingExpenses.length > 1 && (
                                                <span className="text-theme-tertiary">
                                                    {' '}and {category.upcomingExpenses.length - 1} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Funding input */}
                                <div className="flex items-center space-x-2 ml-4">
                                    <CurrencyInput
                                        value={fundingAmounts[category.id] || category.shortfall}
                                        onChange={(e) => setFundingAmounts(prev => ({
                                            ...prev,
                                            [category.id]: parseFloat(e.target.value) || 0
                                        }))}
                                        className="w-32"
                                    />
                                    <button
                                        onClick={() => handleFundCategory(
                                            category.id,
                                            fundingAmounts[category.id] || category.shortfall
                                        )}
                                        disabled={availableFunds < (fundingAmounts[category.id] || category.shortfall)}
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Fund
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Well-funded categories summary */}
            <div className="bg-theme-secondary rounded-lg p-4">
                <h4 className="font-medium text-theme-primary mb-2">Well-Funded Categories</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categories
                        .filter(cat => !prioritizedCategories.find(pc => pc.id === cat.id))
                        .map(category => (
                            <div key={category.id} className="flex items-center text-sm">
                                <div className={`w-3 h-3 rounded-full ${category.color} mr-2 border border-white`}></div>
                                <span className="text-theme-secondary">{category.name}</span>
                                <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default FundingMode;