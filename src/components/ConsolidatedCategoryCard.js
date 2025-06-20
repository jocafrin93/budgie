// src/components/ConsolidatedCategoryCard.js
import React, { useState, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
    ChevronDown,
    ChevronRight,
    DollarSign,
    Target,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    GripVertical,
    Ghost
} from 'lucide-react';
import CurrencyInput from './CurrencyInput';

// Constants
const DND_TYPES = {
    PLANNING_ITEM: 'planning_item'
};

// PlanningItem component - displays an individual expense or goal
const PlanningItem = ({
    item,
    viewMode,
    payFrequency,
    payFrequencyOptions,
    timeline,
    onEdit,
    onDelete,
    onToggleActive,
    onFund,
    isDraggable = true
}) => {
    // Drag and drop functionality (only if draggable)
    const [{ isDragging }, drag] = useDrag(() => ({
        type: DND_TYPES.PLANNING_ITEM,
        item: isDraggable ? { id: item.id, categoryId: item.categoryId } : null,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: () => isDraggable
    }));

    // Determine if this is a goal or expense
    const isGoal = item.type === 'savings-goal';
    
    // Get timeline info for urgency
    const timelineInfo = useMemo(() => {
        if (!timeline || !timeline.getTimelineForItem) return null;
        return timeline.getTimelineForItem(item.id);
    }, [item.id, timeline]);

    // Calculate display amounts
    const displayInfo = useMemo(() => {
        const isGoal = item.type === 'savings-goal';
        let monthlyAmount = 0;
        
        if (isGoal) {
            monthlyAmount = item.monthlyContribution || 0;
        } else {
            const frequencyMap = {
                'weekly': (item.amount || 0) * 4.33,
                'bi-weekly': (item.amount || 0) * 2.17,
                'every-3-weeks': (item.amount || 0) * 1.44,
                'monthly': (item.amount || 0),
                'every-6-weeks': (item.amount || 0) * 0.72,
                'every-7-weeks': (item.amount || 0) * 0.62,
                'every-8-weeks': (item.amount || 0) * 0.54,
                'quarterly': (item.amount || 0) / 3,
                'annually': (item.amount || 0) / 12,
                'per-paycheck': (item.amount || 0) * 2.17
            };
            monthlyAmount = frequencyMap[item.frequency] || (item.amount || 0);
        }

        // Safety checks for pay frequency
        if (!payFrequencyOptions || !payFrequency) {
            return {
                monthlyAmount: monthlyAmount || 0,
                perPaycheckAmount: (monthlyAmount || 0) / 2.17, // Default to bi-weekly
                payFrequencyLabel: 'Bi-weekly'
            };
        }

        const payFreqOption = payFrequencyOptions.find(opt => opt.value === payFrequency);
        const paychecksPerMonth = payFreqOption?.paychecksPerMonth || 2.17;
        const perPaycheckAmount = (monthlyAmount || 0) / paychecksPerMonth;

        return {
            monthlyAmount: monthlyAmount || 0,
            perPaycheckAmount: perPaycheckAmount || 0,
            payFrequencyLabel: payFreqOption?.label || 'Bi-weekly'
        };
    }, [item, payFrequency, payFrequencyOptions]);

    // Calculate progress for goals
    const progressInfo = useMemo(() => {
        if (isGoal && item.targetDate && (item.targetAmount || item.amount)) {
            const targetAmount = item.targetAmount || item.amount;
            const saved = item.alreadySaved || 0;
            const progress = (saved / targetAmount) * 100;
            const monthsLeft = Math.ceil((new Date(item.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30));

            return {
                progress: Math.min(progress, 100),
                saved,
                monthsLeft: Math.max(0, monthsLeft),
                isOverdue: monthsLeft < 0
            };
        }
        return null;
    }, [isGoal, item]);

    // Get urgency display from timeline
    const urgencyDisplay = useMemo(() => {
        if (!timelineInfo || !timelineInfo.urgencyIndicator) return null;
        
        const { emoji, label, color } = timelineInfo.urgencyIndicator;
        const colorClass = color.includes('red') ? 'text-red-600 bg-red-100' :
            color.includes('yellow') ? 'text-yellow-600 bg-yellow-100' :
            color.includes('green') ? 'text-green-600 bg-green-100' :
            'text-theme-secondary bg-theme-tertiary';

        return (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colorClass}`} title={`${label} priority`}>
                {emoji} {label}
            </span>
        );
    }, [timelineInfo]);

    // Get timeline message
    const timelineMessage = useMemo(() => {
        if (!timelineInfo || !timelineInfo.timeline || !timelineInfo.timeline.message) return null;
        return (
            <div className="text-xs text-theme-blue mt-1 flex items-center font-medium">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{timelineInfo.timeline.message}</span>
            </div>
        );
    }, [timelineInfo]);

    // Determine the amount to display
    const amount = isGoal ? (item.targetAmount || item.amount) : item.amount;

    return (
        <div
            ref={isDraggable ? drag : null}
            className={`group p-3 rounded-lg border transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'} 
                ${item.isActive || item.priorityState === 'active'
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20 hover:border-green-400'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800/20 hover:border-gray-300'
                }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {isDraggable && (
                        <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    {/* Status & Type Icon */}
                    <div className="flex items-center space-x-1">
                        {item.isActive || item.priorityState === 'active' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        {isGoal && <Target className="w-3 h-3 text-blue-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Item Name & Amount */}
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-theme-primary truncate">
                                {item.name || 'Unnamed Item'}
                            </h4>
                            <div className="text-right">
                                {viewMode === 'planning' ? (
                                    <div className="text-sm">
                                        <span className="font-semibold text-theme-primary">
                                            ${displayInfo.perPaycheckAmount.toFixed(0)}/check
                                        </span>
                                        <div className="text-xs text-theme-tertiary">
                                            ${displayInfo.monthlyAmount.toFixed(0)}/month
                                        </div>
                                        {!isGoal && (
                                            <div className="text-xs text-theme-tertiary">
                                                ${amount} {item.frequency}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm font-semibold text-theme-primary">
                                        ${amount?.toFixed(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Urgency Indicator */}
                        {urgencyDisplay && (
                            <div className="mt-1">
                                {urgencyDisplay}
                            </div>
                        )}

                        {/* Progress Bar for Goals */}
                        {progressInfo && (item.isActive || item.priorityState === 'active') && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-theme-secondary mb-1">
                                    <span>${progressInfo.saved.toFixed(0)} saved</span>
                                    <span>
                                        {progressInfo.isOverdue ? 'Overdue' : `${progressInfo.monthsLeft}mo left`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${progressInfo.isOverdue ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${progressInfo.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Due Date or Target Date */}
                        {(item.dueDate || item.targetDate) && (
                            <div className="flex items-center text-xs text-theme-tertiary mt-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                {item.dueDate
                                    ? new Date(item.dueDate).toLocaleDateString()
                                    : new Date(item.targetDate).toLocaleDateString()
                                }
                            </div>
                        )}

                        {/* Timeline Message */}
                        {timelineMessage}

                        {/* Fund Button (Funding Mode Only) */}
                        {viewMode === 'funding' && onFund && (
                            <div className="mt-2 flex items-center justify-end">
                                <button
                                    onClick={() => onFund(item.id, displayInfo.perPaycheckAmount)}
                                    className="btn-success px-3 py-1 text-xs rounded-lg flex items-center space-x-1"
                                >
                                    <DollarSign className="w-3 h-3" />
                                    <span>Fund ${displayInfo.perPaycheckAmount.toFixed(0)}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {viewMode === 'planning' && (
                        <button
                            onClick={() => onToggleActive(item.id, !(item.isActive || item.priorityState === 'active'))}
                            className={`p-1 rounded transition-colors ${item.isActive || item.priorityState === 'active'
                                ? 'text-green-600 hover:text-green-700'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                            title={(item.isActive || item.priorityState === 'active') ? 'Currently funded' : 'Planning only'}
                        >
                            {item.isActive || item.priorityState === 'active' ? (
                                <ToggleRight className="w-4 h-4" />
                            ) : (
                                <ToggleLeft className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>

                    <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main ConsolidatedCategoryCard component
const ConsolidatedCategoryCard = ({
    category,
    planningItems = [],
    timeline,
    viewMode = 'planning', // 'planning' or 'funding'
    payFrequency,
    payFrequencyOptions,
    onFund,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onToggleCollapse,
    onMoveItem
}) => {
    const [fundingAmount, setFundingAmount] = useState(0);
    const [collapsed, setCollapsed] = useState(category.collapsed || false);

    // Handle local collapse toggle if no external handler provided
    const handleToggleCollapse = () => {
        if (onToggleCollapse) {
            onToggleCollapse(category.id);
        } else {
            setCollapsed(!collapsed);
        }
    };

    // Get planning items for this category
    const categoryItems = useMemo(() => {
        return planningItems.filter(item => item.categoryId === category.id);
    }, [planningItems, category.id]);

    // Calculate category statistics
    const stats = useMemo(() => {
        const activeItems = categoryItems.filter(item => item.isActive || item.priorityState === 'active');
        const planningOnlyItems = categoryItems.filter(item => !(item.isActive || item.priorityState === 'active'));

        // Calculate monthly needs from active items
        const monthlyNeeds = activeItems.reduce((total, item) => {
            if (item.type === 'savings-goal') {
                return total + (item.monthlyContribution || 0);
            } else {
                const frequencyMap = {
                    'weekly': (item.amount || 0) * 4.33,
                    'bi-weekly': (item.amount || 0) * 2.17,
                    'every-3-weeks': (item.amount || 0) * 1.44,
                    'monthly': (item.amount || 0),
                    'every-6-weeks': (item.amount || 0) * 0.72,
                    'every-7-weeks': (item.amount || 0) * 0.62,
                    'every-8-weeks': (item.amount || 0) * 0.54,
                    'quarterly': (item.amount || 0) / 3,
                    'annually': (item.amount || 0) / 12,
                    'per-paycheck': (item.amount || 0) * 2.17
                };
                return total + (frequencyMap[item.frequency] || (item.amount || 0));
            }
        }, 0);

        // Calculate per-paycheck needs
        const payFreqOption = payFrequencyOptions?.find(opt => opt.value === payFrequency);
        const paychecksPerMonth = payFreqOption?.paychecksPerMonth || 2.17;
        const perPaycheckNeeds = (monthlyNeeds || 0) / paychecksPerMonth;

        // Envelope balance
        const currentBalance = (category.allocated || 0) - (category.spent || 0);
        const isHealthy = currentBalance >= monthlyNeeds;

        return {
            totalItems: categoryItems.length,
            activeItems: activeItems.length,
            planningOnlyItems: planningOnlyItems.length,
            monthlyNeeds: monthlyNeeds || 0,
            perPaycheckNeeds: perPaycheckNeeds || 0,
            currentBalance,
            allocated: category.allocated || 0,
            spent: category.spent || 0,
            isHealthy,
            fundingGap: Math.max(0, (monthlyNeeds || 0) - currentBalance),
            progressPercentage: monthlyNeeds > 0 ? Math.min(100, (currentBalance / monthlyNeeds) * 100) : 0
        };
    }, [categoryItems, category, payFrequency, payFrequencyOptions]);

    // Get most urgent item for category summary
    const mostUrgentItem = useMemo(() => {
        if (!timeline || !timeline.timelines) return null;
        
        const urgentItems = categoryItems
            .map(item => {
                const timelineInfo = timeline.getTimelineForItem ? 
                    timeline.getTimelineForItem(item.id) : 
                    timeline.timelines.all.find(t => t.id === item.id);
                    
                return { 
                    item, 
                    urgency: timelineInfo?.urgencyScore || 0, 
                    timelineInfo 
                };
            })
            .filter(({ urgency }) => urgency > 30)
            .sort((a, b) => b.urgency - a.urgency);

        return urgentItems[0] || null;
    }, [categoryItems, timeline]);

    // Drop functionality for drag and drop
    const [{ isOver }, drop] = useDrop({
        accept: DND_TYPES.PLANNING_ITEM,
        drop: (draggedItem) => {
            if (draggedItem.categoryId !== category.id && onMoveItem) {
                onMoveItem(draggedItem.id, category.id);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    // Handle funding
    const handleFundCategory = () => {
        if (fundingAmount > 0 && onFund) {
            onFund(category.id, fundingAmount);
            setFundingAmount(0);
        }
    };

    // Get health color and icon
    const getHealthColor = () => {
        if (viewMode === 'planning') return 'text-blue-600';
        if (stats.isHealthy) return 'text-green-600';
        if (stats.currentBalance > 0) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getHealthIcon = () => {
        if (viewMode === 'planning') return <Target className="w-4 h-4" />;
        if (stats.isHealthy) return <CheckCircle className="w-4 h-4" />;
        if (stats.currentBalance > 0) return <AlertTriangle className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    // Get funding status
    const getFundingStatus = () => {
        if (stats.currentBalance < 0) return { status: 'overspent', color: 'bg-red-500', message: 'Overspent' };
        if (stats.monthlyNeeds === 0) return { status: 'no-plan', color: 'bg-gray-300', message: 'No items planned' };
        if (stats.currentBalance >= stats.monthlyNeeds) return { status: 'fully-funded', color: 'bg-green-500', message: 'Fully funded' };
        if (stats.currentBalance >= stats.monthlyNeeds * 0.5) return { status: 'half-funded', color: 'bg-yellow-500', message: 'Partially funded' };
        return { status: 'low-funded', color: 'bg-red-500', message: 'Needs funding' };
    };

    const fundingStatus = getFundingStatus();

    return (
        <div
            ref={drop}
            className={`border rounded-lg transition-all duration-200 ${isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-theme-secondary'} 
                bg-theme-primary shadow-sm hover:shadow-md`}
        >
            {/* Category Header */}
            <div className="p-4 border-b border-theme-secondary">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleToggleCollapse}
                            className="text-theme-secondary hover:text-theme-primary transition-colors"
                        >
                            {collapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>

                        <div className={`w-4 h-4 rounded-full ${category.color} border-2 border-white shadow-sm`}></div>

                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-primary">{category.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-theme-secondary">
                                <span className="flex items-center">
                                    {getHealthIcon()}
                                    <span className="ml-1">
                                        {stats.activeItems} active • {stats.planningOnlyItems} planning
                                    </span>
                                </span>
                                
                                {mostUrgentItem && (
                                    <span className="text-theme-red text-xs">
                                        ⚠️ {mostUrgentItem.item.name} urgent
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Actions */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onAddItem(category.id)}
                            className="btn-secondary px-3 py-1 rounded text-sm flex items-center space-x-1"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                        </button>

                        <button
                            onClick={() => onEditCategory(category)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => onDeleteCategory(category)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Category Stats */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-theme-tertiary">Per Paycheck</div>
                        <div className={`font-semibold ${getHealthColor()}`}>
                            ${stats.perPaycheckNeeds.toFixed(0)}
                        </div>
                    </div>

                    <div>
                        <div className="text-theme-tertiary">Monthly Need</div>
                        <div className={`font-semibold ${getHealthColor()}`}>
                            ${stats.monthlyNeeds.toFixed(0)}
                        </div>
                    </div>

                    {viewMode === 'funding' && (
                        <>
                            <div>
                                <div className="text-theme-tertiary">Available</div>
                                <div className={`font-semibold ${getHealthColor()}`}>
                                    ${stats.currentBalance.toFixed(2)}
                                </div>
                            </div>

                            <div>
                                <div className="text-theme-tertiary">Allocated</div>
                                <div className="font-semibold text-theme-primary">
                                    ${stats.allocated.toFixed(2)}
                                </div>
                            </div>
                        </>
                    )}

                    {viewMode === 'planning' && (
                        <div className="md:col-span-2">
                            <div className="text-theme-tertiary">Planning Overview</div>
                            <div className="font-semibold text-theme-primary">
                                {stats.totalItems} total items
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {viewMode === 'funding' && (
                    <div className="mt-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className={`font-medium ${stats.isHealthy ? 'text-green-600' : 'text-yellow-600'}`}>
                                Funding Progress
                            </span>
                            <span className={`px-2 py-0.5 rounded ${fundingStatus.status === 'fully-funded' ? 'bg-green-100 text-green-800' :
                                fundingStatus.status === 'overspent' ? 'bg-red-100 text-red-800' :
                                fundingStatus.status === 'no-plan' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                                }`}>
                                {fundingStatus.message}
                            </span>
                        </div>
                        <div className="w-full bg-theme-tertiary rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${fundingStatus.color}`}
                                style={{ width: `${Math.max(0, stats.progressPercentage)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Funding Controls (Funding Mode Only) */}
                {viewMode === 'funding' && stats.fundingGap > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    Needs ${stats.fundingGap.toFixed(2)} more funding
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                    To cover monthly expenses for this category
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CurrencyInput
                                    value={fundingAmount}
                                    onChange={(e) => setFundingAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-sm"
                                />
                                <button
                                    onClick={handleFundCategory}
                                    disabled={fundingAmount <= 0}
                                    className="btn-success px-3 py-1 text-sm rounded disabled:opacity-50"
                                >
                                    Fund
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Items */}
            {!collapsed && (
                <div className="p-4">
                    {categoryItems.length === 0 ? (
                        <div className="text-center py-8 text-theme-secondary">
                            <Ghost className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No items in this category yet</p>
                            <button
                                onClick={() => onAddItem(category.id)}
                                className="text-theme-blue hover:text-theme-blue-hover text-sm mt-2"
                            >
                                Add your first item
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Show items based on mode */}
                            {viewMode === 'planning' ? (
                                // Planning mode: show all items
                                <>
                                    {/* Active Items */}
                                    {categoryItems.filter(item => item.isActive || item.priorityState === 'active').length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-theme-secondary mb-2">Active Items</h4>
                                            <div className="space-y-2">
                                                {categoryItems
                                                    .filter(item => item.isActive || item.priorityState === 'active')
                                                    .map(item => (
                                                        <PlanningItem
                                                            key={item.id}
                                                            item={item}
                                                            viewMode={viewMode}
                                                            payFrequency={payFrequency}
                                                            payFrequencyOptions={payFrequencyOptions}
                                                            timeline={timeline}
                                                            onEdit={onEditItem}
                                                            onDelete={onDeleteItem}
                                                            onToggleActive={onToggleItemActive}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Planning-Only Items */}
                                    {categoryItems.filter(item => !(item.isActive || item.priorityState === 'active')).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-theme-secondary mb-2">Planning-Only Items</h4>
                                            <div className="space-y-2">
                                                {categoryItems
                                                    .filter(item => !(item.isActive || item.priorityState === 'active'))
                                                    .map(item => (
                                                        <PlanningItem
                                                            key={item.id}
                                                            item={item}
                                                            viewMode={viewMode}
                                                            payFrequency={payFrequency}
                                                            payFrequencyOptions={payFrequencyOptions}
                                                            timeline={timeline}
                                                            onEdit={onEditItem}
                                                            onDelete={onDeleteItem}
                                                            onToggleActive={onToggleItemActive}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Funding mode: show only active items
                                categoryItems
                                    .filter(item => item.isActive || item.priorityState === 'active')
                                    .map(item => (
                                        <PlanningItem
                                            key={item.id}
                                            item={item}
                                            viewMode={viewMode}
                                            payFrequency={payFrequency}
                                            payFrequencyOptions={payFrequencyOptions}
                                            timeline={timeline}
                                            onEdit={onEditItem}
                                            onDelete={onDeleteItem}
                                            onToggleActive={onToggleItemActive}
                                            onFund={onFund}
                                            isDraggable={false}
                                        />
                                    ))
                            )}

                            {viewMode === 'funding' && categoryItems.filter(item => item.isActive || item.priorityState === 'active').length === 0 && (
                                <div className="text-center py-6 text-theme-secondary">
                                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No active items in this category</p>
                                    <p className="text-xs mt-1">Switch to Planning mode to activate items</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConsolidatedCategoryCard;