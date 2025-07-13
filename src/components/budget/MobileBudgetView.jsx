import { Badge } from 'components/ui/Badge';
import { Button } from 'components/ui/Button';
import {
    BanknoteArrowDown,
    Box,
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
import { getGradientStyle } from '../../utils/gradientUtils';
import MobileTransferModal from './MobileTransferModal';

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
    onDataUpdate,
}) => {
    const [expandedCategories, setExpandedCategories] = useState({});
    const [activeTab, setActiveTab] = useState('all'); // all, goals, expenses
    const [transferModal, setTransferModal] = useState({ isOpen: false, targetCategory: null });

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
                <div className="bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg border border-base-300 overflow-hidden shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <BanknoteArrowDown className="w-14 h-14 rounded-full flex items-center justify-center text-primary" />
                            <div>
                                <h3 className="text-lg font-semibold text-success-dark">
                                    Available to Allocate
                                </h3>
                                <p className="text-sm text-success">
                                    Choose how to allocate your money
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-success-dark">
                                {formatCurrency(availableToAllocate)}
                            </div>
                            <div className="text-sm text-success">
                                Ready to allocate
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={onQuickAllocate}
                        variant="outlined-primary"
                        color="primary"
                        isGlow={true}
                        className="w-full flex items-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-200"
                    >
                        <span>⚡</span>
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
                            : 'text-base-content/60 hover:bg-base-300'
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
                            {/* Category Header - Simplified */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Category Color & Icon */}
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-4 h-4 rotate-45 rounded-sm ${category.color} border border-base-300`}
                                                style={getGradientStyle(category.color)}
                                            ></div>
                                            {isExpense && <TrendingUp className="w-4 h-4 text-warning" />}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCategory(category.id);
                                                }}
                                                className="p-1 hover:bg-base-300 rounded transition-colors"
                                            >
                                                {isExpanded ?
                                                    <ChevronDown className="w-4 h-4 text-base-content/60" /> :
                                                    <ChevronRight className="w-4 h-4 text-base-content/60" />
                                                }
                                            </button>
                                        </div>

                                        {/* Category Name & Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate flex items-center gap-1">
                                                {category.type === 'multiple' && <Box className="w-4 h-4 text-primary" />}
                                                {category.planningType === 'goal' && <Target className="w-4 h-4 text-secondary" />}
                                                <span className="text-lg text-base-content">{category.name}</span>
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

                                    {/* Available Amount - Clickable Badge */}
                                    <div className="text-right">
                                        {hasAvailable ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTransferModal({
                                                        isOpen: true,
                                                        targetCategory: category
                                                    });
                                                }}
                                                className="inline-flex items-center px-3 py-2 rounded-full text-sm font-bold border transition-colors hover:opacity-80 focus:border-primary focus:outline-none bg-success-lighter/20 text-success border-success"
                                                title="Click to move money out of this category"
                                            >
                                                {formatCurrency(category.available || 0)}
                                            </button>
                                        ) : (
                                            <div className={`text-lg font-bold ${isOverspent ? 'text-error' : 'text-base-content/60'}`}>
                                                {formatCurrency(category.available || 0)}
                                            </div>
                                        )}
                                        <div className="text-xs text-base-content/60 mt-1">
                                            {isOverspent ? 'Overspent' : hasAvailable ? 'Tap to move' : 'No funds'}
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
                                            <span>${(parseFloat(category.alreadySaved) || 0).toFixed(2)} saved</span>
                                            <span>${(parseFloat(category.targetAmount) || 0).toFixed(2)} target</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category Actions */}
                            <div className="px-4 py-2 bg-base-300 border-t border-base-300">
                                <div className="flex items-center justify-end">
                                    <div className="flex items-center gap-1">
                                        {/* Add Item Button - Moved to align with edit/delete */}
                                        {category.type === 'multiple' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddItem({ categoryId: category.id });
                                                }}
                                                className="p-1 hover:bg-base-200 rounded transition-colors"
                                                title="Add Item"
                                            >
                                                <Plus className="w-4 h-4 text-base-content/60" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditCategory(category);
                                            }}
                                            className="p-1 hover:bg-base-200 rounded transition-colors"
                                        >
                                            <Edit className="w-4 h-4 text-base-content/60" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteCategory(category.id);
                                            }}
                                            className="p-1 hover:bg-base-200 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-base-content/60" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details Section - Combined budget details and sub-items */}
                            {isExpanded && (
                                <div className="border-t border-base-300">
                                    {/* Budget Details */}
                                    <div className="px-4 py-3 bg-base-100">
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center p-2 bg-base-300 rounded">
                                                <div className="font-medium text-info">
                                                    {formatCurrency(category.perPaycheck || 0)}
                                                </div>
                                                <div className="text-base-content/60">Per Paycheck</div>
                                            </div>
                                            <div className="text-center p-2 bg-base-300 rounded">
                                                <div className="font-medium text-success">
                                                    {formatCurrency(category.allocated || 0)}
                                                </div>
                                                <div className="text-base-content/60">Allocated</div>
                                            </div>
                                            <div className="text-center p-2 bg-base-300 rounded">
                                                <div className="font-medium text-error">
                                                    {formatCurrency(category.spent || 0)}
                                                </div>
                                                <div className="text-base-content/60">Spent</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Items */}
                                    {hasSubItems && (
                                        <div className="border-t border-base-300">
                                            {category.subItems.map(subItem => (
                                                <div key={subItem.id} className="px-4 py-3 border-b border-base-200 last:border-b-0">
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
                                                                className="p-1 hover:bg-base-200 rounded transition-colors"
                                                            >
                                                                <Edit className="w-3 h-3 text-base-content/60" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteItem(subItem.id);
                                                                }}
                                                                className="p-1 hover:bg-base-200 rounded transition-colors"
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
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="bg-base-200 rounded-lg border border-base-300 p-4">
                <h3 className="font-semibold text-base-content mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-info-lighter/20 border border-info rounded-lg">
                        <div className="font-bold text-info text-lg">
                            {formatCurrency(data.reduce((sum, cat) => sum + (cat.monthlyNeed || 0), 0))}
                        </div>
                        <div className="text-base-content">Monthly Need</div>
                    </div>
                    <div className="text-center p-3 bg-success-lighter/40 border border-success rounded-lg">
                        <div className="font-bold text-success text-lg">
                            {formatCurrency(data.reduce((sum, cat) => sum + (cat.allocated || 0), 0))}
                        </div>
                        <div className="text-base-content/60">Total Allocated</div>
                    </div>
                </div>
            </div>

            {/* Transfer Modal */}
            {transferModal.isOpen && (
                <MobileTransferModal
                    isOpen={transferModal.isOpen}
                    onClose={() => setTransferModal({ isOpen: false, targetCategory: null })}
                    targetCategory={transferModal.targetCategory}
                    categories={data}
                    availableToAllocate={availableToAllocate}
                    onTransferComplete={(transferData) => {
                        console.log('🔄 MobileBudgetView: Transfer completed callback received');
                        console.log('📊 Transfer data received:', transferData);

                        // Handle the transfer completion here
                        if (transferData.type === 'allocation') {
                            // Allocation from "to be allocated" to a category
                            console.log('💰 Processing allocation from unallocated funds');
                            const updatedData = data.map(category => {
                                if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    const newAllocated = (category.allocated || 0) + transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
                            }

                        } else if (transferData.type === 'deallocate') {
                            // Transfer from category back to "to be allocated"
                            console.log('💸 Processing deallocation back to unallocated funds');
                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    const newAllocated = (category.allocated || 0) - transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable,
                                        allocated: newAllocated
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
                            }

                        } else if (transferData.type === 'transfer') {
                            // Category-to-category transfer
                            console.log('🔄 Processing category-to-category transfer');
                            const updatedData = data.map(category => {
                                if (category.id === transferData.fromCategory) {
                                    const newAvailable = (category.available || 0) - transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                } else if (category.id === transferData.toCategory) {
                                    const newAvailable = (category.available || 0) + transferData.amount;
                                    return {
                                        ...category,
                                        available: newAvailable
                                    };
                                }
                                return category;
                            });

                            if (onDataUpdate) {
                                onDataUpdate(updatedData);
                            }
                        }

                        setTransferModal({ isOpen: false, targetCategory: null });
                    }}
                />
            )
            }
        </div >
    );
};

export default MobileBudgetView;
