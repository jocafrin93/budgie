// src/components/UnifiedEnvelopeBudgetView.js
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    ChevronDown,
    ChevronRight,
    DollarSign,
    Edit,
    Plus,
    ToggleLeft,
    ToggleRight,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { frequencyOptions } from '../utils/constants';
import CurrencyInput from './CurrencyInput';

/**
 * Unified EnvelopeBudgetView component
 * 
 * This component combines planning and budgeting into a single unified interface
 * using Enhanced Category Structure (single vs multiple expense categories).
 * It preserves all existing calculation logic while providing a cleaner UX.
 */
const UnifiedEnvelopeBudgetView = ({
    // Data
    categories = [],
    planningItems = [],
    toBeAllocated = 0,

    // Functions from useEnvelopeBudgeting
    fundCategory,
    transferFunds,

    // Actions
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,

    // Optional
    onShowPaydayWorkflow,
    recentPaycheck = null,

    // Paycheck configuration - YOUR EXISTING CONFIG
    payFrequency,
    payFrequencyOptions
}) => {
    // Track expanded categories
    const [expandedCategories, setExpandedCategories] = useState({});

    // State for adding new categories
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('single');
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Toggle category expansion
    const toggleCategoryExpanded = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // YOUR EXISTING calculation logic preserved
    const getConservativePaycheckInfo = (payFreq) => {
        switch (payFreq) {
            case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
            case 'biweekly':
            case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
            case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
            case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
            default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        }
    };

    // YOUR EXISTING amount display calculation preserved  
    const getAmountDisplayInfo = (item, payFrequency, payFrequencyOptions) => {
        const isGoal = item.type === 'savings-goal';
        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
        const today = new Date();

        // Your existing conservative paycheck info logic
        const paycheckInfo = getConservativePaycheckInfo(payFrequency);
        const daysPerPaycheck = Math.ceil(30 / paycheckInfo.average);

        let monthlyAmount = 0;
        let perPaycheckAmount = 0;

        const freqOption = frequencyOptions.find(opt => opt.value === item.frequency);

        if (isGoal) {
            // For savings goals, always use conservative approach
            monthlyAmount = item.monthlyContribution || 0;
            perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
        } else {
            // For expenses, use your perfect hybrid approach from constants
            const itemAmount = item.amount || 0;

            if (freqOption) {
                // Convert item amount to monthly equivalent using YOUR weeksPerYear
                monthlyAmount = itemAmount * (freqOption.weeksPerYear / 12);

                // Use your isRegular flag for hybrid strategy!
                if (freqOption.isRegular) {
                    // CONSERVATIVE: Use minimum paycheck count for regular expenses
                    perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
                } else {
                    // TRUE AVERAGE: Use accurate average for irregular expenses  
                    perPaycheckAmount = monthlyAmount / paycheckInfo.average;
                }
            } else {
                // Fallback for unknown frequencies
                monthlyAmount = itemAmount;
                perPaycheckAmount = itemAmount / paycheckInfo.conservative;
            }
        }

        // YOUR EXISTING due date logic preserved
        let paychecksUntilDue = null;
        if (dueDate) {
            const dueTime = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
            const todayTime = new Date(today.getTime() + today.getTimezoneOffset() * 60000);
            const daysUntilDue = Math.ceil((dueTime - todayTime) / (24 * 60 * 60 * 1000));

            paychecksUntilDue = Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));

            if (paychecksUntilDue > 0) {
                const allocated = item.allocated || 0;
                const targetAmount = isGoal ? (item.targetAmount || monthlyAmount) : monthlyAmount;
                const remaining = Math.max(0, targetAmount - allocated);
                perPaycheckAmount = remaining / paychecksUntilDue;
            }
        }

        return {
            monthlyAmount,
            perPaycheckAmount,
            paychecksUntilDue,
            usingConservative: !freqOption || freqOption.isRegular,
            paycheckInfo
        };
    };

    // Get category items and calculate needs
    const getCategoryData = (category) => {
        const categoryItems = planningItems.filter(item => item.categoryId === category.id);

        // Determine category type (add to your existing model later)
        const categoryType = category.type || (categoryItems.length <= 1 ? 'single' : 'multiple');

        if (categoryType === 'single') {
            // Single expense category - use category's own data if available, otherwise use first item
            let singleData;

            if (category.settings?.amount) {
                // Category has its own expense data (from enhanced form)
                singleData = {
                    amount: category.settings.amount,
                    frequency: category.settings.frequency || 'monthly',
                    dueDate: category.settings.dueDate
                };
            } else if (categoryItems[0]) {
                // Fall back to first item's data
                singleData = categoryItems[0];
            } else {
                // No data available
                return {
                    type: 'single',
                    perPaycheckNeed: 0,
                    monthlyNeed: 0,
                    items: [],
                    urgencyInfo: null,
                    needsConfiguration: true
                };
            }

            const displayInfo = getAmountDisplayInfo(singleData, payFrequency, payFrequencyOptions);
            const urgencyInfo = getUrgencyInfo(singleData);

            return {
                type: 'single',
                perPaycheckNeed: displayInfo.perPaycheckAmount,
                monthlyNeed: displayInfo.monthlyAmount,
                items: categoryItems,
                urgencyInfo,
                paychecksUntilDue: displayInfo.paychecksUntilDue,
                singleData,
                needsConfiguration: false
            };
        } else {
            // Multiple expense category - YOUR EXISTING planning logic
            const activeItems = categoryItems.filter(item => item.isActive);

            const totalPerPaycheckNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);
                return total + Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
            }, 0);

            const totalMonthlyNeed = activeItems.reduce((total, item) => {
                const displayInfo = getAmountDisplayInfo(item, payFrequency, payFrequencyOptions);
                return total + displayInfo.monthlyAmount;
            }, 0);

            return {
                type: 'multiple',
                perPaycheckNeed: totalPerPaycheckNeed,
                monthlyNeed: totalMonthlyNeed,
                items: categoryItems,
                activeItems,
                urgencyInfo: getMostUrgentItem(activeItems)
            };
        }
    };

    // YOUR EXISTING urgency logic preserved
    const getUrgencyInfo = (item) => {
        if (!item.dueDate) return null;

        const daysUntilDue = Math.ceil(
            (new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue <= 7) {
            return { level: 'urgent', message: `Due in ${daysUntilDue} days`, color: 'text-red-600' };
        } else if (daysUntilDue <= 14) {
            return { level: 'warning', message: `Due in ${daysUntilDue} days`, color: 'text-orange-600' };
        }
        return null;
    };

    const getMostUrgentItem = (items) => {
        return items
            .map(item => ({ item, urgency: getUrgencyInfo(item) }))
            .filter(({ urgency }) => urgency)
            .sort((a, b) => {
                const aLevel = a.urgency.level === 'urgent' ? 1 : 2;
                const bLevel = b.urgency.level === 'urgent' ? 1 : 2;
                return aLevel - bLevel;
            })[0]?.urgency || null;
    };

    // Handle adding new category
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        if (onAddCategory) {
            onAddCategory({
                name: newCategoryName,
                type: newCategoryType,
                available: 0,
                allocated: 0
            });
        }

        setNewCategoryName('');
        setShowAddCategory(false);
    };

    // Get frequency label for display
    const getFrequencyLabel = () => {
        return payFrequency.replace('-', ' ');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Budget</h2>
                    <p className="text-gray-600">
                        Unified planning and allocation interface
                    </p>
                </div>

                {recentPaycheck && (
                    <button
                        onClick={onShowPaydayWorkflow}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Allocate Recent Paycheck
                    </button>
                )}
            </div>

            {/* Ready to Assign */}
            <div className="bg-white rounded-lg border-l-4 border-green-500 shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Ready to Assign</h3>
                                <p className="text-sm text-gray-600">Money available for allocation</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">
                                    ${toBeAllocated.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">Available to assign</div>
                            </div>

                            {/* NEW: Assign Money Button */}
                            <button
                                onClick={() => setShowAssignModal(true)}
                                disabled={toBeAllocated <= 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Assign Money
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Categories */}
            <div className="space-y-4">
                {/* <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddCategory(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div> */}
                {categories.map(category => {
                    const categoryData = getCategoryData(category);
                    const isExpanded = expandedCategories[category.id];
                    const isOverspent = category.available < 0;

                    return (
                        <UnifiedCategoryCard
                            key={category.id}
                            category={category}
                            categoryData={categoryData}
                            isExpanded={isExpanded}
                            isOverspent={isOverspent}
                            onToggleExpand={() => toggleCategoryExpanded(category.id)}
                            onFund={fundCategory}
                            onEditCategory={onEditCategory}
                            onDeleteCategory={onDeleteCategory}
                            onAddItem={onAddItem}
                            onEditItem={onEditItem}
                            onDeleteItem={onDeleteItem}
                            onToggleItemActive={onToggleItemActive}
                            payFrequency={payFrequency}
                            getAmountDisplayInfo={getAmountDisplayInfo}
                            getFrequencyLabel={getFrequencyLabel}
                            categories={categories}
                            transferFunds={transferFunds}
                        />
                    );
                })}
            </div>
            {showAssignModal && (
                <AssignMoneyModal
                    availableAmount={toBeAllocated}
                    categories={categories}
                    onAssign={(categoryId, amount) => {
                        if (transferFunds) {
                            transferFunds('toBeAllocated', categoryId, amount);
                        } else if (fundCategory) {
                            fundCategory(categoryId, amount);
                        }
                        setShowAssignModal(false);
                    }}
                    onClose={() => setShowAssignModal(false)}
                />
            )}
        </div>
    );
};

// Individual Category Card Component
// Money Movement Modal Component
const MoneyMovementModal = ({ amount, sourceCategory, categories, onMove, onClose }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [moveAmount, setMoveAmount] = useState(amount.toFixed(2));

    const handleMove = () => {
        console.log('Money Movement Debug:', {
            selectedCategory: selectedCategoryId,
            moveAmount,
            sourceCategory,
            availableAmount: amount
        });

        if (selectedCategoryId && moveAmount) {
            const parsedAmount = parseFloat(moveAmount);
            const source = sourceCategory.id;
            let destination;
            if (selectedCategoryId === 'ready-to-assign') {
                destination = 'toBeAllocated';
            } else {
                // Convert string category ID to number
                destination = parseInt(selectedCategoryId, 10);
            }
            console.log('Attempting to move money:', {
                source,
                destination,
                parsedAmount,
                isValid: !isNaN(parsedAmount) && parsedAmount > 0
            });

            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                console.log('Calling transferFunds with:', {
                    source,
                    destination,
                    amount: parsedAmount
                });
                onMove(source, destination, parsedAmount);
                onClose();
            } else {
                console.warn('Invalid amount:', {
                    moveAmount,
                    parsedAmount,
                    isNaN: isNaN(parsedAmount),
                    isPositive: parsedAmount > 0
                });
            }
        } else {
            console.warn('Missing required fields:', {
                hasSelectedCategory: Boolean(selectedCategoryId),
                hasMoveAmount: Boolean(moveAmount)
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">Move Money</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <CurrencyInput
                            value={moveAmount}
                            onChange={(e) => setMoveAmount(e.target.value)}
                            className="border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a category...</option>
                            <option value="ready-to-assign">Ready to Assign</option>
                            {categories.map(cat => (
                                cat.id !== sourceCategory.id && (
                                    <option key=
                                        {cat.id} value={cat.id}>
                                        {cat.name} (${(cat.available || 0).toFixed(2)} available)

                                    </option>
                                )
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMove}
                        disabled={!selectedCategoryId || !moveAmount}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

const UnifiedCategoryCard = ({
    categories,
    transferFunds,
    category,
    categoryData,
    isExpanded,
    isOverspent,
    onToggleExpand,
    onFund,
    onEditCategory,
    onDeleteCategory,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onToggleItemActive,
    payFrequency,
    getAmountDisplayInfo,
    getFrequencyLabel
}) => {
    const [fundAmount, setFundAmount] = useState('');
    const [showMoveModal, setShowMoveModal] = useState(false);

    const handleFund = () => {
        const amount = parseFloat(fundAmount);
        if (amount > 0 && onFund) {
            onFund(category.id, amount);
            setFundAmount('');
        }
    };

    return (
        <div className={`bg-white rounded-lg border ${isOverspent ? 'border-red-300' : 'border-gray-200'} overflow-hidden shadow-sm`}>
            {/* Header */}
            <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {categoryData.type === 'multiple' ? (
                            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        ) : null}

                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full ${category.color || 'bg-gray-400'} shadow-lg border-2 border-white`} />
                            <div>
                                <h3 className="font-semibold text-gray-900">{category.name}</h3>

                                {categoryData.type === 'single' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            Single
                                        </span>
                                        {categoryData.singleData?.dueDate && (
                                            <span className="text-xs text-gray-600 flex items-center gap-1">
                                                • <Calendar className="w-3.5 h-3.5" />
                                                {new Date(categoryData.singleData.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                                                {categoryData.paychecksUntilDue !== null && (
                                                    <span className="ml-1">• {categoryData.paychecksUntilDue} paychecks remaining</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                        Multiple ({categoryData.activeItems?.length || 0} active)
                                    </span>
                                )}
                            </div>

                            {categoryData.urgencyInfo && (
                                <div className={`text-sm ${categoryData.urgencyInfo.color} flex items-center gap-1 mt-1`}>
                                    <AlertTriangle className="w-3 h-3" />
                                    {categoryData.urgencyInfo.message}
                                </div>
                            )}
                        </div>

                        {/* Category Controls */}
                        <div className="flex items-center gap-1 ml-auto mr-4">
                            {/* Add Item (Multiple categories only) */}
                            {categoryData.type === 'multiple' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAddItem) onAddItem({ categoryId: category.id });
                                    }}
                                    className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                                    title="Add item to this category"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}

                            {/* Edit Category */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEditCategory) onEditCategory(category); // Pass just the category object
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit category"
                            >
                                <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Category */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDeleteCategory) onDeleteCategory(category.id);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete category"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="text-right">
                        <div
                            className={`text-lg font-semibold ${isOverspent ? 'text-red-600' : 'text-green-600'} cursor-pointer hover:opacity-80`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMoveModal(true);
                            }}
                        >
                            ${(category.available || 0).toFixed(2)} available
                        </div>
                        {categoryData.monthlyNeed > 0 && (
                            <div className="text-sm text-gray-600">
                                ${categoryData.monthlyNeed.toFixed(2)} needed/month
                            </div>
                        )}
                        {categoryData.perPaycheckNeed > 0 && (
                            <div className="text-xs text-gray-500">
                                ${categoryData.perPaycheckNeed.toFixed(2)} per {getFrequencyLabel()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Content for Multiple Categories AND Item Details */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                    {categoryData.type === 'single' && categoryData.singleData ? (
                        /* Single Category - Show the one expense details */
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="font-medium text-gray-900">{category.name} Details</div>
                                        <div className="text-sm text-gray-600">
                                            ${categoryData.singleData.amount} {categoryData.singleData.frequency}
                                            {categoryData.singleData.dueDate && (
                                                <>
                                                    <span className="ml-2 inline-flex items-center gap-1">•<Calendar className="w-3.5 h-3.5" /> {new Date(categoryData.singleData.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    {categoryData.paychecksUntilDue !== null && (
                                                        <span className="ml-2 text-xs text-gray-600">• {categoryData.paychecksUntilDue} paychecks remaining</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onEditCategory) onEditCategory(category); // Pass just the category object
                                        }}
                                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Edit category"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : categoryData.type === 'multiple' ? (
                        /* Multiple Categories - Show item list with full functionality */
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Items in this category</h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onAddItem) onAddItem({ categoryId: category.id });
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Item
                                </button>
                            </div>

                            {categoryData.items.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                    <div className="w-8 h-8 mx-auto mb-2 opacity-50">📦</div>
                                    <p>No items in this category yet</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onAddItem) onAddItem({ categoryId: category.id });
                                        }}
                                        className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                                    >
                                        Add your first item
                                    </button>
                                </div>
                            ) : (
                                categoryData.items.map(item => {
                                    const displayInfo = getAmountDisplayInfo(item, payFrequency);
                                    const needed = Math.max(0, displayInfo.perPaycheckAmount - (item.allocated || 0));
                                    const isActive = item.isActive;
                                    const isGoal = item.type === 'savings-goal';

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all ${isActive
                                                ? 'bg-green-50 border border-green-200'
                                                : 'bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-sm text-gray-600">
                                                        ${displayInfo.perPaycheckAmount.toFixed(2)}/{getFrequencyLabel()} • ${displayInfo.monthlyAmount.toFixed(2)} monthly
                                                        {item.dueDate && (
                                                            <>
                                                                <span className="ml-2 inline-flex items-center gap-1">•<Calendar className="w-3.5 h-3.5" /> {new Date(item.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                                {displayInfo.paychecksUntilDue !== null && (
                                                                    <span className="ml-2 text-xs text-gray-600">• {displayInfo.paychecksUntilDue} paychecks remaining</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="text-right text-sm">
                                                    <div className="font-medium">
                                                        ${(item.allocated || 0).toFixed(2)} allocated
                                                    </div>
                                                    <div className="text-gray-600">
                                                        ${needed.toFixed(2)} needed per {getFrequencyLabel()}
                                                    </div>
                                                </div>

                                                {/* Item Controls */}
                                                <div className="flex items-center gap-1 ml-3">
                                                    {/* Active/Planning Toggle */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onToggleItemActive) onToggleItemActive(item.id, !isActive);
                                                        }}
                                                        className={`p-1 rounded transition-colors ${isActive
                                                            ? 'text-green-600 hover:text-green-700'
                                                            : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                        title={isActive ? 'Mark as planning only' : 'Mark as active'}
                                                    >
                                                        {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>

                                                    {/* Edit Item */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onEditItem) onEditItem(item);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Edit item"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete Item */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onDeleteItem) onDeleteItem(item);
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                                        title="Delete item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* Single Category - Needs Configuration */
                        <div className="text-center py-6 text-orange-600">
                            <div className="w-8 h-8 mx-auto mb-2 opacity-50">⚙️</div>
                            <p>This single category needs configuration</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEditCategory) onEditCategory(category); // Pass full category object
                                }}
                                className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                            >
                                Configure expense details
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Funding Interface */}
            {categoryData.perPaycheckNeed > 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex gap-3">
                        <CurrencyInput
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            placeholder={categoryData.perPaycheckNeed.toFixed(2)}
                            className="border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={() => setFundAmount(categoryData.perPaycheckNeed.toFixed(2))}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                            Need
                        </button>
                        <button
                            onClick={handleFund}
                            disabled={!fundAmount || parseFloat(fundAmount) <= 0}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            Fund
                        </button>
                    </div>
                </div>
            )}

            {/* Money Movement Modal */}
            {showMoveModal && (
                <MoneyMovementModal
                    amount={category.available || 0}
                    sourceCategory={category}
                    categories={categories}
                    onMove={transferFunds}
                    onClose={() => setShowMoveModal(false)}
                />
            )}
        </div>
    );
};

const AssignMoneyModal = ({ availableAmount, categories, onAssign, onClose }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [assignAmount, setAssignAmount] = useState('');

    const handleAssign = () => {
        if (selectedCategoryId && assignAmount) {
            const parsedAmount = parseFloat(assignAmount);
            if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= availableAmount) {
                onAssign(parseInt(selectedCategoryId, 10), parsedAmount);
            }
        }
    };

    const setQuickAmount = (amount) => {
        setAssignAmount(Math.min(amount, availableAmount).toString());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <h3 className="text-lg font-semibold mb-4">Assign Money to Category</h3>

                <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-green-700">Available to assign:</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${availableAmount.toFixed(2)}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Category
                        </label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} (${(cat.available || 0).toFixed(2)} available)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <div className="relative mb-2">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={assignAmount}
                                onChange={(e) => setAssignAmount(e.target.value)}
                                className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                step="0.01"
                                max={availableAmount}
                            />
                            <button
                                onClick={() => setAssignAmount(availableAmount.toString())}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                            >
                                All
                            </button>
                        </div>

                        {/* Quick amount buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {[25, 50, 100, 200].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setQuickAmount(amount)}
                                    disabled={amount > availableAmount}
                                    className="py-1 px-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ${amount}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedCategoryId || !assignAmount || parseFloat(assignAmount) <= 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign Money
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnifiedEnvelopeBudgetView;