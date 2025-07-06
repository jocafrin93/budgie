import { Page } from "components/shared/Page";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import BudgetCategoriesTable from "../../../../components/budget/BudgetCategoriesTable";
import SimplifiedSummaryCards from "../../../../components/budget/SimplifiedSummaryCards";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useDataModel } from "../../../../hooks/useDataModel";
import { useEnvelopeBudgeting } from "../../../../hooks/useEnvelopeBudgeting";

// Dynamic imports for forms
const UnifiedCategoryForm = React.lazy(() => import("../../../../components/budget/UnifiedCategoryForm"));
const UnifiedItemForm = React.lazy(() => import("../../../../components/budget/UnifiedItemForm"));

export default function BudgetOverview() {
    // Modal state for category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Modal state for item form
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);

    // Get accounts data from the hook
    const { accounts } = useAccountManagement();

    // Category management hook
    const {
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        migrateCategoriesWithTypes
    } = useCategoryManagement();

    // Data model hook for planning items - simplified to prevent infinite loops
    const {
        planningItems,
        addItem,
        updateItem,
        removeItem,
        toggleItemActive
    } = useDataModel({
        initialCategories: [],
        initialAccounts: [],
        payFrequency: 'bi-weekly'
    });

    // Envelope budgeting hook
    const {
        calculateToBeAllocated
    } = useEnvelopeBudgeting({
        categories,
        planningItems,
        transactions: [], // No transactions for now
        accounts
    });

    // Migrate categories to include type field if needed
    useEffect(() => {
        migrateCategoriesWithTypes(planningItems);
    }, [migrateCategoriesWithTypes, planningItems]);

    // Transform data for the budget table
    const transformDataForBudgetTable = (categories = [], planningItems = []) => {
        return categories.map(category => {
            let monthlyNeed = 0;
            let subItems = [];
            let categoryDueDate = null;

            if (category.type === 'single') {
                // For single categories, use the category's own data
                if (category.planningType === 'expense') {
                    // Calculate monthly need from category's amount and frequency
                    monthlyNeed = calculateMonthlyAmount(category.amount || 0, category.frequency || 'monthly');
                    categoryDueDate = category.dueDate || null;
                } else if (category.planningType === 'goal') {
                    // For goals, use monthly contribution
                    monthlyNeed = category.monthlyContribution || 0;
                }

                // Single categories don't have sub-items, they are self-contained
                subItems = [];
            } else {
                // For multiple categories, get planning items for this category
                const categoryItems = planningItems.filter(item =>
                    item.categoryId === category.id && item.isActive
                );

                // Calculate totals for the category from planning items
                monthlyNeed = categoryItems.reduce((sum, item) => {
                    if (item.type === 'savings-goal') {
                        return sum + (item.monthlyContribution || 0);
                    } else {
                        // For expenses, calculate monthly amount based on frequency
                        return sum + calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly');
                    }
                }, 0);

                // Transform sub-items
                subItems = categoryItems.map(item => ({
                    id: item.id,
                    parentId: category.id,
                    name: item.name,
                    amount: item.amount || (item.type === 'savings-goal' ? item.monthlyContribution : 0),
                    frequency: item.frequency || 'monthly',
                    monthlyNeed: item.type === 'savings-goal'
                        ? (item.monthlyContribution || 0)
                        : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly'),
                    perPaycheck: (item.type === 'savings-goal'
                        ? (item.monthlyContribution || 0)
                        : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly')) / 2.17,
                    allocated: item.allocated || 0,
                    spent: 0, // TODO: Calculate from transactions
                    available: (item.allocated || 0) - 0, // allocated - spent
                    dueDate: item.dueDate || null,
                    paychecksUntilDue: item.dueDate ? calculatePaychecksUntilDue(item.dueDate) : null,
                    isSubItem: true,
                    isActive: item.isActive || true,
                    type: item.type
                }));
            }

            // Calculate per paycheck amount (assuming bi-weekly)
            const perPaycheck = monthlyNeed / 2.17; // Approximate monthly to bi-weekly conversion

            return {
                id: category.id,
                name: category.name,
                type: category.type || 'multiple',
                monthlyNeed,
                perPaycheck,
                allocated: category.allocated || 0,
                spent: category.spent || 0,
                available: category.available || 0,
                dueDate: categoryDueDate,
                color: category.color || 'bg-blue-500',
                isActive: category.isActive !== false, // Default to true if not specified
                isParent: true,
                subItems
            };
        });
    };

    // Helper function to calculate monthly amount based on frequency
    const calculateMonthlyAmount = (amount, frequency) => {
        const multipliers = {
            'daily': 30.44,
            'weekly': 4.33,
            'bi-weekly': 2.17,
            'every-2-weeks': 2.17,
            'monthly': 1,
            'quarterly': 1 / 3,
            'semi-annually': 1 / 6,
            'annually': 1 / 12,
            'every-6-weeks': 52 / 6 / 12,
            'every-8-weeks': 52 / 8 / 12,
            'every-3-months': 4,
            'every-6-months': 2,
            'yearly': 1 / 12
        };
        return amount * (multipliers[frequency] || 1);
    };

    // Helper function to calculate paychecks until due date
    const calculatePaychecksUntilDue = (dueDate) => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 0) return 0;
        return Math.ceil(daysUntilDue / 14); // Assuming bi-weekly pay
    };

    // Transform the real data for the table
    const tableData = useMemo(() =>
        transformDataForBudgetTable(categories, planningItems),
        [categories, planningItems, transformDataForBudgetTable]
    );

    // Calculate summary data
    const summaryData = {
        toBeAllocated: calculateToBeAllocated(),
        totalIncome: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
        totalAllocated: categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0),
        totalSpent: categories.reduce((sum, cat) => sum + (cat.spent || 0), 0)
    };

    // Modal handlers
    const handleCloseCategoryModal = useCallback(() => {
        setShowCategoryModal(false);
        setEditingCategory(null);
    }, []);

    const handleCloseItemModal = useCallback(() => {
        setShowItemModal(false);
        setEditingItem(null);
        setPreselectedCategory(null);
    }, []);

    // Handler functions for the table
    const handleAddCategory = useCallback(() => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    }, []);

    const handleSaveCategory = useCallback((categoryData, addAnother = false) => {
        try {
            if (editingCategory) {
                // Update existing category
                const updatedCategory = updateCategory(editingCategory.id, {
                    name: categoryData.name,
                    type: categoryData.type,
                    color: categoryData.color,
                    status: categoryData.status,
                    priority: categoryData.priority,
                    description: categoryData.description,
                    autoFunding: categoryData.autoFunding,
                    accountId: categoryData.accountId,
                    isActive: categoryData.status === 'active',
                    // Include planning data for single categories
                    planningType: categoryData.planningType,
                    amount: categoryData.amount,
                    frequency: categoryData.frequency,
                    dueDate: categoryData.dueDate,
                    isRecurring: categoryData.isRecurring,
                    targetAmount: categoryData.targetAmount,
                    targetDate: categoryData.targetDate,
                    monthlyContribution: categoryData.monthlyContribution,
                    alreadySaved: categoryData.alreadySaved
                });

                // For single categories, remove any existing planning items since they shouldn't exist
                if (categoryData.type === 'single') {
                    const existingItems = planningItems.filter(item => item.categoryId === editingCategory.id);
                    existingItems.forEach(item => {
                        console.log('Removing orphaned planning item from single category:', item.id);
                        removeItem(item.id);
                    });
                }

                console.log('Updated category:', updatedCategory);
            } else {
                // Add new category
                const categoryId = Date.now().toString();

                const newCategory = addCategory({
                    id: categoryId,
                    name: categoryData.name,
                    type: categoryData.type,
                    color: categoryData.color,
                    status: categoryData.status,
                    priority: categoryData.priority,
                    description: categoryData.description,
                    autoFunding: categoryData.autoFunding,
                    accountId: categoryData.accountId,
                    isActive: categoryData.status === 'active',
                    // Include planning data for single categories
                    planningType: categoryData.planningType,
                    amount: categoryData.amount,
                    frequency: categoryData.frequency,
                    dueDate: categoryData.dueDate,
                    isRecurring: categoryData.isRecurring,
                    targetAmount: categoryData.targetAmount,
                    targetDate: categoryData.targetDate,
                    monthlyContribution: categoryData.monthlyContribution,
                    alreadySaved: categoryData.alreadySaved
                });

                // For single categories, DO NOT create separate planning items
                // The category itself contains all the planning data
                console.log('Single category created - no separate planning items needed');

                console.log('Added category:', newCategory);
            }

            // Close modal if not adding another
            if (!addAnother) {
                handleCloseCategoryModal();
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    }, [editingCategory, addCategory, updateCategory, planningItems, handleCloseCategoryModal, removeItem]);

    const handleEditCategory = useCallback((categoryData) => {
        try {
            // Set the category to edit and show the modal
            setEditingCategory(categoryData);
            setShowCategoryModal(true);
        } catch (error) {
            console.error("Error editing category:", error);
        }
    }, []);

    const handleDeleteCategory = useCallback((categoryId) => {
        try {
            // Debug: Log the category ID and associated items
            console.log('Attempting to delete category:', categoryId, typeof categoryId);
            const associatedItems = planningItems.filter(item => {
                console.log('Checking item:', item.id, item.categoryId, typeof item.categoryId, 'matches:', item.categoryId == categoryId, item.categoryId === categoryId);
                return item.categoryId == categoryId; // Use loose equality to handle string/number mismatch
            });
            console.log('Found associated items:', associatedItems);

            const result = deleteCategory(categoryId, planningItems);
            if (result.success) {
                console.log('Deleted category:', categoryId);

                // Clean up any orphaned planning items after successful category deletion
                associatedItems.forEach(item => {
                    console.log('Cleaning up orphaned planning item:', item.id);
                    removeItem(item.id);
                });
            } else {
                // Show user-friendly alert with option to force delete
                const forceDelete = confirm(
                    `${result.error}\n\nWould you like to force delete this category and remove all associated items? This action cannot be undone.`
                );

                if (forceDelete) {
                    // Force delete: remove all associated items first, then delete category
                    console.log('Force deleting category and associated items:', associatedItems);

                    // Remove all associated planning items
                    associatedItems.forEach(item => {
                        console.log('Force removing item:', item.id);
                        removeItem(item.id);
                    });

                    // Try deleting the category again
                    setTimeout(() => {
                        const secondResult = deleteCategory(categoryId, []);
                        if (secondResult.success) {
                            console.log('Force deleted category:', categoryId);
                        } else {
                            console.error("Failed to force delete category:", secondResult.error);
                            alert("Failed to delete category even after removing items. Please refresh the page and try again.");
                        }
                    }, 100);
                } else {
                    console.log('User cancelled force delete');
                }
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("An unexpected error occurred while deleting the category.");
        }
    }, [deleteCategory, planningItems, removeItem]);

    const handleAddItem = useCallback((itemData) => {
        try {
            // If itemData has categoryId, it's coming from the "Add Item" button in table
            if (itemData && itemData.categoryId) {
                const category = categories.find(cat => cat.id === itemData.categoryId);
                setPreselectedCategory(category);
                setEditingItem(null);
                setShowItemModal(true);
            } else {
                // This is actual item data from the form
                addItem(itemData);
                console.log('Added item:', itemData);
            }
        } catch (error) {
            console.error("Error adding item:", error);
        }
    }, [addItem, categories]);

    const handleEditItem = useCallback((itemData) => {
        try {
            // If itemData has all the item properties, it's coming from the edit button
            if (itemData && itemData.id && itemData.name) {
                setEditingItem(itemData);
                setPreselectedCategory(null);
                setShowItemModal(true);
            } else {
                // This is actual item data from the form
                updateItem(itemData.id, itemData);
                console.log('Updated item:', itemData);
            }
        } catch (error) {
            console.error("Error editing item:", error);
        }
    }, [updateItem]);

    const handleSaveItem = useCallback((itemData, addAnother = false) => {
        try {
            if (editingItem) {
                // Update existing item
                updateItem(editingItem.id, itemData);
                console.log('Updated item:', itemData);
            } else {
                // Add new item
                addItem(itemData);
                console.log('Added item:', itemData);
            }

            // Close modal if not adding another
            if (!addAnother) {
                handleCloseItemModal();
            }
        } catch (error) {
            console.error("Error saving item:", error);
        }
    }, [editingItem, addItem, updateItem, handleCloseItemModal]);

    const handleDeleteItem = useCallback((itemId) => {
        try {
            removeItem(itemId);
            console.log('Deleted item:', itemId);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }, [removeItem]);

    const handleToggleItemActive = useCallback((itemId, isActive) => {
        try {
            toggleItemActive(itemId, isActive);
            console.log('Toggled item active:', itemId, isActive);
        } catch (error) {
            console.error("Error toggling item active:", error);
        }
    }, [toggleItemActive]);

    const handleToggleCategoryActive = useCallback((categoryId, isActive) => {
        try {
            updateCategory(categoryId, { isActive });
            console.log('Toggled category active:', categoryId, isActive);
        } catch (error) {
            console.error("Error toggling category active:", error);
        }
    }, [updateCategory]);

    // Category handlers - commented out for now, will be needed later
    /*
    const handleAddCategory = useCallback((categoryData) => {
        try {
            const newCategory = addCategory(categoryData);

            // For single categories with expense data, create a planning item
            if (categoryData.type === 'single' && categoryData.planningType === 'expense') {
                const newItem = {
                    id: generateItemId(),
                    categoryId: newCategory.id,
                    name: categoryData.name,
                    type: 'expense',
                    amount: categoryData.amount || 0,
                    frequency: categoryData.frequency || 'monthly',
                    dueDate: categoryData.dueDate || null,
                    isActive: true,
                    isRecurring: categoryData.isRecurring || false,
                    priority: categoryData.priority || 'medium',
                    allocated: 0
                };
                setPlanningItems(prev => [...prev, newItem]);
            }

            // For single categories with goal data, create a savings goal item
            if (categoryData.type === 'single' && categoryData.planningType === 'goal') {
                const newItem = {
                    id: generateItemId(),
                    categoryId: newCategory.id,
                    name: categoryData.name,
                    type: 'savings-goal',
                    targetAmount: categoryData.targetAmount || 0,
                    targetDate: categoryData.targetDate,
                    monthlyContribution: categoryData.monthlyContribution || 0,
                    alreadySaved: categoryData.alreadySaved || 0,
                    isActive: true,
                    allocated: categoryData.alreadySaved || 0
                };
                setPlanningItems(prev => [...prev, newItem]);
            }
        } catch (error) {
            console.error("Error adding category:", error);
        }
    }, [addCategory, generateItemId, setPlanningItems]);

    const handleEditCategory = useCallback((categoryData) => {
        try {
            updateCategory(categoryData.id, categoryData);

            // Update associated planning items for single categories
            if (categoryData.type === 'single') {
                setPlanningItems(prev => prev.map(item => {
                    if (item.categoryId === categoryData.id) {
                        if (categoryData.planningType === 'expense') {
                            return {
                                ...item,
                                name: categoryData.name,
                                amount: categoryData.amount || 0,
                                frequency: categoryData.frequency || 'monthly',
                                dueDate: categoryData.dueDate || null,
                                isRecurring: categoryData.isRecurring || false
                            };
                        } else if (categoryData.planningType === 'goal') {
                            return {
                                ...item,
                                name: categoryData.name,
                                targetAmount: categoryData.targetAmount || 0,
                                targetDate: categoryData.targetDate,
                                monthlyContribution: categoryData.monthlyContribution || 0,
                                alreadySaved: categoryData.alreadySaved || 0
                            };
                        }
                    }
                    return item;
                }));
            }
        } catch (error) {
            console.error("Error editing category:", error);
        }
    }, [updateCategory, setPlanningItems]);

    const handleDeleteCategory = useCallback((categoryId) => {
        try {
            const result = deleteCategory(categoryId, planningItems);
            if (result.success) {
                // Remove associated planning items
                setPlanningItems(prev => prev.filter(item => item.categoryId !== categoryId));
            } else {
                console.error("Cannot delete category:", result.error);
            }
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    }, [deleteCategory, planningItems, setPlanningItems]);

    // Planning item handlers
    const handleAddItem = useCallback((itemData) => {
        try {
            const newItem = {
                id: generateItemId(),
                ...itemData,
                isActive: true,
                allocated: 0
            };
            setPlanningItems(prev => [...prev, newItem]);
        } catch (error) {
            console.error("Error adding item:", error);
        }
    }, [generateItemId, setPlanningItems]);

    const handleEditItem = useCallback((itemData) => {
        try {
            setPlanningItems(prev => prev.map(item =>
                item.id === itemData.id ? { ...item, ...itemData } : item
            ));
        } catch (error) {
            console.error("Error editing item:", error);
        }
    }, [setPlanningItems]);

    const handleDeleteItem = useCallback((itemToDelete) => {
        try {
            const itemId = typeof itemToDelete === 'object' ? itemToDelete.id : itemToDelete;
            setPlanningItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }, [setPlanningItems]);

    const handleToggleItemActive = useCallback((itemId, isActive) => {
        try {
            setPlanningItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, isActive } : item
            ));
        } catch (error) {
            console.error("Error toggling item active:", error);
        }
    }, [setPlanningItems]);

    const handleToggleCategoryActive = useCallback((categoryId, isActive) => {
        try {
            updateCategory(categoryId, { isActive });
        } catch (error) {
            console.error("Error toggling category active:", error);
        }
    }, [updateCategory]);

    // Paycheck configuration
    const payFrequency = "biweekly";
    const getAllUpcomingPaycheckDates = useCallback((count = 6) => {
        const dates = [];
        const today = new Date();
        let nextPayday = new Date(today);

        // Find next Friday (assuming biweekly on Fridays)
        const daysUntilFriday = (5 - today.getDay() + 7) % 7;
        nextPayday.setDate(today.getDate() + daysUntilFriday);

        // Generate upcoming paycheck dates
        for (let i = 0; i < count; i++) {
            dates.push({ date: new Date(nextPayday) });
            nextPayday.setDate(nextPayday.getDate() + 14); // Add 2 weeks
        }

        return dates;
    }, []);
    */

    return (
        <Page title="Budget Overview">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                {/* Summary Cards */}
                <div className="mb-6">
                    <SimplifiedSummaryCards
                        summaryData={summaryData}
                        categories={categories}
                    />
                </div>

                {/* Main Budget View */}
                <BudgetCategoriesTable
                    data={tableData}
                    onAddCategory={handleAddCategory}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddItem={handleAddItem}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                    onToggleItemActive={handleToggleItemActive}
                    onToggleCategoryActive={handleToggleCategoryActive}
                />

                {/* Category Form Modal */}
                {showCategoryModal && (
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <UnifiedCategoryForm
                            category={editingCategory}
                            onSave={handleSaveCategory}
                            onCancel={handleCloseCategoryModal}
                            accounts={accounts}
                            currentPay={accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)}
                        />
                    </React.Suspense>
                )}

                {/* Item Form Modal */}
                {showItemModal && (
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <UnifiedItemForm
                            item={editingItem}
                            onSave={handleSaveItem}
                            onCancel={handleCloseItemModal}
                            categories={categories}
                            accounts={accounts}
                            currentPay={accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)}
                            preselectedCategory={preselectedCategory}
                        />
                    </React.Suspense>
                )}
            </div>
        </Page>
    );
}
