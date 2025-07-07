import { Page } from "components/shared/Page";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import BudgetCategoriesTable from "../../../../components/budget/BudgetCategoriesTable";
import SimplifiedSummaryCards from "../../../../components/budget/SimplifiedSummaryCards";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useDataModel } from "../../../../hooks/useDataModel";
import { useEnvelopeBudgeting } from "../../../../hooks/useEnvelopeBudgeting";
import { usePaycheckManagement } from "../../../../hooks/usePaycheckManagement";

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

    // Use paycheck management hook with safe fallback
    const paycheckHookResult = usePaycheckManagement(accounts || []);
    const {
        getPaychecksInDateRange,
        getTodayLocal
    } = paycheckHookResult || {};

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
        accounts: accounts || []
    });

    // Migrate categories to include type field if needed
    useEffect(() => {
        migrateCategoriesWithTypes(planningItems);
    }, [migrateCategoriesWithTypes, planningItems]);

    // Conservative paycheck info (from EnhancedBudgetTable)
    const getConservativePaycheckInfo = useCallback((payFreq) => {
        switch (payFreq) {
            case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
            case 'biweekly':
            case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
            case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
            case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
            default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        }
    }, []);

    // Helper function to calculate monthly amount based on frequency
    const calculateMonthlyAmount = useCallback((amount, frequency) => {
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
    }, []);

    // Helper function to calculate paychecks until due date using real paycheck schedule
    const calculatePaychecksUntilDue = useCallback((dueDate) => {
        if (!dueDate) return null;

        try {
            // Check if paycheck management functions are available
            if (getTodayLocal && getPaychecksInDateRange) {
                const today = getTodayLocal();
                const paychecksInRange = getPaychecksInDateRange(today, dueDate);

                console.log(`Calculating paychecks from ${today} to ${dueDate}:`, paychecksInRange.length);

                return paychecksInRange.length;
            } else {
                console.warn('Paycheck management functions not available, using fallback calculation');
                throw new Error('Paycheck functions not available');
            }
        } catch (error) {
            console.error('Error calculating paychecks until due:', error);
            // Fallback to old calculation
            const due = new Date(dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 0) return 0;
            return Math.ceil(daysUntilDue / 14); // Assuming bi-weekly pay
        }
    }, [getTodayLocal, getPaychecksInDateRange]);

    // Transform data for the budget table
    const transformDataForBudgetTable = useCallback((categories = [], planningItems = []) => {
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
                    item.categoryId === category.id // Show ALL items (active and inactive)
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
                subItems = categoryItems.map(item => {
                    const monthlyNeed = item.type === 'savings-goal'
                        ? (item.monthlyContribution || 0)
                        : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly');

                    const paychecksUntilDue = item.dueDate ? calculatePaychecksUntilDue(item.dueDate) : null;

                    // Calculate per paycheck based on due date if available
                    let perPaycheck;
                    const paycheckInfo = getConservativePaycheckInfo('bi-weekly');

                    if (item.dueDate && paychecksUntilDue > 0) {
                        // For items with due dates, calculate based on actual paychecks until due
                        perPaycheck = (item.amount || 0) / paychecksUntilDue;
                    } else {
                        // For items without due dates, use conservative approach (2 paychecks per month for bi-weekly)
                        perPaycheck = monthlyNeed / paycheckInfo.conservative;
                    }

                    return {
                        id: item.id,
                        parentId: category.id,
                        name: item.name,
                        amount: item.amount || (item.type === 'savings-goal' ? item.monthlyContribution : 0),
                        frequency: item.frequency || 'monthly',
                        monthlyNeed,
                        perPaycheck,
                        allocated: item.allocated || 0,
                        spent: 0, // TODO: Calculate from transactions
                        available: (item.allocated || 0) - 0, // allocated - spent
                        dueDate: item.dueDate || null,
                        paychecksUntilDue,
                        isSubItem: true,
                        isActive: item.isActive || true,
                        type: item.type
                    };
                });
            }

            // Calculate per paycheck amount - use real paycheck schedule for single categories with due dates
            let perPaycheck;
            if (category.type === 'single' && categoryDueDate) {
                const paychecksUntilDue = calculatePaychecksUntilDue(categoryDueDate);
                if (paychecksUntilDue > 0) {
                    // For single categories with due dates, calculate based on actual paychecks until due
                    perPaycheck = (category.amount || 0) / paychecksUntilDue;
                } else {
                    // Fallback to conservative approach
                    const paycheckInfo = getConservativePaycheckInfo('bi-weekly');
                    perPaycheck = monthlyNeed / paycheckInfo.conservative;
                }
            } else {
                // For categories without due dates or multiple categories, use conservative approach
                const paycheckInfo = getConservativePaycheckInfo('bi-weekly');
                perPaycheck = monthlyNeed / paycheckInfo.conservative; // Conservative: 2 paychecks per month for bi-weekly
            }

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
    }, [calculatePaychecksUntilDue, getConservativePaycheckInfo, calculateMonthlyAmount]);

    // Transform the real data for the table
    const tableData = useMemo(() =>
        transformDataForBudgetTable(categories, planningItems),
        [categories, planningItems, transformDataForBudgetTable]
    );

    // Calculate summary data
    const summaryData = useMemo(() => ({
        toBeAllocated: calculateToBeAllocated(),
        totalIncome: (accounts || []).reduce((sum, acc) => sum + (acc.balance || 0), 0),
        totalAllocated: categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0),
        totalSpent: categories.reduce((sum, cat) => sum + (cat.spent || 0), 0)
    }), [calculateToBeAllocated, accounts, categories]);

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
                updateCategory(editingCategory.id, {
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
                        removeItem(item.id);
                    });
                }
            } else {
                // Add new category
                const categoryId = Date.now().toString();
                addCategory({
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
            console.log('=== EDIT CATEGORY DEBUG ===');
            console.log('Row data received:', categoryData);

            // Find the original category from the categories array
            const originalCategory = categories.find(cat => cat.id === categoryData.id);
            console.log('Original category found:', originalCategory);

            // Use the original category data instead of the transformed table data
            const categoryToEdit = originalCategory || categoryData;
            console.log('Category to edit:', categoryToEdit);

            // Set the category to edit and show the modal
            setEditingCategory(categoryToEdit);
            setShowCategoryModal(true);

            console.log('=== EDIT CATEGORY COMPLETE ===');
        } catch (error) {
            console.error("Error editing category:", error);
        }
    }, [categories]);

    const handleDeleteCategory = useCallback((categoryId) => {
        try {
            const associatedItems = planningItems.filter(item => {
                const itemCategoryId = parseInt(item.categoryId, 10);
                const targetCategoryId = parseInt(categoryId, 10);
                return !isNaN(itemCategoryId) && !isNaN(targetCategoryId) && itemCategoryId === targetCategoryId;
            });

            const result = deleteCategory(categoryId, planningItems);

            if (result.success) {
                // Clean up any orphaned planning items after successful category deletion
                associatedItems.forEach(item => {
                    removeItem(item.id);
                });
            } else {
                // Show user-friendly alert with option to force delete
                const forceDelete = confirm(
                    `${result.error}\n\nWould you like to force delete this category and remove all associated items? This action cannot be undone.`
                );

                if (forceDelete) {
                    // Force delete: remove all associated items first, then delete category
                    associatedItems.forEach(item => {
                        removeItem(item.id);
                    });

                    // Try deleting the category again
                    setTimeout(() => {
                        const secondResult = deleteCategory(categoryId, []);
                        if (!secondResult.success) {
                            alert("Failed to delete category even after removing items. Please refresh the page and try again.");
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("An unexpected error occurred while deleting the category.");
        }
    }, [deleteCategory, planningItems, removeItem]);

    const handleAddItem = useCallback((itemData) => {
        try {
            if (itemData && itemData.categoryId) {
                const category = categories.find(cat => cat.id === itemData.categoryId);
                setPreselectedCategory(category);
                setEditingItem(null);
                setShowItemModal(true);
            } else {
                addItem(itemData);
            }
        } catch (error) {
            console.error("Error adding item:", error);
        }
    }, [addItem, categories]);

    const handleEditItem = useCallback((itemData) => {
        try {
            if (itemData && itemData.id && itemData.name) {
                setEditingItem(itemData);
                setPreselectedCategory(null);
                setShowItemModal(true);
            } else {
                updateItem(itemData.id, itemData);
            }
        } catch (error) {
            console.error("Error editing item:", error);
        }
    }, [updateItem]);

    const handleSaveItem = useCallback((itemData, addAnother = false) => {
        try {
            if (editingItem) {
                updateItem(editingItem.id, itemData);
            } else {
                addItem(itemData);
            }

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
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }, [removeItem]);

    const handleToggleItemActive = useCallback((itemId, isActive) => {
        try {
            toggleItemActive(itemId, isActive);
        } catch (error) {
            console.error("Error toggling item active:", error);
        }
    }, [toggleItemActive]);

    const handleToggleCategoryActive = useCallback((categoryId, isActive) => {
        try {
            updateCategory(categoryId, { isActive });
        } catch (error) {
            console.error("Error toggling category active:", error);
        }
    }, [updateCategory]);

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
                            isOpen={showCategoryModal}
                            onCancel={handleCloseCategoryModal}
                            onSave={handleSaveCategory}
                            category={editingCategory}
                            accounts={accounts}
                        />
                    </React.Suspense>
                )}

                {/* Item Form Modal */}
                {showItemModal && (
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <UnifiedItemForm
                            onCancel={handleCloseItemModal}
                            onSave={handleSaveItem}
                            item={editingItem}
                            preselectedCategory={preselectedCategory}
                            categories={categories}
                            accounts={accounts}
                        />
                    </React.Suspense>
                )}
            </div>
        </Page>
    );
}
