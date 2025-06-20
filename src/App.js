import { AlertTriangle, Calculator, Calendar, DollarSign, Plus, Settings, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import NEW streamlined components
import ConsolidatedCategoryCard from './components/ConsolidatedCategoryCard';
import ModalSystem from './components/ModalSystem';
import SimplifiedSummaryCards from './components/SimplifiedSummaryCards';
import UnifiedItemForm from './components/UnifiedItemForm';
// Import existing components we're keeping
import AccountsSection from './components/AccountsSection';
import AddAccountForm from './components/AddAccountForm';
import AddCategoryForm from './components/AddCategoryForm';
import AddTransactionForm from './components/AddTransactionForm';
import CalendarView from './components/CalendarView';
import ConfigurationPanel from './components/ConfigurationPanel';
import ConfirmDialog from './components/ConfirmDialog';
import ImprovedFundingMode from './components/ImprovedFundingMode';
import PlanningMode from './components/PlanningMode';
import ThemeSelector from './components/ThemeSelector';
import TransactionsTab from './components/TransactionsTab';

// Import hooks
import { useBudgetCalculations } from './hooks/useBudgetCalculations';
import { useDataModel } from './hooks/useDataModel';
import { usePaycheckTimeline } from './hooks/usePaycheckTimeline';
// Import NEW custom hooks
import { useAccountManagement } from './hooks/useAccountManagement';
import { useCategoryManagement } from './hooks/useCategoryManagement';
import { useConfigSettings } from './hooks/useConfigSettings';
import { useTransactionManagement } from './hooks/useTransactionManagement';
import { useUIState } from './hooks/useUIState';

// Import utilities
import { exportToYNAB } from './utils/exportUtils';

const App = () => {
    // Use custom hooks for state management
    const {
        planningItems,
        activeBudgetAllocations,
        expenses,
        savingsGoals,
        addItem,
        updateItem,
        removeItem,
        toggleItemActive,
        moveItem
    } = useDataModel();

    const {
        categories,
        setCategories,
        generateNextCategoryId,
        addCategory,
        updateCategory,
        deleteCategory,
        fundCategory,
        toggleCategoryCollapse,
        calculateToBeAllocated,
        calculateCorrectCategoryAllocations
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

    // State for what-if mode (keeping this in App.js for now)
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

    // Set Theme
    // Set Theme - only apply to DOM, don't update state
    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content',
                theme.includes('dark') ? '#1f2937' : '#ffffff');
        }
    }, [theme]); // Remove updateTheme from dependencies

    // Sync category allocations on app load
    useEffect(() => {
        console.log('Syncing category allocations with active items...');
        setTimeout(() => calculateCorrectCategoryAllocations(), 1000);
    }, []); // Run once on app load

    // Handler functions
    const handleSaveItem = (itemData, addAnother = false) => {
        if (editingItem) {
            // Update existing item
            updateItem(editingItem.id, itemData);
            setEditingItem(null);
        } else {
            // Add new item
            addItem(itemData);

            if (!addAnother) {
                setShowAddItem(false);
                setPreselectedCategory(null);
            }
        }

        // Recalculate category allocations after any item changes
        setTimeout(() => {
            // Pass current state to ensure calculations use the most up-to-date data
            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
        }, 100);
    };

    const handleDeleteExpense = (expenseId) => {
        removeItem(expenseId);
        setConfirmDelete(null);

        // Recalculate category allocations after deletion
        setTimeout(() => {
            // Pass current state to ensure calculations use the most up-to-date data
            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
        }, 100);
    };

    const handleDeleteGoal = (goalId) => {
        removeItem(goalId);
        setConfirmDelete(null);

        // Recalculate category allocations after deletion
        setTimeout(() => {
            // Pass current state to ensure calculations use the most up-to-date data
            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
        }, 100);
    };

    const handleDeleteCategory = (categoryId) => {
        const remainingCategories = categories.filter(cat => cat.id !== categoryId);
        const firstCategoryId = remainingCategories[0]?.id;

        if (firstCategoryId) {
            // Move all items from the deleted category to the first category
            planningItems
                .filter(item => item.categoryId === categoryId)
                .forEach(item => {
                    moveItem(item.id, firstCategoryId);
                });
        }

        deleteCategory(categoryId);
        setConfirmDelete(null);

        // Recalculate category allocations after deletion
        setTimeout(() => calculateCorrectCategoryAllocations(), 100);
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
        toggleItemActive(itemId, isActive);

        // IMMEDIATELY recalculate category allocations after any change
        setTimeout(() => {
            // Pass current state to ensure calculations use the most up-to-date data
            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
        }, 100);
    };

    const handleMoveItem = (itemId, newCategoryId) => {
        moveItem(itemId, newCategoryId);

        // Recalculate category allocations for both old and new categories
        setTimeout(() => {
            // Pass current state to ensure calculations use the most up-to-date data
            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
        }, 100);
    };

    // Streamlined tabs
    const tabs = [
        { id: 'budget', label: 'Budget', icon: Calculator },
        { id: 'transactions', label: 'Transactions', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'config', label: 'Config', icon: Settings }
    ];

    // Get allocation data
    const allocationData = calculateToBeAllocated(accounts);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen transition-colors duration-200 bg-page text-page">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* Header */}

                    <button
                        onClick={() => {
                            calculateCorrectCategoryAllocations(planningItems, activeBudgetAllocations);
                            alert('Category money synced with active items!');
                        }}
                        className="btn-warning px-3 py-2 rounded-lg text-sm"
                        title="Manually sync category money"
                    >
                        🔄 Sync Money
                    </button>

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-theme-primary">Budgie 🦜</h1>
                            <p className="text-theme-secondary">
                                Your unified budget companion
                            </p>
                        </div>

                        <div className="flex space-x-2">
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

                            {/* Planning/Funding Mode Toggle (only show on budget tab) */}
                            {activeTab === 'budget' && (
                                <button
                                    onClick={toggleViewMode}
                                    className={`btn-secondary p-2 rounded-lg flex items-center space-x-2 ${viewMode === 'funding' ? 'btn-success' : ''}`}
                                >
                                    {viewMode === 'planning' ? <Target className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                    <span className="text-sm hidden sm:inline">
                                        {viewMode === 'planning' ? 'Planning' : 'Funding'}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* NEW: Simplified Summary Cards */}
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

                    {/* Streamlined Tab Navigation */}
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
                            {/* Mode Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-theme-primary">
                                        {viewMode === 'planning' ? '📋 Budget Planning' : '💰 Smart Category Funding'}
                                    </h2>
                                    <p className="text-theme-secondary">
                                        {viewMode === 'planning'
                                            ? 'Plan your expenses and goals by category - toggle items between active funding and planning-only'
                                            : 'Get intelligent funding recommendations based on priorities, deadlines, and current balances'
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={openAddCategoryModal}
                                    className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Category</span>
                                </button>
                            </div>

                            {/* Conditional Rendering Based on View Mode */}
                            {viewMode === 'planning' ? (
                                <PlanningMode
                                    categories={categories}
                                    planningItems={planningItems}
                                    expenses={expenses}
                                    savingsGoals={savingsGoals}
                                    payFrequency={payFrequency}
                                    payFrequencyOptions={payFrequencyOptions}
                                    onAddItem={openAddItemModal}
                                    onEditItem={openEditItemModal}
                                    onDeleteItem={(item) => openConfirmDeleteDialog(
                                        item.type === 'savings-goal' ? 'goal' : 'expense',
                                        item.id,
                                        item.name,
                                        `Delete "${item.name}"?`
                                    )}
                                    onToggleItemActive={handleToggleItemActive}
                                    onEditCategory={openEditCategoryModal}
                                    onDeleteCategory={(cat) => openConfirmDeleteDialog(
                                        'category',
                                        cat.id,
                                        cat.name,
                                        `Delete "${cat.name}"? All items will be moved to the first category.`
                                    )}
                                    onAddCategory={openAddCategoryModal}
                                    onMoveItem={handleMoveItem}
                                    onToggleCollapse={toggleCategoryCollapse}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <ImprovedFundingMode
                                        categories={categories}
                                        availableFunds={allocationData.toBeAllocated}
                                        onFundCategory={fundCategory}
                                        paySchedule={paySchedule}
                                        planningItems={planningItems}
                                        activeBudgetAllocations={activeBudgetAllocations}
                                        payFrequency={payFrequency}
                                        payFrequencyOptions={payFrequencyOptions}
                                    />

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-theme-primary">Manual Category Funding</h3>
                                            <div className="text-sm text-theme-secondary">
                                                Or fund categories individually below
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {categories.map(category => (
                                                <ConsolidatedCategoryCard
                                                    key={category.id}
                                                    category={category}
                                                    planningItems={planningItems}
                                                    timeline={timelineData}
                                                    viewMode={viewMode}
                                                    onFund={fundCategory}
                                                    onEditCategory={openEditCategoryModal}
                                                    onDeleteCategory={(cat) => openConfirmDeleteDialog(
                                                        'category',
                                                        cat.id,
                                                        cat.name,
                                                        `Delete "${cat.name}"? All items will be moved to the first category.`
                                                    )}
                                                    onAddItem={openAddItemModal}
                                                    onEditItem={openEditItemModal}
                                                    onDeleteItem={(item) => openConfirmDeleteDialog(
                                                        item.type === 'savings-goal' ? 'goal' : 'expense',
                                                        item.id,
                                                        item.name,
                                                        `Delete "${item.name}"?`
                                                    )}
                                                    onToggleItemActive={handleToggleItemActive}
                                                    onToggleCollapse={toggleCategoryCollapse}
                                                    onMoveItem={handleMoveItem}
                                                    payFrequency={payFrequency}
                                                    payFrequencyOptions={payFrequencyOptions}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            transactions={transactions}
                            accounts={accounts}
                            categories={categories}
                            onAddTransaction={openAddTransactionModal}
                            onEditTransaction={openEditTransactionModal}
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

                            {/* Configuration Panel */}
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
                            />
                        </div>
                    )}

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
                        <AddCategoryForm
                            category={editingCategory}
                            onSave={(categoryData, addAnother) => {
                                if (editingCategory) {
                                    // Update existing category
                                    updateCategory(editingCategory.id, categoryData);
                                    setEditingCategory(null);
                                } else {
                                    // Add new category
                                    addCategory(categoryData);
                                    if (!addAnother) setShowAddCategory(false);
                                }
                            }}
                            onCancel={() => {
                                setShowAddCategory(false);
                                setEditingCategory(null);
                            }}
                            categoryColors={categoryColors}
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
                                    // Update existing account
                                    updateAccount(editingAccount.id, accountData);
                                    setEditingAccount(null);
                                } else {
                                    // Add new account
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
                                    // Update existing transaction
                                    updateTransaction(editingTransaction.id, transactionData);
                                    setEditingTransaction(null);
                                } else {
                                    // Add new transaction
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