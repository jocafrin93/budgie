import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { Page } from "components/shared/Page";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import BudgetCategoriesTable from "../../../../components/budget/BudgetCategoriesTable";
import SimplifiedSummaryCards from "../../../../components/budget/SimplifiedSummaryCards";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useDataModel } from "../../../../hooks/useDataModel";
import { useEnvelopeBudgeting } from "../../../../hooks/useEnvelopeBudgeting";
import { useMonthlyBudgeting } from "../../../../hooks/useMonthlyBudgeting";
import { usePaycheckManagement } from "../../../../hooks/usePaycheckManagement";
import { useScheduledTransactions } from "../../../../hooks/useScheduledTransactions";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

// Import DaisyUI wrapper for theme support

// Dynamic imports for forms
const UnifiedCategoryForm = React.lazy(() => import("../../../../components/budget/UnifiedCategoryForm"));
const UnifiedItemForm = React.lazy(() => import("../../../../components/budget/UnifiedItemForm"));
const MobileBudgetView = React.lazy(() => import("../../../../components/budget/MobileBudgetView"));

// Direct import for MonthlyBudgetNavigator to prevent flickering
import MonthlyBudgetNavigator from "../../../../components/budget/MonthlyBudgetNavigator";

export default function BudgetOverview() {
    // Get breakpoint context for responsive rendering
    const { mdAndDown } = useBreakpointsContext();
    // Modal state for category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Modal state for item form
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);

    // Quick Allocate Modal state
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });

    // Monthly budget navigator state
    const [currentBudgetMonth, setCurrentBudgetMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Get accounts data from the hook
    const { accounts } = useAccountManagement();

    // Use paycheck management hook with safe fallback
    const paycheckHookResult = usePaycheckManagement(accounts || []);
    const {
        getPaychecksInDateRange,
        getUpcomingPaycheckDatesForAccount,
        getTodayLocal,
        getAllUpcomingPaycheckDates
    } = paycheckHookResult || {};

    // Category management hook
    const {
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        migrateCategoriesWithTypes,
        setCategories
    } = useCategoryManagement();

    // Use transaction management hook properly (same as transactions page)
    const {
        transactions
    } = useTransactionManagement(accounts, () => { }, categories, setCategories);

    // Helper function to calculate spent amount for a category from transactions
    const calculateCategorySpent = useCallback((categoryId) => {
        if (!transactions || !Array.isArray(transactions)) return 0;

        return transactions.reduce((total, transaction) => {
            // Only count expense transactions (negative amounts) for this category
            if (transaction.categoryId === categoryId && transaction.amount < 0) {
                return total + Math.abs(transaction.amount);
            }

            // Handle split transactions
            if (transaction.isSplit && transaction.splits) {
                const categorySpent = transaction.splits
                    .filter(split => split.categoryId === categoryId && split.amount < 0)
                    .reduce((sum, split) => sum + Math.abs(split.amount), 0);
                return total + categorySpent;
            }

            return total;
        }, 0);
    }, [transactions]);

    // Data model hook for planning items - simplified to prevent infinite loops
    const {
        planningItems,
        addItem,
        updateItem,
        removeItem,
        toggleItemActive
    } = useDataModel({
        initialCategories: [],
        initialAccounts: []
    });

    // Envelope budgeting hook - now using real transactions
    useEnvelopeBudgeting({
        categories,
        planningItems,
        transactions: transactions || [],
        accounts: accounts || []
    });

    // Monthly budgeting hook - use direct import
    const monthlyBudgetingHook = useMonthlyBudgeting(categories, transactions);
    const {
        getMonthData,
        getAvailableMonths: getMonthlyAvailableMonths,
        carryForwardFromPreviousMonth,
        initializeMonth
    } = monthlyBudgetingHook;

    // Initialize current month on component mount
    useEffect(() => {
        initializeMonth(currentBudgetMonth);
    }, [currentBudgetMonth, initializeMonth]);

    // Migrate categories to include type field if needed
    useEffect(() => {
        migrateCategoriesWithTypes(planningItems);
    }, [migrateCategoriesWithTypes, planningItems]);

    // Initialize sortOrder for existing categories that don't have it
    useEffect(() => {
        const needsSortOrderInit = categories.some(cat => typeof cat.sortOrder !== 'number');

        if (needsSortOrderInit) {
            console.log('🔄 Initializing sortOrder for existing categories');
            categories.forEach((category, index) => {
                if (typeof category.sortOrder !== 'number') {
                    console.log(`🔄 Setting sortOrder ${index} for category ${category.name}`);
                    updateCategory(category.id, { sortOrder: index });
                }
            });
        }
    }, [categories, updateCategory]);

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

    // Helper function to calculate paychecks until due date using account-specific paycheck schedule
    const calculatePaychecksUntilDue = useCallback((dueDate, accountId) => {
        if (!dueDate) return null;

        try {
            // Check if paycheck management functions are available
            if (getTodayLocal && getUpcomingPaycheckDatesForAccount && accounts) {
                // If accountId is provided, get paychecks only for that specific account
                if (accountId) {
                    const account = accounts.find(acc => acc.id === accountId);
                    if (account) {
                        // Calculate months ahead needed to cover the due date
                        const today = new Date();
                        const due = new Date(dueDate);
                        const monthsAhead = Math.ceil((due - today) / (1000 * 60 * 60 * 24 * 30)) + 1;

                        // Get paychecks specifically for this account
                        const accountPaychecks = getUpcomingPaycheckDatesForAccount(accountId, monthsAhead);

                        console.log(`🔍 PAYCHECK DEBUG for account ${account.name}:`, {
                            accountId,
                            dueDate,
                            monthsAhead,
                            totalAccountPaychecks: accountPaychecks.length,
                            accountPaycheckDates: accountPaychecks.map(p => p.formattedDate || p.date)
                        });

                        // Filter to only include paychecks before or on the due date
                        const paychecksUntilDue = accountPaychecks.filter(paycheck => {
                            const paycheckDate = new Date(paycheck.date);
                            const isBeforeDue = paycheckDate <= due;
                            console.log(`🔍 Paycheck ${paycheck.formattedDate || paycheck.date}: ${isBeforeDue ? 'INCLUDED' : 'EXCLUDED'} (due: ${dueDate})`);
                            return isBeforeDue;
                        });

                        console.log(`🔍 FINAL RESULT for account ${account.name}: ${paychecksUntilDue.length} paychecks until ${dueDate}`);
                        console.log(`🔍 Included paycheck dates:`, paychecksUntilDue.map(p => p.formattedDate || p.date));

                        return paychecksUntilDue.length;
                    }
                }

                // Fallback to all paychecks if no specific account
                const paychecksInRange = getPaychecksInDateRange(getTodayLocal(), dueDate);
                console.log(`Calculating all paychecks until ${dueDate}:`, paychecksInRange.length);
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
    }, [getTodayLocal, getPaychecksInDateRange, getUpcomingPaycheckDatesForAccount, accounts]);

    // Transform data for the budget table
    const transformDataForBudgetTable = useCallback((categories = [], planningItems = []) => {
        // Sort categories by sortOrder first, then by ID for consistent ordering
        const sortedCategories = [...categories].sort((a, b) => {
            // If both have sortOrder, use that
            if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
                return a.sortOrder - b.sortOrder;
            }
            // If only one has sortOrder, prioritize it
            if (typeof a.sortOrder === 'number') return -1;
            if (typeof b.sortOrder === 'number') return 1;
            // If neither has sortOrder, sort by ID
            return a.id - b.id;
        });

        return sortedCategories.map((category, index) => {
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

                // Calculate totals for the category from planning items (only active items)
                monthlyNeed = categoryItems.reduce((sum, item) => {
                    // Only include active items in calculations
                    if (item.isActive === false) return sum;

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

                    // Debug the accountId being passed
                    console.log(`🔍 ITEM ACCOUNT DEBUG for ${item.name}:`, {
                        itemAccountId: item.accountId,
                        itemAccountIdType: typeof item.accountId,
                        itemData: item
                    });

                    const paychecksUntilDue = item.dueDate ? calculatePaychecksUntilDue(item.dueDate, item.accountId) : null;

                    // Calculate per paycheck based on due date if available
                    let perPaycheck;
                    const paycheckInfo = getConservativePaycheckInfo('bi-weekly');

                    if (item.dueDate && paychecksUntilDue > 0) {
                        // For items with due dates, calculate based on total amount needed divided by paychecks remaining
                        const totalAmountNeeded = item.type === 'savings-goal'
                            ? (item.monthlyContribution || 0)
                            : (item.amount || 0);
                        perPaycheck = totalAmountNeeded / paychecksUntilDue;

                        console.log(`💰 Per-paycheck calculation for ${item.name}:`, {
                            totalAmountNeeded,
                            paychecksUntilDue,
                            perPaycheck,
                            itemType: item.type,
                            dueDate: item.dueDate
                        });
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
                        isActive: item.isActive !== false, // Default to true only if undefined, preserve false
                        type: item.type
                    };
                });
            }

            // Calculate per paycheck amount - use real paycheck schedule for single categories with due dates
            let perPaycheck;
            if (category.type === 'single' && categoryDueDate) {
                // Debug the accountId for single categories
                console.log(`🔍 SINGLE CATEGORY ACCOUNT DEBUG for ${category.name}:`, {
                    categoryAccountId: category.accountId,
                    categoryAccountIdType: typeof category.accountId,
                    categoryData: category,
                    dueDate: categoryDueDate
                });

                const paychecksUntilDue = calculatePaychecksUntilDue(categoryDueDate, category.accountId);
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

            // Calculate actual spent amount from transactions
            const actualSpent = calculateCategorySpent(category.id);
            const allocated = category.allocated || 0;
            const available = allocated - actualSpent;

            return {
                id: category.id,
                name: category.name,
                type: category.type || 'multiple',
                planningType: category.planningType, // Pass through planning type for single categories
                accountId: category.accountId, // Pass through account ID for paycheck calculations
                monthlyNeed,
                perPaycheck,
                allocated,
                spent: actualSpent,
                available,
                dueDate: categoryDueDate,
                color: category.color || 'bg-primary-500',
                isActive: category.isActive !== false, // Default to true if not specified
                isParent: true,
                subItems,
                // Goal-specific properties
                targetAmount: category.targetAmount,
                targetDate: category.targetDate,
                perPaycheckContribution: category.monthlyContribution, // Map monthlyContribution to perPaycheckContribution
                alreadySaved: category.alreadySaved,
                // Expense-specific properties
                amount: category.amount,
                frequency: category.frequency,
                isRecurring: category.isRecurring,
                // CRITICAL: Preserve sortOrder field for drag & drop functionality
                // Initialize sortOrder if not present (for existing categories)
                sortOrder: typeof category.sortOrder === 'number' ? category.sortOrder : index
            };
        });
    }, [calculatePaychecksUntilDue, getConservativePaycheckInfo, calculateMonthlyAmount, calculateCategorySpent, categories, planningItems]);

    // Transform the real data for the table
    const tableData = useMemo(() =>
        transformDataForBudgetTable(categories, planningItems),
        [categories, planningItems, transformDataForBudgetTable]
    );


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

    // Use scheduled transactions hook properly for cloud storage compatibility
    const {
        createScheduledTransactionsFromBudgetItem,
        addScheduledTransactions
    } = useScheduledTransactions();

    // Handler functions for the table
    const handleAddCategory = useCallback(() => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    }, []);

    const handleSaveCategory = useCallback((categoryData, addAnother = false) => {
        try {
            console.log('🔥 BUDGET OVERVIEW - handleSaveCategory called');
            console.log('🔥 RECEIVED CATEGORY DATA:', categoryData);
            console.log('🔥 SCHEDULED TRANSACTION FIELDS RECEIVED:');
            console.log('  - createScheduledTransactions:', categoryData.createScheduledTransactions);
            console.log('  - endCondition:', categoryData.endCondition);
            console.log('  - endDate:', categoryData.endDate);
            console.log('  - maxOccurrences:', categoryData.maxOccurrences);
            console.log('  - payee:', categoryData.payee);
            console.log('  - dueDate:', categoryData.dueDate);
            console.log('  - frequency:', categoryData.frequency);
            console.log('  - amount:', categoryData.amount);
            console.log('  - accountId:', categoryData.accountId);

            let categoryId;

            if (editingCategory) {
                // Update existing category
                categoryId = editingCategory.id;
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
                // Add new category - let the category management hook generate the proper ID
                const newCategory = addCategory({
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
                categoryId = newCategory.id; // Use the proper numeric ID generated by the hook
            }

            // Create scheduled transactions if enabled for expense categories
            console.log('🔥 CHECKING SCHEDULED TRANSACTION CONDITIONS:');
            console.log('  - createScheduledTransactions:', categoryData.createScheduledTransactions);
            console.log('  - planningType:', categoryData.planningType);
            console.log('  - type:', categoryData.type);
            console.log('  - dueDate:', categoryData.dueDate);
            console.log('  - frequency:', categoryData.frequency);
            console.log('  - amount:', categoryData.amount);
            console.log('  - accountId:', categoryData.accountId);
            console.log('  - createScheduledTransactionsFromBudgetItem available:', !!createScheduledTransactionsFromBudgetItem);

            if (categoryData.createScheduledTransactions &&
                categoryData.planningType === 'expense' &&
                categoryData.type === 'single' &&
                categoryData.dueDate &&
                categoryData.frequency &&
                categoryData.amount &&
                categoryData.accountId &&
                createScheduledTransactionsFromBudgetItem) {

                console.log('🔥 ALL CONDITIONS MET - Creating scheduled transactions for category:', categoryData.name);

                // Find the actual category to get its real ID
                const actualCategory = categories.find(cat => cat.id === categoryId);

                console.log('🔍 CATEGORY LOOKUP FOR SCHEDULED TRANSACTION:', {
                    categoryId,
                    categoryIdType: typeof categoryId,
                    actualCategory,
                    allCategories: categories.map(cat => ({ id: cat.id, name: cat.name, type: typeof cat.id })),
                    foundMatch: !!actualCategory
                });

                const budgetItem = {
                    id: categoryId,
                    categoryId: actualCategory ? actualCategory.id : categoryId, // Use the actual category ID for lookup
                    name: categoryData.name,
                    displayName: categoryData.name, // For single categories, use category name
                    amount: categoryData.amount,
                    frequency: categoryData.frequency,
                    dueDate: categoryData.dueDate,
                    accountId: categoryData.accountId,
                    payee: categoryData.payee || categoryData.name
                };

                console.log('🔍 FINAL BUDGET ITEM CATEGORY ID:', {
                    originalCategoryId: categoryId,
                    actualCategoryId: actualCategory ? actualCategory.id : categoryId,
                    budgetItemCategoryId: budgetItem.categoryId
                });

                const scheduledTransactionOptions = {
                    createScheduledTransactions: true,
                    endCondition: categoryData.scheduledEndCondition || 'indefinite',
                    endDate: categoryData.scheduledEndDate,
                    maxOccurrences: categoryData.scheduledMaxOccurrences
                };

                console.log('🔥 BUDGET ITEM DATA:', budgetItem);
                console.log('🔥 SCHEDULED TRANSACTION OPTIONS:', scheduledTransactionOptions);

                try {
                    const scheduledTransactions = createScheduledTransactionsFromBudgetItem(budgetItem, scheduledTransactionOptions);
                    console.log('🔥 CREATED SCHEDULED TRANSACTIONS:', scheduledTransactions);

                    if (scheduledTransactions.length > 0) {
                        addScheduledTransactions(scheduledTransactions);
                        console.log('🔥 Scheduled transactions added to store successfully');
                    }
                } catch (error) {
                    console.error('🔥 ERROR CREATING SCHEDULED TRANSACTION:', error);
                }
            } else {
                console.log('🔥 CONDITIONS NOT MET - Scheduled transactions will NOT be created');
                if (!categoryData.createScheduledTransactions) console.log('  ❌ createScheduledTransactions is false');
                if (categoryData.planningType !== 'expense') console.log('  ❌ planningType is not expense');
                if (categoryData.type !== 'single') console.log('  ❌ type is not single');
                if (!categoryData.dueDate) console.log('  ❌ dueDate is missing');
                if (!categoryData.frequency) console.log('  ❌ frequency is missing');
                if (!categoryData.amount) console.log('  ❌ amount is missing');
                if (!categoryData.accountId) console.log('  ❌ accountId is missing');
                if (!createScheduledTransactionsFromBudgetItem) console.log('  ❌ createScheduledTransactionsFromBudgetItem is not available');
            }

            // Close modal if not adding another
            if (!addAnother) {
                handleCloseCategoryModal();
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    }, [editingCategory, addCategory, updateCategory, planningItems, handleCloseCategoryModal, removeItem, createScheduledTransactionsFromBudgetItem, addScheduledTransactions, categories]);

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
            console.log('🔥 BUDGET OVERVIEW - handleSaveItem called');
            console.log('🔥 RECEIVED ITEM DATA:', itemData);
            console.log('🔥 SCHEDULED TRANSACTION FIELDS RECEIVED:');
            console.log('  - createScheduledTransactions:', itemData.createScheduledTransactions);
            console.log('  - scheduledEndCondition:', itemData.scheduledEndCondition);
            console.log('  - scheduledEndDate:', itemData.scheduledEndDate);
            console.log('  - scheduledMaxOccurrences:', itemData.scheduledMaxOccurrences);
            console.log('  - payee:', itemData.payee);
            console.log('  - dueDate:', itemData.dueDate);
            console.log('  - frequency:', itemData.frequency);
            console.log('  - amount:', itemData.amount);
            console.log('  - accountId:', itemData.accountId);

            let itemId;

            if (editingItem) {
                itemId = editingItem.id;
                updateItem(editingItem.id, itemData);
            } else {
                // Generate ID for new item
                itemId = Date.now().toString();
                const itemWithId = { ...itemData, id: itemId };

                console.log('🔥 OVERVIEW - About to call addItem with:', itemWithId);
                const result = addItem(itemWithId);
                console.log('🔥 OVERVIEW - addItem returned:', result);

                // Verify the item was added
                setTimeout(() => {
                    console.log('🔥 OVERVIEW - Verifying item persistence after 500ms');
                    console.log('🔥 OVERVIEW - Current planningItems count:', planningItems.length);
                    console.log('🔥 OVERVIEW - Looking for item with ID:', itemId);
                    const foundItem = planningItems.find(item => item.id === itemId);
                    console.log('🔥 OVERVIEW - Found item:', foundItem);
                }, 500);
            }

            // Create scheduled transactions if enabled for expense items
            console.log('🔥 CHECKING SCHEDULED TRANSACTION CONDITIONS FOR ITEM:');
            console.log('  - createScheduledTransactions:', itemData.createScheduledTransactions);
            console.log('  - type:', itemData.type);
            console.log('  - dueDate:', itemData.dueDate);
            console.log('  - frequency:', itemData.frequency);
            console.log('  - amount:', itemData.amount);
            console.log('  - accountId:', itemData.accountId);
            console.log('  - createScheduledTransactionsFromBudgetItem available:', !!createScheduledTransactionsFromBudgetItem);

            if (itemData.createScheduledTransactions &&
                itemData.type === 'expense' &&
                itemData.dueDate &&
                itemData.frequency &&
                itemData.amount &&
                itemData.accountId &&
                createScheduledTransactionsFromBudgetItem) {

                console.log('🔥 ALL CONDITIONS MET - Creating scheduled transactions for item:', itemData.name);

                // Find the actual category to get its real ID (same as for single categories)
                const actualCategory = categories.find(cat => cat.id === itemData.categoryId);

                console.log('🔍 CATEGORY LOOKUP FOR SCHEDULED TRANSACTION (ITEM):', {
                    itemCategoryId: itemData.categoryId,
                    itemCategoryIdType: typeof itemData.categoryId,
                    actualCategory,
                    allCategories: categories.map(cat => ({ id: cat.id, name: cat.name, type: typeof cat.id })),
                    foundMatch: !!actualCategory
                });

                const budgetItem = {
                    id: itemId,
                    categoryId: actualCategory ? actualCategory.id : itemData.categoryId, // Use the actual category ID for lookup
                    name: itemData.name,
                    displayName: itemData.name, // For multi-item categories, use item name
                    amount: itemData.amount,
                    frequency: itemData.frequency,
                    dueDate: itemData.dueDate,
                    accountId: itemData.accountId,
                    payee: itemData.payee || itemData.name
                };

                console.log('🔍 FINAL BUDGET ITEM CATEGORY ID (ITEM):', {
                    originalCategoryId: itemData.categoryId,
                    actualCategoryId: actualCategory ? actualCategory.id : itemData.categoryId,
                    budgetItemCategoryId: budgetItem.categoryId
                });

                const scheduledTransactionOptions = {
                    createScheduledTransactions: true,
                    endCondition: itemData.scheduledEndCondition || 'indefinite',
                    endDate: itemData.scheduledEndDate,
                    maxOccurrences: itemData.scheduledMaxOccurrences
                };

                console.log('🔥 BUDGET ITEM DATA FOR ITEM:', budgetItem);
                console.log('🔥 SCHEDULED TRANSACTION OPTIONS FOR ITEM:', scheduledTransactionOptions);

                try {
                    const scheduledTransactions = createScheduledTransactionsFromBudgetItem(budgetItem, scheduledTransactionOptions);
                    console.log('🔥 CREATED SCHEDULED TRANSACTIONS FOR ITEM:', scheduledTransactions);

                    if (scheduledTransactions.length > 0) {
                        addScheduledTransactions(scheduledTransactions);
                        console.log('🔥 Scheduled transactions added to store successfully for item');
                    }
                } catch (error) {
                    console.error('🔥 ERROR CREATING SCHEDULED TRANSACTION FOR ITEM:', error);
                }
            } else {
                console.log('🔥 CONDITIONS NOT MET - Scheduled transactions will NOT be created for item');
                if (!itemData.createScheduledTransactions) console.log('  ❌ createScheduledTransactions is false');
                if (itemData.type !== 'expense') console.log('  ❌ type is not expense');
                if (!itemData.dueDate) console.log('  ❌ dueDate is missing');
                if (!itemData.frequency) console.log('  ❌ frequency is missing');
                if (!itemData.amount) console.log('  ❌ amount is missing');
                if (!itemData.accountId) console.log('  ❌ accountId is missing');
                if (!createScheduledTransactionsFromBudgetItem) console.log('  ❌ createScheduledTransactionsFromBudgetItem is not available');
            }

            if (!addAnother) {
                handleCloseItemModal();
            }
        } catch (error) {
            console.error("Error saving item:", error);
        }
    }, [editingItem, addItem, updateItem, handleCloseItemModal, createScheduledTransactionsFromBudgetItem, addScheduledTransactions]);

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

    // Monthly budget navigator functions
    const getMonthDisplayName = useCallback((monthString) => {
        const [year, month] = monthString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }, []);

    const navigateToNextMonth = useCallback(() => {
        const [year, month] = currentBudgetMonth.split('-').map(Number);
        const nextMonth = new Date(year, month, 1); // month is already 0-indexed after parsing
        const nextMonthString = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
        setCurrentBudgetMonth(nextMonthString);
    }, [currentBudgetMonth]);

    const navigateToPrevMonth = useCallback(() => {
        const [year, month] = currentBudgetMonth.split('-').map(Number);
        const prevMonth = new Date(year, month - 2, 1); // month - 2 because month is 1-indexed but Date expects 0-indexed
        const prevMonthString = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        setCurrentBudgetMonth(prevMonthString);
    }, [currentBudgetMonth]);

    const navigateToMonth = useCallback((monthString) => {
        setCurrentBudgetMonth(monthString);
    }, []);

    const getAvailableMonths = useCallback(() => {
        // Use the monthly budgeting hook's available months function
        return getMonthlyAvailableMonths();
    }, [getMonthlyAvailableMonths]);

    const getMonthSummary = useCallback(() => {
        // Get month-specific data from the monthly budgeting hook
        const monthData = getMonthData(currentBudgetMonth);

        return {
            allocated: monthData.summary.allocated,
            spent: monthData.summary.spent,
            remaining: monthData.summary.toBeBudgeted
        };
    }, [getMonthData, currentBudgetMonth]);

    const handleCarryForward = useCallback(() => {
        try {
            console.log('Carrying forward unspent amounts to month:', currentBudgetMonth);
            carryForwardFromPreviousMonth(currentBudgetMonth);

            // Show success message
            alert(`Successfully carried forward unspent amounts from previous month to ${getMonthDisplayName(currentBudgetMonth)}!`);
        } catch (error) {
            console.error('Error carrying forward:', error);
            alert('Failed to carry forward amounts. Please try again.');
        }
    }, [currentBudgetMonth, carryForwardFromPreviousMonth, getMonthDisplayName]);

    return (
        <Page title="Budget Overview">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6 bg-base-100 text-base-content min-h-screen">
                {/* Summary Cards */}
                <div className="mb-6">
                    <SimplifiedSummaryCards
                        accounts={accounts || []}
                        categories={categories}
                        planningItems={planningItems}
                        transactions={transactions || []}
                    />
                </div>

                {/* Monthly Budget Navigator */}
                <div className="mb-6">
                    <MonthlyBudgetNavigator
                        currentBudgetMonth={currentBudgetMonth}
                        getMonthDisplayName={getMonthDisplayName}
                        navigateToNextMonth={navigateToNextMonth}
                        navigateToPrevMonth={navigateToPrevMonth}
                        navigateToMonth={navigateToMonth}
                        getAvailableMonths={getAvailableMonths}
                        getMonthSummary={getMonthSummary}
                        onCarryForward={handleCarryForward}
                    />
                </div>

                {/* Main Budget View - Responsive */}
                {mdAndDown ? (
                    <React.Suspense fallback={<div>Loading mobile view...</div>}>
                        <MobileBudgetView
                            data={tableData}
                            accounts={accounts || []}
                            onAddCategory={handleAddCategory}
                            onEditCategory={handleEditCategory}
                            onDeleteCategory={handleDeleteCategory}
                            onAddItem={handleAddItem}
                            onEditItem={handleEditItem}
                            onDeleteItem={handleDeleteItem}
                            onQuickAllocate={() => setQuickAllocateModal({ isOpen: true })}
                            onDataUpdate={(updatedTableData) => {
                                console.log('🔄 BudgetOverview: Received data update from MobileBudgetView');
                                console.log('📊 Updated table data:', updatedTableData);

                                // Update the categories based on the updated table data
                                updatedTableData.forEach(updatedCategory => {
                                    if (updatedCategory.isParent) {
                                        // Update the category in the categories state
                                        updateCategory(updatedCategory.id, {
                                            allocated: updatedCategory.allocated,
                                            available: updatedCategory.available,
                                            spent: updatedCategory.spent
                                        });
                                        console.log(`✅ Updated category ${updatedCategory.name}: allocated=${updatedCategory.allocated}, available=${updatedCategory.available}`);
                                    }
                                });

                                console.log('🔄 BudgetOverview: Category updates complete');
                            }}
                        />
                    </React.Suspense>
                ) : (
                    <BudgetCategoriesTable
                        data={tableData}
                        accounts={accounts || []} // Pass accounts for "Available to Allocate" calculation
                        getAllUpcomingPaycheckDates={getAllUpcomingPaycheckDates} // Pass paycheck function for account-specific countdown
                        currentBudgetMonth={currentBudgetMonth}
                        monthlyBudgetingHook={monthlyBudgetingHook}
                        onDataUpdate={(updatedTableData, options) => {
                            console.log('🎯 PARENT COMPONENT: onDataUpdate callback triggered!');
                            console.log('🔄 BudgetOverview: Received data update from BudgetCategoriesTable');
                            console.log('📊 Updated table data:', updatedTableData);
                            console.log('🎯 Update options:', options);
                            console.log('🔍 Options type check:', options?.type);
                            console.log('🔍 Options preserveAllFields check:', options?.preserveAllFields);

                            // Check if this is a reorder operation
                            if (options && options.type === 'reorder' && options.preserveAllFields) {
                                console.log('🔄 REORDER OPERATION DETECTED - Preserving all fields including sortOrder');
                                console.log('📋 Categories to update:', updatedTableData.filter(cat => cat.isParent).map(cat => ({ id: cat.id, name: cat.name, sortOrder: cat.sortOrder })));

                                // For reorder operations, do a bulk update that preserves all fields
                                updatedTableData.forEach((updatedCategory, index) => {
                                    if (updatedCategory.isParent) {
                                        console.log(`🔄 [${index}] Updating category ${updatedCategory.name} (ID: ${updatedCategory.id}) with sortOrder ${updatedCategory.sortOrder}`);
                                        console.log(`🔍 [${index}] Full category data:`, updatedCategory);

                                        // Update with ALL fields, including sortOrder
                                        const updateData = {
                                            ...updatedCategory,
                                            // Ensure we preserve the sortOrder field
                                            sortOrder: updatedCategory.sortOrder
                                        };
                                        console.log(`🔍 [${index}] Update data being sent:`, updateData);

                                        updateCategory(updatedCategory.id, updateData);
                                        console.log(`✅ [${index}] updateCategory called for ${updatedCategory.name}`);
                                    }
                                });

                                console.log('✅ REORDER UPDATE COMPLETE - sortOrder fields preserved');
                            } else {
                                console.log('🔄 REGULAR UPDATE - Only updating allocated/available/spent');
                                console.log('🔍 Reason for regular update:');
                                if (!options) console.log('  - No options provided');
                                if (options && options.type !== 'reorder') console.log('  - Type is not reorder:', options.type);
                                if (options && !options.preserveAllFields) console.log('  - preserveAllFields is false');

                                // Regular update - only update financial fields
                                updatedTableData.forEach(updatedCategory => {
                                    if (updatedCategory.isParent) {
                                        // Update the category in the categories state
                                        updateCategory(updatedCategory.id, {
                                            allocated: updatedCategory.allocated,
                                            available: updatedCategory.available,
                                            spent: updatedCategory.spent
                                        });
                                        console.log(`✅ Updated category ${updatedCategory.name}: allocated=${updatedCategory.allocated}, available=${updatedCategory.available}`);
                                    }
                                });
                            }

                            console.log('🔄 BudgetOverview: Category updates complete');
                        }}
                        onAddCategory={handleAddCategory}
                        onEditCategory={handleEditCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onAddItem={handleAddItem}
                        onEditItem={handleEditItem}
                        onDeleteItem={handleDeleteItem}
                        onToggleItemActive={handleToggleItemActive}
                        onToggleCategoryActive={handleToggleCategoryActive}
                    />
                )}

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

                {/* Quick Allocate Modal - Responsive */}
                {quickAllocateModal.isOpen && (
                    <React.Suspense fallback={<div>Loading...</div>}>
                        {React.createElement(
                            React.lazy(() => mdAndDown
                                ? import("../../../../components/budget/MobileQuickAllocateModal")
                                : import("../../../../components/budget/QuickAllocateModal")
                            ),
                            {
                                isOpen: quickAllocateModal.isOpen,
                                onClose: () => setQuickAllocateModal({ isOpen: false }),
                                availableToAllocate: (() => {
                                    const totalWorkingBalance = (accounts || []).reduce((sum, account) => {
                                        const startingBalance = account.startingBalance || account.balance || 0;
                                        return sum + startingBalance;
                                    }, 0);
                                    const totalAllocated = tableData.reduce((sum, category) => sum + (category.allocated || 0), 0);
                                    return totalWorkingBalance - totalAllocated;
                                })(),
                                categories: tableData,
                                accounts: accounts || [],
                                onBulkAllocate: (allocations) => {
                                    console.log('🔄 BudgetOverview: Bulk allocate requested:', allocations);

                                    // Apply allocations to categories
                                    allocations.forEach(allocation => {
                                        updateCategory(allocation.categoryId, {
                                            allocated: (tableData.find(cat => cat.id === allocation.categoryId)?.allocated || 0) + allocation.amount
                                        });
                                    });

                                    setQuickAllocateModal({ isOpen: false });
                                }
                            }
                        )}
                    </React.Suspense>
                )}
            </div>
        </Page>
    );
}
