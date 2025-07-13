import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import {
    ChevronDown,
    ChevronRight,
    DollarSign,
    Edit,
    Plus,
    Target,
    Trash2,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatUtils';

const MobileBudgetView = ({
    data = [],
    accounts = [],
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onQuickAllocate,
}) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [activeTab, setActiveTab] = useState('all'); // all, goals, expenses

    // Helper functions
    const formatDueDate = (dateString) => {
        if (!dateString) return null;

        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDueDateUrgency = (dateString) => {
        if (!dateString) return 'none';

        let dueDate;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-').map(Number);
            dueDate = new Date(year, month - 1, day);
        } else {
            dueDate = new Date(dateString);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return 'overdue';
        if (daysUntil <= 7) return 'urgent';
        if (daysUntil <= 30) return 'soon';
        return 'future';
    };


    // Calculate available to allocate
    const totalWorkingBalance = (accounts || []).reduce((sum, account) => {
        const startingBalance = account.startingBalance || account.balance || 0;
        return sum + startingBalance;
    }, 0);

    const totalAllocated = data.reduce((sum, category) => sum + (category.allocated || 0), 0);
    const availableToAllocate = totalWorkingBalance - totalAllocated;

    // Filter categories based on active tab
    const filteredData = data.filter(category => {
        if (activeTab === 'all') return true;
        if (activeTab === 'goals') return category.planningType === 'goal';
        if (activeTab === 'expenses') return category.planningType === 'expense' || category.type === 'multiple';
        return true;
    });

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    return (
        <div className="w-full space-y-4">
            {/* Available to Allocate Card */}
            {availableToAllocate > 0 && (
                <div className="bg-gradient-to-r from-success-lighter/20 to-info-lighter/20 rounded-lg border border-success-light p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-white text-sm">
                                💰
                            </div>
                            <div>
                                <h3 className="font-semibold text-success-dark">
                                    Available to Allocate
                                </h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-success-dark">
                                {formatCurrency(availableToAllocate)}
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={onQuickAllocate}
                        variant="filled"
                        color="success"
                        isGlow={true}
                        className="w-full"
                    >
                        Quick Allocate
                    </Button>
                </div>
            )}

            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-success" />
                    Budget Categories
                </h2>
                <Button
                    onClick={onAddCategory}
                    variant="filled"
                    color="primary"
                    size="sm"
                    className="flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-base-200 rounded-lg p-1">
                {[
                    { key: 'all', label: 'All', count: data.length },
                    { key: 'goals', label: 'Goals', count: data.filter(c => c.planningType === 'goal').length },
                    { key: 'expenses', label: 'Expenses', count: data.filter(c => c.planningType === 'expense' || c.type === 'multiple').length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                            ? 'bg-secondary text-base-content shadow-sm'
                            : 'text-base-content/60 hover'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Categories List */}
            <div className="space-y-3">
                {filteredData.map(category => {
                    const isExpanded = expandedCategories[category.id];
                    const hasSubItems = category.subItems && category.subItems.length > 0;
                    const isGoal = category.planningType === 'goal';
                    const isExpense = category.planningType === 'expense';
                    const isOverspent = category.available < 0;
                    const hasAvailable = category.available > 0;

                    // Calculate goal progress if it's a goal
                    let progressPercentage = 0;
                    if (isGoal && category.targetAmount) {
                        const currentAmount = category.alreadySaved || 0;
                        progressPercentage = Math.min(100, (currentAmount / category.targetAmount) * 100);
                    }

                    return (
                        <div key={category.id} className="bg-base-200 rounded-lg border border-base-300 overflow-hidden">
                            {/* Category Header */}
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => toggleCategory(category.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Category Color & Icon */}
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${category.color} border border-base-300`}></div>
                                            {isGoal && <Target className="w-4 h-4 text-info" />}
                                            {isExpense && <TrendingUp className="w-4 h-4 text-warning" />}
                                            {hasSubItems && (
                                                isExpanded ?
                                                    <ChevronDown className="w-4 h-4 text-base-content/60" /> :
                                                    <ChevronRight className="w-4 h-4 text-base-content/60" />
                                            )}
                                        </div>

                                        {/* Category Name & Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-base-content truncate">
                                                {category.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-base-content/60">
                                                    {formatCurrency(category.monthlyNeed)}/mo
                                                </span>
                                                {category.dueDate && (() => {
                                                    const urgency = getDueDateUrgency(category.dueDate);
                                                    const badgeColor = urgency === 'overdue' ? 'error' :
                                                        urgency === 'urgent' ? 'warning' :
                                                            urgency === 'soon' ? 'warning' : 'info';
                                                    return (
                                                        <Badge
                                                            variant="soft"
                                                            color={badgeColor}
                                                            className="text-xs"
                                                        >
                                                            {formatDueDate(category.dueDate)}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Available Amount */}
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${isOverspent ? 'text-error' :
                                            hasAvailable ? 'text-success' :
                                                'text-base-content/60'
                                            }`}>
                                            {formatCurrency(category.available || 0)}
                                        </div>
                                        <div className="text-xs text-base-content/60">
                                            {isOverspent ? 'Overspent' : hasAvailable ? 'Available' : 'No funds'}
                                        </div>
                                    </div>
                                </div>

                                {/* Goal Progress Bar */}
                                {isGoal && category.targetAmount && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs text-base-content/60 mb-1">
                                            <span>Goal Progress</span>
                                            <span>{progressPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-base-300 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${progressPercentage >= 100 ? 'bg-success' :
                                                    progressPercentage >= 75 ? 'bg-info' :
                                                        progressPercentage >= 50 ? 'bg-warning' :
                                                            'bg-base-300'
                                                    }`}
                                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
                                            <span>${(category.alreadySaved || 0).toFixed(2)} saved</span>
                                            <span>${(category.targetAmount || 0).toFixed(2)} target</span>
                                        </div>
                                    </div>
                                )}

                                {/* Budget Allocation Summary */}
                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                    <div className="text-center p-2 bg-base-300 rounded">
                                        <div className="font-medium text-info">
                                            {formatCurrency(category.perPaycheck || 0)}
                                        </div>
                                        <div className="text-primary">Per Paycheck</div>
                                    </div>
                                    <div className="text-center p-2 bg-base-300 rounded">
                                        <div className="font-medium text-success">
                                            {formatCurrency(category.allocated || 0)}
                                        </div>
                                        <div className="text-primary">Allocated</div>
                                    </div>
                                    <div className="text-center p-2 bg-base-300 rounded">
                                        <div className="font-medium text-error">
                                            {formatCurrency(category.spent || 0)}
                                        </div>
                                        <div className="text-primary">Spent</div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Actions */}
                            <div className="px-4 py-2 bg-base-300 border-t border-base-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {category.type === 'multiple' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddItem({ categoryId: category.id });
                                                }}
                                                className="p-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors"
                                                title="Add Item"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditCategory(category);
                                            }}
                                            className="p-1 hover rounded"
                                        >
                                            <Edit className="w-4 h-4 text-base-content/60" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteCategory(category.id);
                                            }}
                                            className="p-1 hover rounded"
                                        >
                                            <Trash2 className="w-4 h-4 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Sub-Items */}
                            {isExpanded && hasSubItems && (
                                <div className="border-t border-base-300">
                                    {category.subItems.map(subItem => (
                                        <div key={subItem.id} className="px-4 py-3 border-b border-base-200 last">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-base-content">
                                                        {subItem.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-sm text-base-content/60">
                                                            {formatCurrency(subItem.amount || 0)}
                                                        </span>
                                                        {subItem.frequency && (
                                                            <span className="text-xs text-base-content/60 capitalize">
                                                                {subItem.frequency.replace('-', ' ')}
                                                            </span>
                                                        )}
                                                        {subItem.dueDate && (() => {
                                                            const urgency = getDueDateUrgency(subItem.dueDate);
                                                            const badgeColor = urgency === 'overdue' ? 'error' :
                                                                urgency === 'urgent' ? 'warning' :
                                                                    urgency === 'soon' ? 'warning' : 'info';
                                                            return (
                                                                <Badge
                                                                    variant="soft"
                                                                    color={badgeColor}
                                                                    className="text-xs"
                                                                >
                                                                    {formatDueDate(subItem.dueDate)}
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditItem(subItem);
                                                        }}
                                                        className="p-1 hover rounded"
                                                    >
                                                        <Edit className="w-3 h-3 text-base-content/60" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteItem(subItem.id);
                                                        }}
                                                        className="p-1 hover rounded"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-base-content/60" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="bg-base-200 rounded-lg border border-base-300 p-4">
                <h3 className="font-semibold text-base-content mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-info-lighter/20 rounded-lg">
                        <div className="font-bold text-info text-lg">
                            {formatCurrency(data.reduce((sum, cat) => sum + (cat.monthlyNeed || 0), 0))}
                        </div>
                        <div className="text-base-content">Monthly Need</div>
                    </div>
                    <div className="text-center p-3 bg-success-lighter/20 rounded-lg">
                        <div className="font-bold text-success text-lg">
                            {formatCurrency(data.reduce((sum, cat) => sum + (cat.allocated || 0), 0))}
                        </div>
                        <div className="text-base-content/60">Total Allocated</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileBudgetView;
