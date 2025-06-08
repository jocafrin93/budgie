import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Download, Moon, Sun, Edit2, Trash2, Calculator, Target, DollarSign, ChevronRight, Eye, Percent, Users, Palette } from 'lucide-react';


// Import components
import AddExpenseForm from './components/AddExpenseForm';
import AddCategoryForm from './components/AddCategoryForm';
import AddGoalForm from './components/AddGoalForm';
import AddAccountForm from './components/AddAccountForm';
import AddTransactionForm from './components/AddTransactionForm';
import CalendarView from './components/CalendarView';
import ConfigurationPanel from './components/ConfigurationPanel';
import SummaryCards from './components/SummaryCards';
import AccountsSection from './components/AccountsSection';
import CategoriesSection from './components/CategoriesSection';
import TransactionsSection from './components/TransactionsSection';
import SummaryPanel from './components/SummaryPanel';
import ConfirmDialog from './components/ConfirmDialog';
import CurrencyInput from './components/CurrencyInput';
import TabNavigation from './components/TabNavigation';
import TransactionsTab from './components/TransactionsTab';
import ThemeSelector from './components/ThemeSelector';



// Import hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useBudgetCalculations } from './hooks/useBudgetCalculations';

// Import utilities
import { generateCalendarEvents } from './utils/calendarUtils';
import { exportToYNAB } from './utils/exportUtils';

const App = () => {
    // State management using localStorage hook
    const [darkMode, setDarkMode] = useLocalStorage('budgetCalc_darkMode', true);
    const [takeHomePay, setTakeHomePay] = useLocalStorage('budgetCalc_takeHomePay', 2800);
    const [roundingOption, setRoundingOption] = useLocalStorage('budgetCalc_roundingOption', 5);
    const [bufferPercentage, setBufferPercentage] = useLocalStorage('budgetCalc_bufferPercentage', 7);
    const [viewMode, setViewMode] = useLocalStorage('budgetCalc_viewMode', 'amount');
    const [currentTheme, setCurrentTheme] = useLocalStorage('budgetCalc_theme', 'light');

    // Categories state
    const [categories, setCategories] = useLocalStorage('budgetCalc_categories', [
        {
            id: 1,
            name: 'Personal Care',
            color: 'bg-gradient-to-r from-purple-500 to-pink-500',
            collapsed: false,
        },
        {
            id: 2,
            name: 'Pet Care',
            color: 'bg-gradient-to-r from-green-500 to-blue-500',
            collapsed: false,
        },
        {
            id: 3,
            name: 'Savings Goals',
            color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
            collapsed: false,
        },
    ]);

    // Expenses state
    const [expenses, setExpenses] = useLocalStorage('budgetCalc_expenses', [
        {
            id: 1,
            name: 'Hair coloring',
            amount: 180,
            frequency: 'every-6-weeks',
            categoryId: 1,
            priority: 'important',
            alreadySaved: 0,
            dueDate: '',
            allocationPaused: false,
            collapsed: true,
            isRecurringExpense: false,
            priorityState: 'active',
            accountID: 1
        },
    ]);

    // Goals state
    const [savingsGoals, setSavingsGoals] = useLocalStorage('budgetCalc_savingsGoals', [
        {
            id: 1,
            name: 'Emergency fund',
            targetAmount: 10000,
            monthlyContribution: 500,
            targetDate: '2025-12-31',
            categoryId: 3,
            alreadySaved: 0,
            allocationPaused: false,
            collapsed: true,
            priorityState: 'active',
            accountId: 1
        },
    ]);

    // Accounts state
    const [accounts, setAccounts] = useLocalStorage('budgetCalc_accounts', [
        {
            id: 1,
            name: 'Main Checking',
            type: 'checking',
            balance: 3500,
            bankName: 'Chase',
        },
        {
            id: 2,
            name: 'Savings',
            type: 'savings',
            balance: 8200,
            bankName: 'Chase',
        },
    ]);

    // Transactions state
    const [transactions, setTransactions] = useLocalStorage('budgetCalc_transactions', []);

    // Pay schedule state
    const [paySchedule, setPaySchedule] = useState({
        startDate: '2025-06-13',
        frequency: 'bi-weekly',
        splitPaycheck: false,
        primaryAmount: 2200,
        secondaryAmount: 600,
        secondaryDaysEarly: 2,
        primaryAccountId: 1,
        secondaryAccountId: 2,
    });

    // UI state
    const [whatIfMode, setWhatIfMode] = useState(false);
    const [whatIfPay, setWhatIfPay] = useState(2800);
    const [showConfig, setShowConfig] = useState(false);
    const [activeTab, setActiveTab] = useState('budget');


    // Modal states
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // Editing states
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Other states
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState('all');

    // Constants
    const currentPay = whatIfMode ? whatIfPay : takeHomePay;

    const frequencyOptions = [
        { value: 'weekly', label: 'Weekly', weeksPerYear: 52 },
        { value: 'bi-weekly', label: 'Bi-weekly', weeksPerYear: 26 },
        { value: 'every-3-weeks', label: 'Every 3 weeks', weeksPerYear: 17.33 },
        { value: 'monthly', label: 'Monthly', weeksPerYear: 12 },
        { value: 'every-6-weeks', label: 'Every 6 weeks', weeksPerYear: 8.67 },
        { value: 'every-7-weeks', label: 'Every 7 weeks', weeksPerYear: 7.43 },
        { value: 'every-8-weeks', label: 'Every 8 weeks', weeksPerYear: 6.5 },
        { value: 'quarterly', label: 'Quarterly', weeksPerYear: 4 },
        { value: 'annually', label: 'Annually', weeksPerYear: 1 },
        { value: 'per-paycheck', label: 'Per Paycheck (Direct)', weeksPerYear: 26 },
    ];

    const categoryColors = [
        'bg-gradient-to-r from-purple-500 to-pink-500',
        'bg-gradient-to-r from-pink-500 to-blue-500',
        'bg-gradient-to-r from-orange-500 to-red-600',
        'bg-gradient-to-r from-green-500 to-yellow-400',
        'bg-gradient-to-r from-pink-500 to-red-500',
        'bg-gradient-to-r from-yellow-400 to-orange-500',
        'bg-gradient-to-r from-purple-600 to-teal-500',
        'bg-gradient-to-r from-violet-600 to-purple-800',
    ];

    // Custom hook for calculations
    const calculations = useBudgetCalculations({
        expenses,
        savingsGoals,
        currentPay,
        roundingOption,
        bufferPercentage,
        frequencyOptions,
        paySchedule,
        accounts,
    });
    console.log('Timeline data:', calculations.timelines);

    // Build categorized expenses with proper category info
    const categorizedExpenses = useMemo(() => {
        return categories.map(category => ({
            ...category,
            expenses: calculations.expenseAllocations.filter(exp => exp.categoryId === category.id),
            goals: calculations.goalAllocations.filter(goal => goal.categoryId === category.id),
            total: calculations.expenseAllocations
                .filter(exp => exp.categoryId === category.id)
                .reduce((sum, exp) => sum + exp.biweeklyAmount, 0) +
                calculations.goalAllocations
                    .filter(goal => goal.categoryId === category.id)
                    .reduce((sum, goal) => sum + goal.biweeklyAmount, 0),
            percentage: ((calculations.expenseAllocations
                .filter(exp => exp.categoryId === category.id)
                .reduce((sum, exp) => sum + exp.biweeklyAmount, 0) +
                calculations.goalAllocations
                    .filter(goal => goal.categoryId === category.id)
                    .reduce((sum, goal) => sum + goal.biweeklyAmount, 0)) / currentPay) * 100
        }));
    }, [categories, calculations.expenseAllocations, calculations.goalAllocations, currentPay]);

    // Set Theme
    useEffect(() => {
        console.log('Setting theme:', darkMode ? 'dark' : currentTheme); // Add this debug line
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : currentTheme);
    }, [darkMode, currentTheme]);

    // Handler functions
    const handleDeleteExpense = (expenseId) => {
        setExpenses(expenses.filter(exp => exp.id !== expenseId));
        setConfirmDelete(null);
    };

    const handleDeleteGoal = (goalId) => {
        setSavingsGoals(savingsGoals.filter(goal => goal.id !== goalId));
        setConfirmDelete(null);
    };

    const handleDeleteCategory = (categoryId) => {
        const remainingCategories = categories.filter(cat => cat.id !== categoryId);
        const firstCategoryId = remainingCategories[0]?.id;

        if (firstCategoryId) {
            setExpenses(expenses.map(exp =>
                exp.categoryId === categoryId
                    ? { ...exp, categoryId: firstCategoryId }
                    : exp
            ));
            setSavingsGoals(savingsGoals.map(goal =>
                goal.categoryId === categoryId
                    ? { ...goal, categoryId: firstCategoryId }
                    : goal
            ));
        }

        setCategories(categories.filter(cat => cat.id !== categoryId));
        setConfirmDelete(null);
    };

    const handleDeleteAccount = (accountId) => {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        setTransactions(transactions.filter(txn =>
            txn.accountId !== accountId && txn.transferAccountId !== accountId
        ));
        setConfirmDelete(null);
    };

    const handleDeleteTransaction = (transactionId) => {
        setTransactions(transactions.filter(txn => txn.id !== transactionId));
        setConfirmDelete(null);
    };

    const handleExportToYNAB = () => {
        exportToYNAB({
            calculations,
            categorizedExpenses: calculations.categorizedExpenses,
            currentPay,
            bufferPercentage,
            viewMode,
            frequencyOptions,
        });
    };
    const reorderCategories = (dragIndex, hoverIndex) => {
        const newCategories = [...categories];
        const draggedItem = newCategories[dragIndex];
        newCategories.splice(dragIndex, 1);
        newCategories.splice(hoverIndex, 0, draggedItem);
        setCategories(newCategories);
    };

    const reorderExpenses = (dragIndex, hoverIndex, categoryId) => {
        const categoryExpenses = expenses.filter(exp => exp.categoryId === categoryId);
        const otherExpenses = expenses.filter(exp => exp.categoryId !== categoryId);

        const draggedItem = categoryExpenses[dragIndex];
        categoryExpenses.splice(dragIndex, 1);
        categoryExpenses.splice(hoverIndex, 0, draggedItem);

        setExpenses([...otherExpenses, ...categoryExpenses]);
    };

    const reorderGoals = (dragIndex, hoverIndex, categoryId) => {
        const categoryGoals = savingsGoals.filter(goal => goal.categoryId === categoryId);
        const otherGoals = savingsGoals.filter(goal => goal.categoryId !== categoryId);

        const draggedItem = categoryGoals[dragIndex];
        categoryGoals.splice(dragIndex, 1);
        categoryGoals.splice(hoverIndex, 0, draggedItem);

        setSavingsGoals([...otherGoals, ...categoryGoals]);
    };



    // Arrow button functions for expenses/goals (keep these as they are)
    const moveExpenseUpDown = (expenseId, direction) => {
        const index = expenses.findIndex(exp => exp.id === expenseId);
        if (direction === 'up' && index > 0) {
            const newExpenses = [...expenses];
            [newExpenses[index], newExpenses[index - 1]] = [newExpenses[index - 1], newExpenses[index]];
            setExpenses(newExpenses);
        } else if (direction === 'down' && index < expenses.length - 1) {
            const newExpenses = [...expenses];
            [newExpenses[index], newExpenses[index + 1]] = [newExpenses[index + 1], newExpenses[index]];
            setExpenses(newExpenses);
        }
    };

    const moveGoalUpDown = (goalId, direction) => {
        const index = savingsGoals.findIndex(goal => goal.id === goalId);
        if (direction === 'up' && index > 0) {
            const newGoals = [...savingsGoals];
            [newGoals[index], newGoals[index - 1]] = [newGoals[index - 1], newGoals[index]];
            setSavingsGoals(newGoals);
        } else if (direction === 'down' && index < savingsGoals.length - 1) {
            const newGoals = [...savingsGoals];
            [newGoals[index], newGoals[index + 1]] = [newGoals[index + 1], newGoals[index]];
            setSavingsGoals(newGoals);
        }
    };
    const moveCategoryUp = (categoryId) => {
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index > 0) {
            const newCategories = [...categories];
            [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
            setCategories(newCategories);
        }
    };

    const moveCategoryDown = (categoryId) => {
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index < categories.length - 1) {
            const newCategories = [...categories];
            [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
            setCategories(newCategories);
        }
    };

    const moveExpense = (dragIndex, hoverIndex) => {
        const newExpenses = [...expenses];
        const draggedItem = newExpenses[dragIndex];
        newExpenses.splice(dragIndex, 1);
        newExpenses.splice(hoverIndex, 0, draggedItem);
        setExpenses(newExpenses);
    };

    const moveGoal = (dragIndex, hoverIndex) => {
        const newGoals = [...savingsGoals];
        const draggedItem = newGoals[dragIndex];
        newGoals.splice(dragIndex, 1);
        newGoals.splice(hoverIndex, 0, draggedItem);
        setSavingsGoals(newGoals);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen transition-colors duration-200 bg-page text-page">                <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Budgie 🦜 </h1>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Plan your YNAB allocations with precision
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        <ThemeSelector
                            currentTheme={currentTheme}
                            setCurrentTheme={setCurrentTheme}
                            darkMode={darkMode}
                        />

                        <button
                            onClick={() => setViewMode(viewMode === 'amount' ? 'percentage' : 'amount')}
                            className={`p-2 rounded-lg flex items-center space-x-2 ${viewMode === 'percentage'
                                ? 'bg-green-600 text-white'
                                : `${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`
                                } transition-colors`}
                        >
                            <Percent className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">
                                {viewMode === 'amount' ? 'Show %' : 'Show $'}
                            </span>
                        </button>

                        <button
                            onClick={() => setShowCalendar(true)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                } transition-colors`}
                            title="Open calendar view"
                        >
                            📅
                        </button>

                        <button
                            onClick={() => {
                                setWhatIfMode(!whatIfMode);
                                if (!whatIfMode) setWhatIfPay(takeHomePay);
                            }}
                            className={`p-2 rounded-lg flex items-center space-x-2 ${whatIfMode
                                ? 'bg-blue-600 text-white'
                                : `${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`
                                } transition-colors`}
                        >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">What-If</span>
                        </button>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                                } transition-colors`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Configuration Panel
                    <ConfigurationPanel
                        darkMode={darkMode}
                        showConfig={showConfig}
                        setShowConfig={setShowConfig}
                        takeHomePay={takeHomePay}
                        setTakeHomePay={setTakeHomePay}
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
                        setShowAddAccount={setShowAddAccount}
                        onExport={handleExportToYNAB}
                    /> */}

                {/* Summary Cards */}
                <SummaryCards
                    calculations={calculations}
                    currentPay={currentPay}
                    bufferPercentage={bufferPercentage}
                    viewMode={viewMode}
                    darkMode={darkMode}
                />

                {/* Accounts Section */}
                <AccountsSection
                    accounts={accounts}
                    darkMode={darkMode}
                    onAddAccount={() => setShowAddAccount(true)}
                    onEditAccount={setEditingAccount}
                    onDeleteAccount={(account) => setConfirmDelete({
                        type: 'account',
                        id: account.id,
                        name: account.name,
                        message: `Delete "${account.name}"? All associated transactions will also be deleted.`,
                    })}
                />

                {/* Main Content Grid */}
                {/* Tab Navigation */}
                <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    darkMode={darkMode}
                />

                {/* Tab Content */}
                {activeTab === 'budget' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Categories Section */}
                        <div className="xl:col-span-2">
                            <CategoriesSection
                                categorizedExpenses={categorizedExpenses}
                                calculations={calculations}
                                darkMode={darkMode}
                                viewMode={viewMode}
                                frequencyOptions={frequencyOptions}
                                onAddCategory={() => setShowAddCategory(true)}
                                onAddExpense={() => setShowAddExpense(true)}
                                onAddGoal={() => {
                                    setPreselectedCategory(3);
                                    setShowAddGoal(true);
                                }}
                                onEditCategory={setEditingCategory}
                                onEditExpense={setEditingExpense}
                                onEditGoal={setEditingGoal}
                                onDeleteCategory={(category) => setConfirmDelete({
                                    type: 'category',
                                    id: category.id,
                                    name: category.name,
                                    message: 'Delete this category? All items will be moved to the first category.',
                                })}
                                onDeleteExpense={(expense) => setConfirmDelete({
                                    type: 'expense',
                                    id: expense.id,
                                    name: expense.name,
                                    message: `Delete "${expense.name}"?`,
                                })}
                                onDeleteGoal={(goal) => setConfirmDelete({
                                    type: 'goal',
                                    id: goal.id,
                                    name: goal.name,
                                    message: `Delete "${goal.name}" savings goal?`,
                                })}
                                setExpenses={setExpenses}
                                setSavingsGoals={setSavingsGoals}
                                setCategories={setCategories}
                                setPreselectedCategory={setPreselectedCategory}
                                onMoveCategoryUp={moveCategoryUp}
                                onMoveCategoryDown={moveCategoryDown}
                                onMoveExpense={moveExpenseUpDown}
                                onMoveGoal={moveGoalUpDown}
                                onReorderCategories={reorderCategories}
                                onReorderExpenses={reorderExpenses}
                                onReorderGoals={reorderGoals}
                                calculations={calculations}
                            />
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            {/* Transactions Section */}
                            <TransactionsSection
                                transactions={transactions}
                                accounts={accounts}
                                categories={categories}
                                darkMode={darkMode}
                                onAddTransaction={() => setShowAddTransaction(true)}
                                onShowAllTransactions={() => setActiveTab('transactions')}
                                onEditTransaction={setEditingTransaction}
                                onDeleteTransaction={(transaction) => setConfirmDelete({
                                    type: 'transaction',
                                    id: transaction.id,
                                    name: transaction.transfer
                                        ? `Transfer to ${accounts.find(acc => acc.id === transaction.transferAccountId)?.name}`
                                        : transaction.payee,
                                    message: 'Delete this transaction?',
                                })}
                            />

                            {/* Summary Panel */}
                            <SummaryPanel
                                calculations={calculations}
                                currentPay={currentPay}
                                bufferPercentage={bufferPercentage}
                                viewMode={viewMode}
                                darkMode={darkMode}
                                whatIfMode={whatIfMode}
                                takeHomePay={takeHomePay}
                                whatIfPay={whatIfPay}
                                categorizedExpenses={categorizedExpenses}
                                expenses={expenses}
                                savingsGoals={savingsGoals}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <TransactionsTab
                        transactions={transactions}
                        accounts={accounts}
                        categories={categories}
                        darkMode={darkMode}
                        onAddTransaction={() => setShowAddTransaction(true)}
                        onEditTransaction={setEditingTransaction}
                        onDeleteTransaction={setConfirmDelete}
                    />
                )}

                {activeTab === 'calendar' && (
                    <div className="min-h-[70vh] h-full bg-theme-primary p-4 rounded-lg">
                        <CalendarView
                            darkMode={darkMode}
                            currentPay={currentPay}
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
                        <h2 className="text-2xl font-bold mb-6">Configuration</h2>
                        <ConfigurationPanel
                            darkMode={darkMode}
                            showConfig={true}
                            setShowConfig={() => { }}
                            takeHomePay={takeHomePay}
                            setTakeHomePay={setTakeHomePay}
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
                            setShowAddAccount={setShowAddAccount}
                            onExport={handleExportToYNAB}
                        />
                    </div>
                )}

                {activeTab === 'payees' && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h2 className="text-2xl font-bold mb-4">Payee Management</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Payee management functionality coming soon! This will help you organize and categorize your transaction payees.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg max-w-md mx-auto">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                💡 For now, you can manage payees when adding transactions in the Transactions tab.
                            </p>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {showAddExpense && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
                            <AddExpenseForm
                                onSave={(expenseData, addAnother) => {
                                    const newExpense = {
                                        ...expenseData,
                                        id: Math.max(...expenses.map(e => e.id), 0) + 1,
                                        collapsed: true,
                                    };
                                    setExpenses(prev => [...prev, newExpense]);
                                    if (!addAnother) {
                                        setShowAddExpense(false);
                                        setPreselectedCategory(null);
                                    }
                                }}
                                onCancel={() => {
                                    setShowAddExpense(false);
                                    setPreselectedCategory(null);
                                }}
                                categories={categories}
                                accounts={accounts}
                                darkMode={darkMode}
                                currentPay={currentPay}
                                preselectedCategory={preselectedCategory}
                            />
                        </div>
                    </div>
                )}

                {editingExpense && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Edit Expense</h3>
                            <AddExpenseForm
                                expense={editingExpense}
                                onSave={(expenseData) => {
                                    setExpenses(prev => prev.map(exp =>
                                        exp.id === editingExpense.id ? { ...exp, ...expenseData } : exp
                                    ));
                                    setEditingExpense(null);
                                }}
                                onCancel={() => setEditingExpense(null)}
                                categories={categories}
                                darkMode={darkMode}
                                currentPay={currentPay}
                            />
                        </div>
                    </div>
                )}

                {showAddCategory && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96`}>
                            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
                            <AddCategoryForm
                                onSave={(categoryData, addAnother) => {
                                    const newCategory = {
                                        ...categoryData,
                                        id: Math.max(...categories.map(c => c.id), 0) + 1,
                                        collapsed: false,
                                    };
                                    setCategories(prev => [...prev, newCategory]);
                                    if (!addAnother) setShowAddCategory(false);
                                }}
                                onCancel={() => setShowAddCategory(false)}
                                categoryColors={categoryColors}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {editingCategory && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96`}>
                            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
                            <AddCategoryForm
                                category={editingCategory}
                                onSave={(categoryData) => {
                                    setCategories(prev => prev.map(cat =>
                                        cat.id === editingCategory.id ? { ...cat, ...categoryData } : cat
                                    ));
                                    setEditingCategory(null);
                                }}
                                onCancel={() => setEditingCategory(null)}
                                categoryColors={categoryColors}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {showAddGoal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Add Savings Goal</h3>
                            <div className="text-xs text-gray-500 mb-1">
                                Fill any two fields and the third calculates automatically
                            </div>
                            <AddGoalForm
                                onSave={(goalData, addAnother) => {
                                    const newGoal = {
                                        ...goalData,
                                        id: Math.max(...savingsGoals.map(g => g.id), 0) + 1,
                                        collapsed: true,
                                    };
                                    setSavingsGoals(prev => [...prev, newGoal]);
                                    if (!addAnother) {
                                        setShowAddGoal(false);
                                        setPreselectedCategory(null);
                                    }
                                }}
                                onCancel={() => {
                                    setShowAddGoal(false);
                                    setPreselectedCategory(null);
                                }}
                                categories={categories}
                                darkMode={darkMode}
                                currentPay={currentPay}
                                accounts={accounts}
                                preselectedCategory={preselectedCategory}
                            />
                        </div>
                    </div>
                )}

                {editingGoal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Edit Savings Goal</h3>
                            <AddGoalForm
                                goal={editingGoal}
                                onSave={(goalData) => {
                                    setSavingsGoals(prev => prev.map(goal =>
                                        goal.id === editingGoal.id ? { ...goal, ...goalData } : goal
                                    ));
                                    setEditingGoal(null);
                                }}
                                onCancel={() => setEditingGoal(null)}
                                categories={categories}
                                darkMode={darkMode}
                                currentPay={currentPay}
                            />
                        </div>
                    </div>
                )}

                {showAddAccount && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96`}>
                            <h3 className="text-lg font-semibold mb-4">Add New Account</h3>
                            <AddAccountForm
                                onSave={(accountData) => {
                                    const newAccount = {
                                        ...accountData,
                                        id: Math.max(...accounts.map(a => a.id), 0) + 1,
                                    };
                                    setAccounts(prev => [...prev, newAccount]);
                                    setShowAddAccount(false);
                                }}
                                onCancel={() => setShowAddAccount(false)}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {editingAccount && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96`}>
                            <h3 className="text-lg font-semibold mb-4">Edit Account</h3>
                            <AddAccountForm
                                account={editingAccount}
                                onSave={(accountData) => {
                                    setAccounts(prev => prev.map(acc =>
                                        acc.id === editingAccount.id ? { ...acc, ...accountData } : acc
                                    ));
                                    setEditingAccount(null);
                                }}
                                onCancel={() => setEditingAccount(null)}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {showAddTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
                            <AddTransactionForm
                                onSave={(transactionData, addAnother) => {
                                    const newTransaction = {
                                        ...transactionData,
                                        id: Math.max(...transactions.map(t => t.id), 0) + 1,
                                    };
                                    setTransactions(prev => [...prev, newTransaction]);
                                    if (!addAnother) setShowAddTransaction(false);
                                }}
                                onCancel={() => setShowAddTransaction(false)}
                                categories={categories}
                                accounts={accounts}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {editingTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className={`bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
                            <AddTransactionForm
                                transaction={editingTransaction}
                                onSave={(transactionData) => {
                                    setTransactions(prev => prev.map(txn =>
                                        txn.id === editingTransaction.id ? { ...txn, ...transactionData } : txn
                                    ));
                                    setEditingTransaction(null);
                                }}
                                onCancel={() => setEditingTransaction(null)}
                                categories={categories}
                                accounts={accounts}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                )}

                {showTransactions && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className={`bg-theme-primary rounded-lg w-full max-w-4xl h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col`}>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold flex items-center">💳 All Transactions</h3>
                                    <button
                                        onClick={() => setShowTransactions(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex space-x-4 items-center">
                                    <select
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                        className={`p-2 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <option value="all">All Accounts</option>
                                        {accounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowAddTransaction(true)}
                                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Transaction
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-2">
                                    {transactions
                                        .filter(txn =>
                                            selectedAccount === 'all' || txn.accountId === parseInt(selectedAccount)
                                        )
                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                        .map(transaction => {
                                            const account = accounts.find(acc => acc.id === transaction.accountId);
                                            const category = categories.find(cat => cat.id === transaction.categoryId);
                                            const transferAccount = transaction.transferAccountId
                                                ? accounts.find(acc => acc.id === transaction.transferAccountId)
                                                : null;

                                            return (
                                                <div
                                                    key={transaction.id}
                                                    className={`p-4 rounded border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center">
                                                                <span className="font-medium">
                                                                    {transaction.transfer
                                                                        ? `Transfer to ${transferAccount?.name}`
                                                                        : transaction.payee}
                                                                </span>
                                                                {transaction.cleared && (
                                                                    <span className="ml-2 text-green-500">✓</span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {transaction.date} • {account?.name}{' '}
                                                                {category && `• ${category.name}`}
                                                            </div>
                                                            {transaction.memo && (
                                                                <div className="text-sm text-gray-400 mt-1">
                                                                    {transaction.memo}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="font-semibold text-lg">
                                                                ${transaction.amount.toFixed(2)}
                                                            </div>
                                                            <div className="flex space-x-1 mt-1">
                                                                <button
                                                                    onClick={() => setEditingTransaction(transaction)}
                                                                    className="p-1 hover:bg-gray-600 rounded"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDelete({
                                                                        type: 'transaction',
                                                                        id: transaction.id,
                                                                        name: transaction.transfer
                                                                            ? `Transfer to ${transferAccount?.name}`
                                                                            : transaction.payee,
                                                                        message: 'Delete this transaction?',
                                                                    })}
                                                                    className="p-1 hover:bg-gray-600 rounded text-red-400"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {transactions.length === 0 && (
                                        <p className="text-gray-500 text-center py-8">
                                            No transactions yet. Add your first transaction to get started!
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
                                <button
                                    onClick={() => setShowTransactions(false)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* {showCalendar && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-theme-primary rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-6 border border-theme-primary">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-theme-primary">📅 Paycheck & Expense Calendar</h3>
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="text-theme-secondary hover:text-theme-primary text-xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <CalendarView
                                    darkMode={darkMode}
                                    currentPay={currentPay}
                                    paySchedule={paySchedule}
                                    savingsGoals={savingsGoals}
                                    expenses={expenses}
                                    categories={categories}
                                    frequencyOptions={frequencyOptions}
                                    accounts={accounts}
                                />
                            </div>
                        </div>
                    )} */}

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
                        darkMode={darkMode}
                    />
                )}
            </div>
            </div>
        </DndProvider>
    );
};

export default App;