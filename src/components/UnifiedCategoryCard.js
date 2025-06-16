import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, Target, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

const UnifiedCategoryCard = ({
    category,
    expenses = [],
    savingsGoals = [],
    timeline,
    viewMode = 'planning', // 'planning' or 'funding'
    onFund,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditExpense,
    onEditGoal,
    onDeleteExpense,
    onDeleteGoal,
    frequencyOptions = []
}) => {
    const [fundingAmount, setFundingAmount] = useState('');
    const [collapsed, setCollapsed] = useState(category.collapsed || false);

    // Get items for this category
    const categoryExpenses = expenses.filter(exp => exp.categoryId === category.id);
    const categoryGoals = savingsGoals.filter(goal => goal.categoryId === category.id);
    const allItems = [...categoryExpenses, ...categoryGoals];

    // Calculate category totals
    const available = (category.allocated || 0) - (category.spent || 0);
    const totalPlanned = categoryExpenses.reduce((sum, exp) => sum + (exp.biweeklyAmount || 0), 0) +
        categoryGoals.reduce((sum, goal) => sum + (goal.biweeklyAmount || 0), 0);

    // Check if category has any items (regardless of calculated amounts)
    const hasItems = allItems.length > 0;

    // Get timeline info for urgency
    const getTimelineInfo = (itemId, itemType) => {
        if (!timeline || !timeline.timelines) return null;
        return timeline.timelines.all.find(item =>
            item.id === itemId && item.type === itemType
        );
    };

    // Get urgency display from timeline
    const getUrgencyDisplay = (timelineItem) => {
        if (!timelineItem || !timelineItem.urgencyIndicator) return null;
        const { emoji, label, color } = timelineItem.urgencyIndicator;

        const colorClass = color.includes('red') ? 'text-red-600 bg-red-100' :
            color.includes('yellow') ? 'text-yellow-600 bg-yellow-100' :
                color.includes('green') ? 'text-green-600 bg-green-100' :
                    'text-theme-secondary bg-theme-tertiary';

        return (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`} title={`${label} priority`}>
                {emoji} {label}
            </span>
        );
    };

    // Get timeline message
    const getTimelineMessage = (timelineItem) => {
        if (!timelineItem || !timelineItem.timeline || !timelineItem.timeline.message) return null;
        return (
            <div className="text-xs text-theme-blue mt-1 flex items-center font-medium">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{timelineItem.timeline.message}</span>
            </div>
        );
    };

    // Find most urgent item for category summary
    const getMostUrgentItem = () => {
        const urgentItems = allItems
            .map(item => {
                const timelineItem = getTimelineInfo(item.id, item.targetAmount ? 'goal' : 'expense');
                return { item, urgency: timelineItem?.urgencyScore || 0, timelineItem };
            })
            .filter(({ urgency }) => urgency > 30)
            .sort((a, b) => b.urgency - a.urgency);

        return urgentItems[0] || null;
    };

    const mostUrgent = getMostUrgentItem();

    // Handle funding
    const handleFund = () => {
        const amount = parseFloat(fundingAmount);
        if (amount > 0) {
            onFund(category.id, amount);
            setFundingAmount('');
        }
    };

    // Calculate funding status
    const getFundingStatus = () => {
        if (available < 0) return { status: 'overspent', color: 'bg-red-500', message: 'Overspent' };
        if (totalPlanned === 0) return { status: 'no-plan', color: 'bg-gray-300', message: 'No items planned' };
        if (available >= totalPlanned) return { status: 'fully-funded', color: 'bg-green-500', message: 'Fully funded' };
        if (available >= totalPlanned * 0.5) return { status: 'half-funded', color: 'bg-yellow-500', message: 'Partially funded' };
        return { status: 'low-funded', color: 'bg-red-500', message: 'Needs funding' };
    };

    const fundingStatus = getFundingStatus();
    const progressPercentage = totalPlanned > 0 ? Math.min(100, (available / totalPlanned) * 100) : 0;

    return (
        <div className="bg-theme-primary rounded-lg shadow-lg overflow-hidden mb-4 border border-theme-primary">
            {/* Category Header */}
            <div className="p-4 relative">
                {/* Colored left border */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${category.color}`}></div>

                <div className="flex items-center justify-between mb-3">
                    {/* Left side - Category info */}
                    <div
                        className="flex items-center cursor-pointer flex-1 hover:bg-theme-hover rounded px-2 py-1 transition-colors"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4 mr-2 text-theme-secondary" /> : <ChevronDown className="w-4 h-4 mr-2 text-theme-secondary" />}
                        <div className={`w-6 h-6 rounded-full ${category.color} mr-3 shadow-lg border-2 border-white`}></div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-theme-primary">{category.name}</h3>
                            <div className="flex items-center space-x-3 text-sm">
                                {viewMode === 'planning' && (
                                    <span className="text-theme-tertiary">
                                        ${totalPlanned.toFixed(2)}/bi-weekly planned
                                    </span>
                                )}
                                {mostUrgent && (
                                    <span className="text-theme-red text-xs">
                                        ⚠️ {mostUrgent.item.name} urgent
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        {viewMode === 'funding' && (
                            <>
                                <CurrencyInput
                                    value={fundingAmount}
                                    onChange={(e) => setFundingAmount(e.target.value)}
                                    placeholder="Amount"
                                    className="w-24 text-sm"
                                />
                                <button
                                    onClick={handleFund}
                                    disabled={!fundingAmount}
                                    className="btn-primary px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                    Fund
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => onAddItem(category.id)}
                            className="p-1 text-theme-blue hover:text-theme-blue rounded hover:bg-theme-hover"
                            title="Add item to this category"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onEditCategory(category)}
                            className="p-1 hover:bg-theme-hover rounded text-theme-secondary"
                            title="Edit category"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDeleteCategory(category)}
                            className="p-1 hover:bg-theme-hover rounded text-theme-red"
                            title="Delete category"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Money Status Section - Always Visible */}
                <div className="mb-3">
                    {/* Money summary */}
                    <div className="flex justify-between items-center text-sm mb-2">
                        <div className="flex items-center space-x-4">
                            <span className={`font-medium ${available >= 0 ? 'text-theme-green' : 'text-theme-red'}`}>
                                ${available.toFixed(2)} available
                            </span>
                            {viewMode === 'planning' && totalPlanned > 0 && (
                                <span className="text-theme-tertiary">
                                    ${totalPlanned.toFixed(2)} planned
                                </span>
                            )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${fundingStatus.status === 'fully-funded' ? 'bg-green-100 text-green-800' :
                            fundingStatus.status === 'overspent' ? 'bg-red-100 text-red-800' :
                                fundingStatus.status === 'no-plan' && !hasItems ? 'bg-gray-100 text-gray-800' :
                                    hasItems && totalPlanned === 0 ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                            }`}>
                            {!hasItems ? 'No items planned' :
                                totalPlanned === 0 ? 'Items need calculation' :
                                    fundingStatus.message}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-theme-tertiary rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${fundingStatus.color}`}
                            style={{ width: `${Math.max(0, progressPercentage)}%` }}
                        />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between items-center text-xs text-theme-secondary">
                    <div className="flex space-x-4">
                        <span>📊 {allItems.length} items</span>
                        <span>💰 ${(category.allocated || 0).toFixed(2)} allocated</span>
                        <span>💸 ${(category.spent || 0).toFixed(2)} spent</span>
                    </div>
                    {mostUrgent && (
                        <div className="text-theme-red">
                            {getUrgencyDisplay(mostUrgent.timelineItem)}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Items - When Expanded */}
            {!collapsed && (
                <div className="border-t border-theme-primary">
                    {allItems.length === 0 ? (
                        <div className="p-4 text-center text-theme-secondary">
                            <div className="text-4xl mb-2">📝</div>
                            <p className="mb-2">No items in this category</p>
                            <button
                                onClick={() => onAddItem(category.id)}
                                className="text-theme-blue hover:text-theme-blue text-sm font-medium"
                            >
                                + Add your first expense or goal
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-theme-primary">
                            {/* Expenses */}
                            {categoryExpenses.map(expense => {
                                const timelineItem = getTimelineInfo(expense.id, 'expense');
                                return (
                                    <div key={`expense-${expense.id}`} className="p-3 hover:bg-theme-hover transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-blue-500">💸</span>
                                                    <span className="font-medium text-theme-primary">{expense.name}</span>

                                                    {/* Priority State Indicators */}
                                                    {expense.priorityState === 'active' && (
                                                        <span className="text-xs" title="Active">🟢</span>
                                                    )}
                                                    {expense.priorityState === 'paused' && (
                                                        <span className="text-xs" title="Paused">⏸️</span>
                                                    )}
                                                    {expense.priorityState === 'complete' && (
                                                        <span className="text-xs" title="Funded">✅</span>
                                                    )}

                                                    {/* Urgency Indicator */}
                                                    {getUrgencyDisplay(timelineItem)}
                                                </div>

                                                <div className="text-sm text-theme-secondary mt-1">
                                                    ${expense.amount} {frequencyOptions.find(f => f.value === expense.frequency)?.label.toLowerCase() || expense.frequency}
                                                    {expense.dueDate && (
                                                        <span className="ml-2">
                                                            • Due {new Date(expense.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {expense.alreadySaved > 0 && (
                                                        <span className="ml-2 text-theme-green">
                                                            • ${expense.alreadySaved} saved
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Timeline message */}
                                                {getTimelineMessage(timelineItem)}
                                            </div>

                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="font-medium text-theme-primary">
                                                        ${(expense.biweeklyAmount || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-theme-tertiary">bi-weekly</div>
                                                </div>
                                                <button
                                                    onClick={() => onEditExpense(expense)}
                                                    className="p-1 hover:bg-theme-hover rounded text-theme-secondary"
                                                    title="Edit expense"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteExpense(expense)}
                                                    className="p-1 hover:bg-theme-hover rounded text-theme-red"
                                                    title="Delete expense"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Goals */}
                            {categoryGoals.map(goal => {
                                const timelineItem = getTimelineInfo(goal.id, 'goal');
                                const fundingProgress = goal.targetAmount > 0
                                    ? ((goal.alreadySaved || 0) / goal.targetAmount) * 100
                                    : 0;

                                return (
                                    <div key={`goal-${goal.id}`} className="p-3 hover:bg-theme-hover transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <Target className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    <span className="font-medium text-theme-primary">{goal.name}</span>

                                                    {/* Priority State Indicators */}
                                                    {goal.priorityState === 'active' && (
                                                        <span className="text-xs" title="Active">🟢</span>
                                                    )}
                                                    {goal.priorityState === 'paused' && (
                                                        <span className="text-xs" title="Paused">⏸️</span>
                                                    )}
                                                    {goal.priorityState === 'complete' && (
                                                        <span className="text-xs" title="Complete">✅</span>
                                                    )}

                                                    {/* Progress indicator */}
                                                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                                                        {fundingProgress.toFixed(0)}%
                                                    </span>

                                                    {/* Urgency Indicator */}
                                                    {getUrgencyDisplay(timelineItem)}
                                                </div>

                                                <div className="text-sm text-theme-secondary mt-1">
                                                    Target: ${goal.targetAmount.toLocaleString()}
                                                    {goal.targetDate && (
                                                        <span className="ml-2">
                                                            • By {new Date(goal.targetDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {goal.alreadySaved > 0 && (
                                                        <span className="ml-2 text-theme-green">
                                                            • ${goal.alreadySaved.toLocaleString()} saved
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress bar for goals */}
                                                {goal.targetAmount > 0 && (
                                                    <div className="mt-2">
                                                        <div className="w-full bg-theme-tertiary rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${fundingProgress >= 100 ? 'bg-green-500' : 'bg-green-400'}`}
                                                                style={{ width: `${Math.min(100, fundingProgress)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Timeline message */}
                                                {getTimelineMessage(timelineItem)}
                                            </div>

                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="font-medium text-theme-primary">
                                                        ${(goal.biweeklyAmount || 0).toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-theme-tertiary">bi-weekly</div>
                                                </div>
                                                <button
                                                    onClick={() => onEditGoal(goal)}
                                                    className="p-1 hover:bg-theme-hover rounded text-theme-secondary"
                                                    title="Edit goal"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteGoal(goal)}
                                                    className="p-1 hover:bg-theme-hover rounded text-theme-red"
                                                    title="Delete goal"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UnifiedCategoryCard;