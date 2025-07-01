// src/App.js - COMPLETE IMPLEMENTATION
import { AlertTriangle, Calculator, Calendar, DollarSign, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import NEW streamlined components
import ModalSystem from './components/ModalSystem';
import PaydayWorkflow from './components/PaydayWorkflow';
import SimplifiedSummaryCards from './components/SimplifiedSummaryCards';
import UnifiedEnvelopeBudgetView from './components/UnifiedEnvelopeBudgetView';
import UnifiedItemForm from './components/UnifiedItemForm';


// Import existing components we're keeping
import AccountsSection from './components/AccountsSection';
import AddAccountForm from './components/AddAccountForm';
import AddTransactionForm from './components/AddTransactionForm';
import CalendarView from './components/CalendarView';
import ConfigurationPanel from './components/ConfigurationPanel';
import ConfirmDialog from './components/ConfirmDialog';
import { CategoryForm } from './components/form';
import ThemeSelector from './components/ThemeSelector';
import TransactionsTab from './components/TransactionsTab';

// Import hooks
import { useAccountManagement } from './hooks/useAccountManagement';
import { useBudgetCalculations } from './hooks/useBudgetCalculations';
import { useCategoryManagement } from './hooks/useCategoryManagement'; // Enhanced version
import { useConfigSettings } from './hooks/useConfigSettings';
import { useDataModel } from './hooks/useDataModel';
import { useEnvelopeBudgeting } from './hooks/useEnvelopeBudgeting';
import { usePaycheckManagement } from './hooks/usePaycheckManagement';
import { usePaycheckTimeline } from './hooks/usePaycheckTimeline';
import { useTransactionManagement } from './hooks/useTransactionManagement';
import { useUIState } from './hooks/useUIState';

// Import utilities
import { getExpensesFromPlanningItems, getSavingsGoalsFromPlanningItems } from './utils/dataModelUtils';
import { exportToYNAB } from './utils/exportUtils';


// Import migration utilities

const App = () => {
    // Use custom hooks for state management
    const {
        planningItems,
        setPlanningItems,
        activeBudgetAllocations,
        expenses,
        savingsGoals,
        setExpenses,
        setSavingsGoals,
        addItem,
        updateItem,
        removeItem,
        toggleItemActive,
        moveItem,
        cleanupInvalidItems
    } = useDataModel();

    // Creates a HIDDEN income category:
    const ensureIncomeCategory = () => {
        let incomeCategory = categories.find(cat =>
            (cat.name === 'Income' || cat.name === 'Paycheck') &&
            cat.type === 'income'
        );

        if (!incomeCategory) {
            // Create Income category that's HIDDEN from budget views
            const newCategory = {
                id: generateNextCategoryId(),
                name: 'Income',
                color: 'bg-gradient-to-r from-green-500 to-blue-500',
                description: 'Income and paycheck deposits',
                allocated: 0,
                available: 0,
                type: 'income',        // ← Special type
                hiddenFromBudget: true, // ← Hide from budget views
                isSystem: true         // ← Mark as system category
            };

            setCategories(prev => [...prev, newCategory]);
            return newCategory.id;
        }

        return incomeCategory.id;
    };
    // Enhanced category management with types
    const {
        categories,
        setCategories,
        generateNextCategoryId,
        addCategory, // Your existing function
        updateCategory,
        deleteCategory,
        fundCategory,
        toggleCategoryCollapse,
        calculateToBeAllocated: calculateCategoryAllocation,
        calculateCorrectCategoryAllocations, // Your existing function
        // These enhanced functions will be added when you update the hook:
        // convertCategoryType,
        // getCategoryTypeInfo,
        // suggestCategoryType,
        // migrateCategoriesWithTypes: migrateCategoriesHook
    } = useCategoryManagement();

    const {
        accounts,
        setAccounts,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        getDefaultAccount,
        getTotalBalance
    } = useAccountManagement();

    const {
        transactions,
        setTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        filterTransactions
    } = useTransactionManagement(accounts, setAccounts, categories, setCategories);

    const envelopeBudgeting = useEnvelopeBudgeting({
        categories,
        setCategories,
        planningItems,
        transactions,
        accounts
    });

    const {
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        switchToTab,
        toggleViewMode,
        showAddItem,
        setShowAddItem,
        showAddCategory,
        setShowAddCategory,
        showAddAccount,
        setShowAddAccount,
        showAddTransaction,
        setShowAddTransaction,
        editingItem,
        setEditingItem,
        editingCategory,
        setEditingCategory,
        editingAccount,
        setEditingAccount,
        editingTransaction,
        setEditingTransaction,
        preselectedCategory,
        setPreselectedCategory,
        confirmDelete,
        setConfirmDelete,
        openAddItemModal,
        openEditItemModal,
        openAddCategoryModal,
        openEditCategoryModal,
        openAddAccountModal,
        openEditAccountModal,
        openAddTransactionModal,
        openEditTransactionModal,
        openConfirmDeleteDialog,
        closeAllModals,
        collapsedCategories,
        toggleCategoryCollapse: toggleCategoryCollapseUI,
        isCategoryCollapsed
    } = useUIState();

    const {
        currentPay,
        setCurrentPay,
        payFrequency,
        setPayFrequency,
        paySchedule,
        setPaySchedule,
        roundingOption,
        setRoundingOption,
        bufferPercentage,
        setBufferPercentage,
        theme,
        setTheme,
        payFrequencyOptions,
        frequencyOptions,
        categoryColors,
        updatePaySettings,
        updateBudgetSettings,
        updateTheme,
        getPaycheckFrequencyDays,
        getPaychecksPerYear,
        calculateMonthlyIncome
    } = useConfigSettings();

    // Initialize the multi-paycheck management system
    const {
        paychecks,
        addPaycheck,
        updatePaycheck,
        deletePaycheck,
        togglePaycheckActive,
        recordPaycheckReceived,
        paycheckHistory,
        getAllUpcomingPaycheckDates, // This is the actual function name
        getTotalMonthlyIncome
    } = usePaycheckManagement(accounts);

    // Migration state
    const [migrationStatus, setMigrationStatus] = useState({
        needed: false,
        completed: false,
        report: null
    });

    //Active account in Transactions
    const [currentAccountView, setCurrentAccountView] = useState('all');

    // State for budget mode (enhanced: item-based, envelope, or unified)
    // SIMPLIFIED: Fixed to unified mode only
    const budgetMode = 'unified'; // Fixed to unified mode only
    // COMMENTED OUT: Budget mode switching functionality
    // const [budgetMode, setBudgetMode] = useState('unified'); // 'item-based', 'envelope', or 'unified'

    // Keep payday workflow state for unified view
    const [showPaydayWorkflow, setShowPaydayWorkflow] = useState(false);
    const [activePaycheckForWorkflow, setActivePaycheckForWorkflow] = useState(null);

    // // State for what-if mode (keeping this in App.js for now)
    const [whatIfMode, setWhatIfMode] = useState(false);
    const [whatIfPay, setWhatIfPay] = useState(currentPay);

    // Derived value for current pay (with what-if mode)
    const effectivePay = whatIfMode ? whatIfPay : currentPay;

    // Use calculation hooks with unified data model
    const budgetCalculations = useBudgetCalculations({
        planningItems,
        activeBudgetAllocations,
        expenses,
        savingsGoals,
        currentPay: effectivePay,
        roundingOption,
        bufferPercentage,
        frequencyOptions,
    });

    const timelineData = usePaycheckTimeline({
        planningItems,
        activeBudgetAllocations,
        expenses,
        savingsGoals,
        paySchedule,
        accounts,
        expenseAllocations: budgetCalculations.expenseAllocations,
        goalAllocations: budgetCalculations.goalAllocations,
    });

    const calculations = {
        ...budgetCalculations,
        timeline: timelineData,
    };

    // Migration check on app startup
    useEffect(() => {
        // TODO: Add migration check when enhanced hook is implemented
        console.log('Migration check would happen here when enhanced categories are implemented');
        /*
        const checkMigrationStatus = () => {
            const report = generateMigrationReport(categories, planningItems);
            // ... migration logic
        };
        
        if (categories.length > 0) {
            checkMigrationStatus();
        }
        */
    }, [categories.length, planningItems.length]);

    // Set Theme
    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content',
                theme.includes('dark') ? '#1f2937' : '#ffffff');
        }
    }, [theme]);

    // Sync category allocations on app load
    useEffect(() => {
        console.log('Syncing category allocations with active items...');
        setTimeout(() => safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations), 1000);
    }, []); // Run once on app load

    // Enhanced category handlers
    const handleAddCategory = (categoryData) => {
        try {
            // For now, use your existing addCategory function
            // TODO: Update to enhanced version later
            const newCategory = addCategory(categoryData);
            console.log('✅ Category created:', newCategory);

            // Close any open modals
            closeAllModals();

            return newCategory;
        } catch (error) {
            console.error('❌ Error creating category:', error);
            // Handle error (show toast, etc.)
            alert(`Error creating category: ${error.message}`);
        }
    };

    const handleEditCategory = (categoryIdOrObject, categoryData) => {
        try {
            // Handle both formats: (categoryId, data) and (categoryObject)
            if (typeof categoryIdOrObject === 'object') {
                // We received a category object - open the edit modal
                setEditingCategory(categoryIdOrObject);
            } else {
                // We received id and data - perform the update
                updateCategory(categoryIdOrObject, categoryData);
                console.log('✅ Category updated:', categoryIdOrObject);
                closeAllModals();
            }
        } catch (error) {
            console.error('❌ Error updating category:', error);
            alert(`Error updating category: ${error.message}`);
        }
    };

    const handleConvertCategoryType = (categoryId, newType) => {
        // TODO: Implement when enhanced hook is added
        console.log(`Category type conversion requested: ${categoryId} -> ${newType}`);
        alert('Category type conversion not yet implemented');
        return { success: false, error: 'Not implemented yet' };
    };

    const handleDeleteCategory = (categoryId) => {
        // For now, use your existing deleteCategory function
        // TODO: Add enhanced validation later
        try {
            deleteCategory(categoryId);
            console.log(`✅ Category ${categoryId} deleted`);
            closeAllModals();
            return { success: true };
        } catch (error) {
            console.error('❌ Category deletion failed:', error);
            alert(`Error deleting category: ${error.message}`);
            return { success: false, error: error.message };
        }
    };

    // Wrapper functions to handle sync manually since useDataModel doesn't have access to category sync
    const safeCalculateCorrectCategoryAllocations = (items, allocations) => {
        try {
            if (typeof calculateCorrectCategoryAllocations === 'function') {
                return calculateCorrectCategoryAllocations(items, allocations);
            } else {
                console.warn('calculateCorrectCategoryAllocations is not available');
                return 0;
            }
        } catch (error) {
            console.error('Error in safeCalculateCorrectCategoryAllocations:', error);
            return 0;
        }
    };

    const handleAddItemWithSync = (itemData) => {
        console.log('Adding item with manual sync:', itemData);
        addItem(itemData);

        // Manually trigger sync after state update
        setTimeout(() => {
            safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
            console.log('Category allocations synced after item add');
        }, 200);
    };

    const handleUpdateItemWithSync = (itemId, itemData) => {
        console.log('Updating item with manual sync:', itemId, itemData);
        updateItem(itemId, itemData);

        // Manually trigger sync after state update
        setTimeout(() => {
            safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
            console.log('Category allocations synced after item update');
        }, 200);
    };

    const handleRemoveItemWithSync = (itemId) => {
        console.log('Removing item with manual sync:', itemId);
        removeItem(itemId);

        // Manually trigger sync after state update
        setTimeout(() => {
            safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
            console.log('Category allocations synced after item removal');
        }, 200);
    };
    const handleTransferFunds = (fromCategoryId, toCategoryId, amount) => {
        console.log('handleTransferFunds called:', { fromCategoryId, toCategoryId, amount });

        try {
            // Case 1: Moving from a category to "Ready to Assign" (toBeAllocated)
            if (toCategoryId === 'toBeAllocated') {
                // Remove money from the source category (negative amount)
                const success = fundCategory(fromCategoryId, -amount);
                if (success) {
                    console.log(`Successfully moved $${amount} from category ${fromCategoryId} to Ready to Assign`);
                    return true;
                } else {
                    console.error('Failed to move money to Ready to Assign');
                    return false;
                }
            }

            // Case 2: Moving from "Ready to Assign" to a category
            else if (fromCategoryId === 'toBeAllocated') {
                // Add money to the destination category
                const success = fundCategory(toCategoryId, amount);
                if (success) {
                    console.log(`Successfully moved $${amount} from Ready to Assign to category ${toCategoryId}`);
                    return true;
                } else {
                    console.error('Failed to move money from Ready to Assign');
                    return false;
                }
            }

            // Case 3: Moving between two categories
            else {
                // First remove from source category
                const removeSuccess = fundCategory(fromCategoryId, -amount);
                if (removeSuccess) {
                    // Then add to destination category
                    const addSuccess = fundCategory(toCategoryId, amount);
                    if (addSuccess) {
                        console.log(`Successfully moved $${amount} from category ${fromCategoryId} to category ${toCategoryId}`);
                        return true;
                    } else {
                        // If adding failed, revert the removal
                        fundCategory(fromCategoryId, amount);
                        console.error('Failed to add money to destination category, reverted transaction');
                        return false;
                    }
                } else {
                    console.error('Failed to remove money from source category');
                    return false;
                }
            }
        } catch (error) {
            console.error('Error in handleTransferFunds:', error);
            return false;
        }
    };
    const handleReorderCategories = (fromIndex, toIndex) => {
        console.log('=== CATEGORY REORDER DEBUG ===');
        console.log('From index:', fromIndex);
        console.log('To index:', toIndex);
        console.log('Current categories:', categories.map((c, i) => `${i}: ${c.name}`));

        // Early return if indices are the same
        if (fromIndex === toIndex) {
            console.log('Same index, no reorder needed');
            return;
        }

        setCategories(prev => {
            console.log('Previous categories:', prev.map((c, i) => `${i}: ${c.name}`));

            const newCategories = [...prev];
            const [movedCategory] = newCategories.splice(fromIndex, 1);
            console.log('Moved category:', movedCategory.name);

            newCategories.splice(toIndex, 0, movedCategory);
            console.log('New categories order:', newCategories.map((c, i) => `${i}: ${c.name}`));

            return newCategories;
        });
    };
    const handleToggleItemActiveWithSync = (itemId, isActive) => {
        console.log('Toggling item active with manual sync:', itemId, isActive);
        toggleItemActive(itemId, isActive);

        // Force immediate sync for derived states
        const updatedItems = planningItems.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    isActive,
                    needsAllocation: isActive
                };
            }
            return item;
        });

        // Update derived states
        const derivedExpenses = getExpensesFromPlanningItems(updatedItems);
        const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(updatedItems);
        setExpenses(derivedExpenses);
        setSavingsGoals(derivedSavingsGoals);

        // Manually trigger sync after state update
        setTimeout(() => {
            safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
            console.log('Category allocations synced after toggle active');
        }, 200);
    };

    const handleToggleCategoryActiveWithSync = (categoryId, isActive) => {
        console.log('Toggling category active with manual sync:', categoryId, isActive);

        try {
            // Find the existing category
            const existingCategory = categories.find(cat => cat.id === categoryId);

            if (!existingCategory) {
                throw new Error(`Category with id ${categoryId} not found`);
            }

            // Update the category with new isActive status
            updateCategory(categoryId, {
                ...existingCategory,
                isActive
            });

            console.log(`✅ Category ${categoryId} active status set to: ${isActive}`);

            // Manually trigger sync after state update (same pattern as items)
            setTimeout(() => {
                safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
                console.log('Category allocations synced after category toggle active');
            }, 200);

        } catch (error) {
            console.error('❌ Error toggling category active status:', error);
            alert(`Error toggling category: ${error.message}`);
        }
    };
    // Enhanced item handlers with proper sync
    const handleSaveItem = (itemData, addAnother = false) => {
        console.log('DEBUG - App.js handleSaveItem called with data:', itemData);
        console.log('DEBUG - editingItem:', editingItem);
        console.log('DEBUG - addAnother:', addAnother);

        try {
            if (editingItem) {
                // Update existing item using wrapper
                console.log('DEBUG - Updating existing item with ID:', editingItem.id);
                handleUpdateItemWithSync(editingItem.id, itemData);
                setEditingItem(null);
            } else {
                // Add new item using wrapper
                console.log('DEBUG - Adding new item');
                handleAddItemWithSync(itemData);
                console.log('DEBUG - After addItem call');

                if (!addAnother) {
                    setShowAddItem(false);
                    setPreselectedCategory(null);
                }
            }

            console.log('DEBUG - handleSaveItem completed successfully');
        } catch (error) {
            console.error('DEBUG - Error in handleSaveItem:', error);
        }
    };

    const handleDeleteExpense = (expenseId) => {
        handleRemoveItemWithSync(expenseId);
        setConfirmDelete(null);
    };

    const handleDeleteGoal = (goalId) => {
        handleRemoveItemWithSync(goalId);
        setConfirmDelete(null);
    };

    const handleDeleteAccount = (accountId) => {
        deleteAccount(accountId);
        setTransactions(transactions.filter(txn =>
            txn.accountId !== accountId && txn.transferAccountId !== accountId
        ));
        setConfirmDelete(null);
    };

    const handleDeleteTransaction = (transactionId) => {
        deleteTransaction(transactionId);
        setConfirmDelete(null);
    };

    const handleExportToYNAB = () => {
        exportToYNAB({
            calculations,
            categorizedExpenses: calculations.categorizedExpenses,
            currentPay: effectivePay,
            bufferPercentage,
            viewMode: 'amount',
            frequencyOptions,
            planningItems
        });
    };

    const handleToggleItemActive = (itemId, isActive) => {
        // Use wrapper function for proper sync
        handleToggleItemActiveWithSync(itemId, isActive);
    };

    const handleToggleCategoryActive = (categoryId, isActive) => {
        // Use wrapper function for proper sync (same pattern as items)
        handleToggleCategoryActiveWithSync(categoryId, isActive);
    };

    const handleMoveItem = (itemId, newCategoryId) => {
        moveItem(itemId, newCategoryId);

        // Manually trigger sync after move
        setTimeout(() => {
            safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
            console.log('Category allocations synced after item move');
        }, 200);
    };

    // Handle showing the payday workflow
    const handleShowPaydayWorkflow = (paycheck = null) => {
        console.log('Opening payday workflow...');

        // Use provided paycheck or get recent one or create mock one
        const workflowPaycheck = paycheck ||
            getAllUpcomingPaycheckDates(1)[0] || {
            id: 'current-paycheck',
            amount: currentPay,
            date: new Date().toISOString(),
            description: 'Current Paycheck',
            fullyAllocated: false
        };

        console.log('Payday workflow paycheck:', workflowPaycheck);
        setActivePaycheckForWorkflow(workflowPaycheck);
        setShowPaydayWorkflow(true);
    };

    // Handle completing the payday workflow
    const handlePaydayWorkflowComplete = (result) => {
        console.log('Payday workflow completed:', result);

        // Mark the paycheck as allocated if needed
        if (result.completed && result.paycheck) {
            recordPaycheckReceived(result.paycheck.id, {
                ...result.paycheck,
                fullyAllocated: true,
                dateAllocated: new Date().toISOString(),
                allocations: result.allocations
            });
        }

        // Close the workflow
        setShowPaydayWorkflow(false);
        setActivePaycheckForWorkflow(null);
    };

    // Add helper functions for PaydayWorkflow
    const handleAutoFundCategories = () => {
        console.log('Auto-fund categories requested');
        return true;
    };

    const handleGetFundingSuggestions = () => {
        console.log('Funding suggestions requested');
        return [];
    };

    // COMMENTED OUT: Budget mode cycling functionality
    /*
    // Budget mode cycle: item-based → envelope → unified → item-based
    const cycleBudgetMode = () => {
        const modes = ['item-based', 'envelope', 'unified'];
        const currentIndex = modes.indexOf(budgetMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setBudgetMode(modes[nextIndex]);
    };

    const getBudgetModeInfo = () => {
        switch (budgetMode) {
            case 'unified':
                return {
                    icon: Target,
                    label: 'Unified',
                    description: 'Enhanced categories with both single and multiple expense types'
                };
            case 'envelope':
                return {
                    icon: DollarSign,
                    label: 'Envelope',
                    description: 'YNAB-style envelope budgeting'
                };
            case 'item-based':
                return {
                    icon: PackageOpen,
                    label: 'Item-Based',
                    description: 'Flexible item planning with active/planning states'
                };
            default:
                return {
                    icon: Calculator,
                    label: 'Budget',
                    description: 'Budget management'
                };
        }
    };
    */

    // Streamlined tabs
    const tabs = [
        { id: 'budget', label: 'Budget', icon: Calculator },
        { id: 'transactions', label: 'Transactions', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'config', label: 'Config', icon: Settings }
    ];

    // Get allocation data
    const allocationData = calculateCategoryAllocation(accounts);

    // COMMENTED OUT: Budget mode info (not needed for unified only)
    // const budgetModeInfo = getBudgetModeInfo();

    // Render migration status notification
    const renderMigrationStatus = () => {
        if (!migrationStatus.completed || !migrationStatus.report?.migrated) return null;

        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <h3 className="font-medium text-green-800">
                        Enhanced Categories Activated!
                    </h3>
                </div>
                <p className="text-sm text-green-700 mt-1">
                    {migrationStatus.report.migrated} categories upgraded to support single and multiple expense types.
                    Try the new "Unified" budget mode to see the enhanced interface!
                </p>
            </div>
        );
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen transition-colors duration-200 bg-page text-page">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* Migration Status */}
                    {renderMigrationStatus()}

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-theme-primary">Budgie 🦜</h1>
                            <p className="text-theme-secondary">
                                Cheap, cheap!
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            {/* Debug Sync Button
                            <button
                                onClick={() => {
                                    safeCalculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
                                    alert('Category money synced with active items!');
                                }}
                                className="btn-warning px-3 py-2 rounded-lg text-sm"
                                title="Manually sync category money"
                            >
                                🔄 Sync Money
                            </button> */}

                            <ThemeSelector
                                currentTheme={theme}
                                setCurrentTheme={updateTheme}
                            />

                            <div className="bg-theme-secondary px-4 py-2 rounded-lg">
                                <div className="text-xs text-theme-tertiary">To Be Allocated</div>
                                <div className="flex items-center justify-end space-x-2">
                                    {allocationData.toBeAllocated < 0 && <AlertTriangle className="w-4 h-4 text-red-600" />}
                                    <div className={`font-bold ${allocationData.toBeAllocated >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {allocationData.toBeAllocated >= 0 ? '$' : '-$'}{Math.abs(allocationData.toBeAllocated).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* COMMENTED OUT: Enhanced Budget Mode Toggle */}
                            {/*
                            {activeTab === 'budget' && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cycleBudgetMode}
                                        className={`btn-secondary p-2 rounded-lg flex items-center space-x-2 transition-all ${budgetMode === 'unified' ? 'btn-info ring-2 ring-blue-300' : ''
                                            }`}
                                        title={`Current: ${budgetModeInfo.description}. Click to cycle modes.`}
                                    >
                                        <budgetModeInfo.icon className="w-4 h-4" />
                                        <span className="text-sm hidden sm:inline">
                                            {budgetModeInfo.label}
                                        </span>
                                        {budgetMode === 'unified' && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">NEW</span>
                                        )}
                                    </button>
                                </div>
                            )}
                            */}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <SimplifiedSummaryCards
                        calculations={calculations}
                        accounts={accounts}
                        categories={categories}
                        currentPay={allocationData.toBeAllocated}
                        expenses={expenses}
                        savingsGoals={savingsGoals}
                        timeline={timelineData}
                        planningItems={planningItems}
                        activeBudgetAllocations={activeBudgetAllocations}
                    />
                    {/* Payday Workflow */}
                    {/* {showPaydayWorkflow && activePaycheckForWorkflow && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4 border border-theme-secondary">
                                <div className="p-4 border-b border-theme-secondary">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-theme-primary">Payday Workflow</h2>
                                        <button
                                            onClick={() => {
                                                setShowPaydayWorkflow(false);
                                                setActivePaycheckForWorkflow(null);
                                            }}
                                            className="text-theme-secondary hover:text-theme-primary transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div> */}
                    {showPaydayWorkflow && (
                        <ModalSystem
                            isOpen={showPaydayWorkflow}
                            title="Record Paycheck & Allocate Funds"
                            onClose={() => setShowPaydayWorkflow(false)}
                            size="lg"
                        >
                            <PaydayWorkflow
                                paycheck={activePaycheckForWorkflow}
                                accounts={accounts}
                                categories={categories}
                                planningItems={planningItems}         // ← ADD THIS LINE
                                addTransaction={addTransaction}       // ← ADD THIS LINE
                                fundCategory={fundCategory}
                                frequencyOptions={frequencyOptions}  // ← ADD THIS LINE (import from constants if needed)
                                darkMode={theme === 'dark'}          // ← ADD THIS LINE
                                onComplete={handlePaydayWorkflowComplete}
                            />
                        </ModalSystem>
                    )}
                    {/* Accounts Section */}
                    <AccountsSection
                        accounts={accounts}
                        onAddAccount={openAddAccountModal}
                        onEditAccount={openEditAccountModal}
                        onDeleteAccount={(account) => openConfirmDeleteDialog(
                            'account',
                            account.id,
                            account.name,
                            `Delete "${account.name}"? All associated transactions will also be deleted.`
                        )}
                    />

                    {/* Tab Navigation */}
                    <div className="border-b border-theme-secondary mb-8">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => switchToTab(tab.id)}
                                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'budget' && (
                        <div>
                            {/* Mode Header - SIMPLIFIED for unified only */}
                            <div className="flex justify-between items-center mb-3">

                            </div>

                            {/* SIMPLIFIED: Always show Unified View only */}
                            <UnifiedEnvelopeBudgetView
                                categories={categories}
                                planningItems={planningItems}
                                toBeAllocated={allocationData.toBeAllocated}

                                // Functions from enhanced category management
                                fundCategory={fundCategory}
                                transferFunds={handleTransferFunds}
                                moveMoney={() => { }}

                                // Actions
                                onAddCategory={openAddCategoryModal}
                                onEditCategory={handleEditCategory}
                                onDeleteCategory={handleDeleteCategory}
                                onAddItem={openAddItemModal}
                                onEditItem={openEditItemModal}
                                onDeleteItem={(item) => openConfirmDeleteDialog(
                                    item.type === 'savings-goal' ? 'goal' : 'expense',
                                    item.id,
                                    item.name,
                                    `Delete "${item.name}"?`
                                )}
                                onToggleItemActive={handleToggleItemActive}
                                onToggleCategoryActive={handleToggleCategoryActive}
                                onMoveItem={handleMoveItem}
                                onReorderCategories={handleReorderCategories}
                                onReorderItems={(categoryId, fromIndex, toIndex) => {
                                    console.log(`App: Reordering items in category ${categoryId}: ${fromIndex} -> ${toIndex}`);

                                    // Get items for this category
                                    const categoryItems = planningItems.filter(item => item.categoryId === categoryId);
                                    const otherItems = planningItems.filter(item => item.categoryId !== categoryId);

                                    console.log('Category items before reorder:', categoryItems.map(i => i.name));

                                    // Reorder the category items
                                    const reorderedItems = [...categoryItems];
                                    const [movedItem] = reorderedItems.splice(fromIndex, 1);
                                    reorderedItems.splice(toIndex, 0, movedItem);

                                    console.log('Category items after reorder:', reorderedItems.map(i => i.name));

                                    // Update planning items using the setPlanningItems function from useDataModel
                                    const newPlanningItems = [...otherItems, ...reorderedItems];
                                    setPlanningItems(newPlanningItems);

                                    console.log('Successfully reordered items!');
                                }}
                                // Configuration - your existing settings preserved
                                payFrequency={payFrequency}
                                payFrequencyOptions={payFrequencyOptions}

                                // Optional
                                getAllUpcomingPaycheckDates={getAllUpcomingPaycheckDates}
                                recentPaycheck={getAllUpcomingPaycheckDates(1)[0] || null}
                                onShowPaydayWorkflow={handleShowPaydayWorkflow}
                            />

                        </div>
                    )}

                    {/* Other tabs remain the same */}
                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            transactions={transactions}
                            onAccountViewChange={setCurrentAccountView}
                            viewAccount={currentAccountView}
                            accounts={accounts}
                            categories={categories}
                            onAddTransaction={addTransaction}  // ← Change this
                            onEditTransaction={updateTransaction}  // ← Change this  
                            onDeleteTransaction={(transaction) => openConfirmDeleteDialog(
                                'transaction',
                                transaction.id,
                                transaction.payee || 'Unnamed Transaction',
                                `Delete this transaction?`
                            )}
                        />
                    )}

                    {activeTab === 'calendar' && (
                        <div className="min-h-[70vh] h-full bg-theme-primary p-4 rounded-lg">
                            <CalendarView
                                currentPay={effectivePay}
                                paySchedule={paySchedule}
                                savingsGoals={savingsGoals}
                                expenses={expenses}
                                categories={categories}
                                frequencyOptions={frequencyOptions}
                                accounts={accounts}
                            />
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="max-w-4xl">
                            <h2 className="text-2xl font-bold mb-6 text-theme-primary">Configuration</h2>

                            <ConfigurationPanel
                                showConfig={true}
                                setShowConfig={() => { }}
                                takeHomePay={currentPay}
                                setTakeHomePay={setCurrentPay}
                                whatIfMode={whatIfMode}
                                whatIfPay={whatIfPay}
                                setWhatIfPay={setWhatIfPay}
                                roundingOption={roundingOption}
                                setRoundingOption={setRoundingOption}
                                bufferPercentage={bufferPercentage}
                                setBufferPercentage={setBufferPercentage}
                                paySchedule={paySchedule}
                                setPaySchedule={setPaySchedule}
                                accounts={accounts}
                                setShowAddAccount={openAddAccountModal}
                                onExport={handleExportToYNAB}
                                payFrequency={payFrequency}
                                setPayFrequency={setPayFrequency}
                                payFrequencyOptions={payFrequencyOptions}
                                paychecks={paychecks}
                                addPaycheck={addPaycheck}
                                updatePaycheck={updatePaycheck}
                                deletePaycheck={deletePaycheck}
                                togglePaycheckActive={togglePaycheckActive}
                                recordPaycheckReceived={recordPaycheckReceived}
                                onStartPaydayWorkflow={handleShowPaydayWorkflow}
                            />
                        </div>
                    )}

                    {/* Enhanced modals */}

                    {/* Item Modal */}
                    <ModalSystem
                        isOpen={showAddItem || editingItem !== null}
                        title={editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
                        onClose={() => {
                            setShowAddItem(false);
                            setEditingItem(null);
                            setPreselectedCategory(null);
                        }}
                        size="md"
                    >
                        <UnifiedItemForm
                            item={editingItem}
                            onSave={handleSaveItem}
                            onCancel={() => {
                                setShowAddItem(false);
                                setEditingItem(null);
                                setPreselectedCategory(null);
                            }}
                            categories={categories}
                            accounts={accounts}
                            currentPay={effectivePay}
                            preselectedCategory={preselectedCategory}
                        />
                    </ModalSystem>

                    {/* Category Modal */}
                    <ModalSystem
                        isOpen={showAddCategory || editingCategory !== null}
                        title={editingCategory ? 'Edit Category' : 'Add New Category'}
                        onClose={() => {
                            setShowAddCategory(false);
                            setEditingCategory(null);
                        }}
                        size="md"
                    >
                        <CategoryForm
                            category={editingCategory}
                            onSave={(categoryData) => {
                                if (editingCategory) {
                                    handleEditCategory(editingCategory.id, categoryData);
                                } else {
                                    handleAddCategory(categoryData);
                                }
                                setShowAddCategory(false);
                                setEditingCategory(null);
                            }}
                            onCancel={() => {
                                setShowAddCategory(false);
                                setEditingCategory(null);
                            }}
                            darkMode={theme.includes('dark')}
                            accounts={accounts}
                            currentPay={currentPay}
                            payFrequency={payFrequency}
                        />
                    </ModalSystem>

                    {/* Account Modal */}
                    <ModalSystem
                        isOpen={showAddAccount || editingAccount !== null}
                        title={editingAccount ? 'Edit Account' : 'Add New Account'}
                        onClose={() => {
                            setShowAddAccount(false);
                            setEditingAccount(null);
                        }}
                        size="md"
                    >
                        <AddAccountForm
                            account={editingAccount}
                            onSave={(accountData) => {
                                if (editingAccount) {
                                    updateAccount(editingAccount.id, accountData);
                                    setEditingAccount(null);
                                } else {
                                    addAccount(accountData);
                                    setShowAddAccount(false);
                                }
                            }}
                            onCancel={() => {
                                setShowAddAccount(false);
                                setEditingAccount(null);
                            }}
                        />
                    </ModalSystem>

                    {/* Transaction Modal */}
                    <ModalSystem
                        isOpen={showAddTransaction || editingTransaction !== null}
                        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                        onClose={() => {
                            setShowAddTransaction(false);
                            setEditingTransaction(null);
                        }}
                        size="md"
                    >
                        <AddTransactionForm
                            transaction={editingTransaction}
                            onSave={(transactionData) => {
                                if (editingTransaction) {
                                    updateTransaction(editingTransaction.id, transactionData);
                                    setEditingTransaction(null);
                                } else {
                                    addTransaction(transactionData);
                                    setShowAddTransaction(false);
                                }
                            }}
                            onCancel={() => {
                                setShowAddTransaction(false);
                                setEditingTransaction(null);
                            }}
                            accounts={accounts}
                            categories={categories}
                        />
                    </ModalSystem>

                    {/* Confirm Delete Dialog */}
                    {confirmDelete && (
                        <ConfirmDialog
                            title="Confirm Delete"
                            message={confirmDelete.message}
                            onConfirm={() => {
                                switch (confirmDelete.type) {
                                    case 'expense':
                                        handleDeleteExpense(confirmDelete.id);
                                        break;
                                    case 'goal':
                                        handleDeleteGoal(confirmDelete.id);
                                        break;
                                    case 'category':
                                        handleDeleteCategory(confirmDelete.id);
                                        break;
                                    case 'account':
                                        handleDeleteAccount(confirmDelete.id);
                                        break;
                                    case 'transaction':
                                        handleDeleteTransaction(confirmDelete.id);
                                        break;
                                    default:
                                        break;
                                }
                            }}
                            onCancel={() => setConfirmDelete(null)}
                        />
                    )}
                </div>
            </div>
        </DndProvider>
    );
};

export default App;