import React, { useState, useMemo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
    Plus,
    Edit2,
    Trash2,
    Target,
    Calendar,
    DollarSign,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronRight,
    Calculator,
    AlertCircle,
    CheckCircle,
    Clock,
    GripVertical
} from 'lucide-react';

const DND_TYPES = {
    PLANNING_ITEM: 'planning_item',
    CATEGORY: 'category'
};

// Individual Planning Item Component
const PlanningItem = ({
    item,
    category,
    payFrequency,
    payFrequencyOptions,
    onEdit,
    onDelete,
    onToggleActive,
    onMove,
    index
}) => {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPES.PLANNING_ITEM,
        item: { id: item.id, index, categoryId: item.categoryId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const isGoal = item.type === 'savings-goal';
    const amount = isGoal ? item.targetAmount : item.amount;
    // const frequency = isGoal ? 'target' : item.frequency;

    const getAmountDisplayInfo = (item, payFrequency, payFrequencyOptions) => {
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

        if (!payFrequencyOptions || !payFrequency) {
            return {
                monthlyAmount: monthlyAmount || 0,
                perPaycheckAmount: (monthlyAmount || 0) / 2.17,
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
    };

    const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);

    const getFrequencyDisplay = () => {
        if (isGoal) return `Target: $${amount?.toFixed(2)}`;
        const freqMap = {
            'weekly': 'weekly',
            'bi-weekly': 'bi-weekly',
            'monthly': 'monthly',
            'quarterly': 'quarterly',
            'annually': 'yearly'
        };
        return `$${amount?.toFixed(2)} ${freqMap[item.frequency] || item.frequency}`; // Changed this line
    };

    const getStatusIcon = () => {
        if (item.isActive) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        } else {
            return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTargetDate = () => {
        if (isGoal && item.targetDate) {
            const date = new Date(item.targetDate);
            const monthsAway = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24 * 30));
            return monthsAway > 0 ? `${monthsAway}mo` : 'overdue';
        }
        if (item.dueDate) {
            const date = new Date(item.dueDate);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return null;
    };

    return (
        <div
            ref={drag}
            className={`p-3 rounded-lg border transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'
                } ${item.isActive
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800/20'
                } hover:shadow-sm cursor-move`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />

                    {getStatusIcon()}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-theme-primary truncate">{item.name}</h4>
                            {isGoal && (
                                <Target className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                            <span className="font-semibold text-theme-primary">
                                ${displayInfo.perPaycheckAmount.toFixed(0)}/check
                            </span>
                            <span>•</span>
                            <span>{getFrequencyDisplay()}</span>
                            {getTargetDate() && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {getTargetDate()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Active/Inactive Toggle */}
                    <button
                        onClick={() => onToggleActive(item.id, !item.isActive)}
                        className={`p-1 rounded transition-colors ${item.isActive
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                        title={item.isActive ? 'Active (receiving funding)' : 'Planning only (not funded)'}
                    >
                        {item.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                        ) : (
                            <ToggleLeft className="w-5 h-5" />
                        )}
                    </button>

                    {/* Edit */}
                    <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Planning Category Component
const PlanningCategory = ({
    category,
    items,
    payFrequency,
    payFrequencyOptions,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onEditCategory,
    onDeleteCategory,
    onMoveItem,
    onToggleCollapse
}) => {
    const [{ isOver }, drop] = useDrop({
        accept: DND_TYPES.PLANNING_ITEM,
        drop: (draggedItem) => {
            if (draggedItem.categoryId !== category.id) {
                onMoveItem(draggedItem.id, category.id);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    const activeItems = items.filter(item => item.isActive);
    const inactiveItems = items.filter(item => !item.isActive);
    const totalItems = items.length;

    const getTotalMonthlyNeed = () => {
        return activeItems.reduce((total, item) => {
            if (item.type === 'savings-goal') {
                return total + (item.monthlyContribution || 0);
            } else {
                // Convert frequency to monthly amount
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
    };

    const monthlyNeed = getTotalMonthlyNeed();

    return (
        <div
            ref={drop}
            className={`border rounded-lg transition-all duration-200 ${isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-theme-secondary'
                } bg-theme-primary`}
        >
            {/* Category Header */}
            <div className="p-4 border-b border-theme-secondary">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => onToggleCollapse(category.id)}
                            className="text-theme-secondary hover:text-theme-primary transition-colors"
                        >
                            {category.collapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>

                        <div className={`w-4 h-4 rounded-full ${category.color} border-2 border-white shadow-sm`}></div>

                        <div>
                            <h3 className="text-lg font-semibold text-theme-primary">{category.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-theme-secondary">
                                <span>{activeItems.length} active • {inactiveItems.length} planning</span>
                                <span>•</span>
                                <span className="flex items-center">
                                    <Calculator className="w-3 h-3 mr-1" />
                                    ${monthlyNeed.toFixed(0)}/month needed
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onAddItem(category.id)}
                            className="btn-secondary px-3 py-1 rounded flex items-center space-x-1 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Item</span>
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
            </div>

            {/* Category Items */}
            {!category.collapsed && (
                <div className="p-4">
                    {totalItems === 0 ? (
                        <div className="text-center py-8 text-theme-secondary">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No items in this category yet</p>
                            <button
                                onClick={() => onAddItem(category.id)}
                                className="text-theme-blue hover:text-theme-blue-hover text-sm mt-2"
                            >
                                Add your first item
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Active Items */}
                            {activeItems.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Currently Funded ({activeItems.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {activeItems.map((item, index) => (
                                            <PlanningItem
                                                key={item.id}
                                                item={item}
                                                category={category}
                                                index={index}
                                                payFrequency={payFrequency}                    // ADD THIS
                                                payFrequencyOptions={payFrequencyOptions}      // ADD THIS
                                                onEdit={onEditItem}
                                                onDelete={onDeleteItem}
                                                onToggleActive={onToggleItemActive}
                                                onMove={onMoveItem}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Inactive Items */}
                            {inactiveItems.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        Planning Only ({inactiveItems.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {inactiveItems.map((item, index) => (
                                            <PlanningItem
                                                key={item.id}
                                                item={item}
                                                category={category}
                                                index={index}
                                                payFrequency={payFrequency}                    // ADD THIS
                                                payFrequencyOptions={payFrequencyOptions}      // ADD THIS
                                                onEdit={onEditItem}
                                                onDelete={onDeleteItem}
                                                onToggleActive={onToggleItemActive}
                                                onMove={onMoveItem}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Main Planning Mode Component
const PlanningMode = ({
    categories,
    expenses,
    savingsGoals,
    payFrequency,
    payFrequencyOptions,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    onEditCategory,
    onDeleteCategory,
    onAddCategory,
    onMoveItem,
    onToggleCollapse
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'planning'
    const [showStats, setShowStats] = useState(true);

    // Get planning items from localStorage (post-migration data)
    const planningItems = useMemo(() => {
        try {
            const stored = localStorage.getItem('budgetCalc_planningItems');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not load planning items from localStorage:', error);
        }

        // Fallback: convert current expenses and goals
        return [
            ...expenses.map(exp => ({
                ...exp,
                type: 'expense',
                isActive: !exp.allocationPaused && exp.priorityState === 'active'
            })),
            ...savingsGoals.map(goal => ({
                ...goal,
                type: 'savings-goal',
                isActive: !goal.allocationPaused && goal.priorityState === 'active'
            }))
        ];
    }, [expenses, savingsGoals]);

    // Filter and search items
    const filteredCategories = useMemo(() => {
        return categories.map(category => {
            let categoryItems = planningItems.filter(item => item.categoryId === category.id);

            // Apply search filter
            if (searchTerm) {
                categoryItems = categoryItems.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Apply status filter
            if (filterStatus === 'active') {
                categoryItems = categoryItems.filter(item => item.isActive);
            } else if (filterStatus === 'planning') {
                categoryItems = categoryItems.filter(item => !item.isActive);
            }

            return {
                ...category,
                items: categoryItems
            };
        }).filter(category =>
            // Only show categories that have items after filtering, or show all if no search/filter
            category.items.length > 0 || (!searchTerm && filterStatus === 'all')
        );
    }, [categories, planningItems, searchTerm, filterStatus]);

    // Calculate summary stats
    const stats = useMemo(() => {
        const activeItems = planningItems.filter(item => item.isActive);
        const planningOnlyItems = planningItems.filter(item => !item.isActive);

        const totalMonthlyNeeds = activeItems.reduce((total, item) => {
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

        return {
            totalItems: planningItems.length,
            activeItems: activeItems.length,
            planningOnlyItems: planningOnlyItems.length,
            totalMonthlyNeeds,
            categoriesWithItems: categories.filter(cat =>
                planningItems.some(item => item.categoryId === cat.id)
            ).length
        };
    }, [planningItems, categories]);

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold text-theme-primary flex items-center">
                        <Target className="w-6 h-6 mr-2" />
                        Budget Planning
                    </h2>
                    <p className="text-theme-secondary">
                        Manage all your expenses and goals. Toggle items between active funding and planning-only states.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary text-sm"
                    />

                    {/* Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-theme-secondary rounded-lg bg-theme-primary text-theme-primary text-sm"
                    >
                        <option value="all">All Items</option>
                        <option value="active">Active Only</option>
                        <option value="planning">Planning Only</option>
                    </select>

                    {/* Add Category */}
                    <button
                        onClick={onAddCategory}
                        className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {showStats && (
                <div className="bg-theme-secondary rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-theme-primary">Planning Overview</h3>
                        <button
                            onClick={() => setShowStats(false)}
                            className="text-theme-tertiary hover:text-theme-secondary text-sm"
                        >
                            Hide
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-theme-secondary">Total Items</div>
                            <div className="text-xl font-bold text-theme-primary">{stats.totalItems}</div>
                        </div>
                        <div>
                            <div className="text-theme-secondary">Currently Funded</div>
                            <div className="text-xl font-bold text-green-600">{stats.activeItems}</div>
                        </div>
                        <div>
                            <div className="text-theme-secondary">Planning Only</div>
                            <div className="text-xl font-bold text-gray-500">{stats.planningOnlyItems}</div>
                        </div>
                        <div>
                            <div className="text-theme-secondary">Monthly Needs</div>
                            <div className="text-xl font-bold text-blue-600">${stats.totalMonthlyNeeds.toFixed(0)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories */}
            <div className="space-y-4">
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-12 bg-theme-secondary rounded-lg">
                        <Target className="w-12 h-12 mx-auto text-theme-tertiary mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-theme-primary">
                            {searchTerm || filterStatus !== 'all' ? 'No items match your filters' : 'Start Planning Your Budget'}
                        </h3>
                        <p className="text-theme-secondary mb-4">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Create categories and add your expenses and savings goals'
                            }
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <button
                                onClick={onAddCategory}
                                className="btn-primary px-6 py-3 rounded-lg"
                            >
                                Create First Category
                            </button>
                        )}
                    </div>
                ) : (
                    filteredCategories.map(category => (
                        <PlanningCategory
                            key={category.id}
                            category={category}
                            items={category.items}
                            payFrequency={payFrequency}
                            payFrequencyOptions={payFrequencyOptions}
                            onAddItem={onAddItem}
                            onEditItem={onEditItem}
                            onDeleteItem={onDeleteItem}
                            onToggleItemActive={onToggleItemActive}
                            onEditCategory={onEditCategory}
                            onDeleteCategory={onDeleteCategory}
                            onMoveItem={onMoveItem}
                            onToggleCollapse={onToggleCollapse}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default PlanningMode;