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
import BudgiePet from './components/BudgiePet';
import FundingMode from './components/FundingMode';

// Import hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useBudgetCalculations } from './hooks/useBudgetCalculations';
import { usePaycheckTimeline } from './hooks/usePaycheckTimeline';
// Import utilities
import { generateCalendarEvents } from './utils/calendarUtils';
import { exportToYNAB } from './utils/exportUtils';

// Migration function for categories
const migrateCategoriesData = (categories) => {
    return categories.map(category => ({
        ...category,
        // Add envelope fields
        allocated: category.allocated || 0,
        spent: category.spent || 0,
        lastFunded: category.lastFunded || null,
        targetBalance: category.targetBalance || 0,
        autoFunding: category.autoFunding || {
            enabled: false,
            maxAmount: 500,
            priority: 'medium'
        }
    }));
};

const App = () => {
    // State management using localStorage hook
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
            allocated: 0,
            spent: 0,
            lastFunded: null,
            targetBalance: 0,
            autoFunding: {
                enabled: false,
                maxAmount: 500,
                priority: 'medium'
            }
        },
        {
            id: 2,
            name: 'Pet Care',
            color: 'bg-gradient-to-r from-green-500 to-blue-500',
            collapsed: false,
            allocated: 0,
            spent: 0,
            lastFunded: null,
            targetBalance: 0,
            autoFunding: {
                enabled: false,
                maxAmount: 500,
                priority: 'medium'
            }
        },
        {
            id: 3,
            name: 'Savings Goals',
            color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
            collapsed: false,
            allocated: 0,
            spent: 0,
            lastFunded: null,
            targetBalance: 0,
            autoFunding: {
                enabled: false,
                maxAmount: 500,
                priority: 'medium'
            }
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
    const budgetCalculations = useBudgetCalculations({
        expenses,
        savingsGoals,
        currentPay,
        roundingOption,
        bufferPercentage,
        frequencyOptions,
    });

    // Timeline calculations (new functionality)
    const timelineData = usePaycheckTimeline({
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

    // Build categorized expenses with proper category info
    const categorizedExpenses = useMemo(() => {
        return categories.map(category => {
            const expenseTotal = budgetCalculations.expenseAllocations
                .filter(exp => exp.categoryId === category.id)
                .reduce((sum, exp) => sum + (exp.biweeklyAmount || 0), 0);

            const goalTotal = budgetCalculations.goalAllocations
                .filter(goal => goal.categoryId === category.id)
                .reduce((sum, goal) => sum + (goal.biweeklyAmount || 0), 0);

            const total = expenseTotal + goalTotal;

            return {
                ...category,
                expenses: budgetCalculations.expenseAllocations.filter(exp => exp.categoryId === category.id),
                goals: budgetCalculations.goalAllocations.filter(goal => goal.categoryId === category.id),
                total: total || 0,
                percentage: currentPay > 0 ? ((total || 0) / currentPay) * 100 : 0
            };
        });
    }, [categories, budgetCalculations.expenseAllocations, budgetCalculations.goalAllocations, currentPay]);

    // Migration effect
    useEffect(() => {
        if (categories.length > 0 && !categories[0].hasOwnProperty('allocated')) {
            const migratedCategories = migrateCategoriesData(categories);
            setCategories(migratedCategories);
        }
    }, []);

    // Category management functions
    const generateNextCategoryId = () => {
        if (categories.length === 0) return 1;
        return Math.max(...categories.map(c => c.id)) + 1;
    };

    const cleanupOrphanedItems = () => {
        const validCategoryIds = categories.map(cat => cat.id);
        const firstCategoryId = categories[0]?.id;

        if (!firstCategoryId) return;

        setExpenses(prev => prev.map(exp => {
            if (!validCategoryIds.includes(exp.categoryId)) {
                return { ...exp, categoryId: firstCategoryId };
            }
            return exp;
        }));

        setSavingsGoals(prev => prev.map(goal => {
            if (!validCategoryIds.includes(goal.categoryId)) {
                return { ...goal, categoryId: firstCategoryId };
            }
            return goal;
        }));
    };

    // Run cleanup once on mount to fix any existing orphaned items
    useEffect(() => {
        if (categories.length > 0) {
            cleanupOrphanedItems();
        }
    }, []);

    // Set Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    // Funding functions
    const handleFundCategory = (categoryId, amount) => {
        setCategories(prev => prev.map(category =>
            category.id === categoryId
                ? {
                    ...category,
                    allocated: (category.allocated || 0) + amount,
                    lastFunded: new Date().toISOString()
                }
                : category
        ));
    };

    const handleAutoFund = (suggestions) => {
        suggestions.forEach(suggestion => {
            handleFundCategory(suggestion.categoryId, suggestion.amount);
        });
    };

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

        setTimeout(() => {
            cleanupOrphanedItems();
        }, 100);
    };

    const handleDeleteAccount = (accountId) => {
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        setTransactions(transactions.filter(txn =>
            txn.accountId !== accountId && txn.transferAccountId !== accountId
        ));
        setConfirmDelete(null);
    };

    const handleDeleteTransaction = (transactionId) => {
        const transaction = transactions.find(txn => txn.id === transactionId);

        if (transaction) {
            // Reverse the transaction's effects
            if (transaction.transfer) {
                // Reverse transfer
                setAccounts(prev => prev.map(account => {
                    if (account.id === transaction.accountId) {
                        return {
                            ...account,
                            balance: (account.balance || 0) + Math.abs(transaction.amount)
                        };
                    } else if (account.id === transaction.transferAccountId) {
                        return {
                            ...account,
                            balance: (account.balance || 0) - Math.abs(transaction.amount)
                        };
                    }
                    return account;
                }));
            } else if (transaction.isIncome || transaction.amount > 0) {
                // Reverse income
                setAccounts(prev => prev.map(account =>
                    account.id === transaction.accountId
                        ? {
                            ...account,
                            balance: (account.balance || 0) - Math.abs(transaction.amount)
                        }
                        : account
                ));
            } else {
                // Reverse expense
                setAccounts(prev => prev.map(account =>
                    account.id === transaction.accountId
                        ? {
                            ...account,
                            balance: (account.balance || 0) + Math.abs(transaction.amount)
                        }
                        : account
                ));

                if (transaction.categoryId) {
                    setCategories(prev => prev.map(category =>
                        category.id === transaction.categoryId
                            ? {
                                ...category,
                                spent: Math.max(0, (category.spent || 0) - Math.abs(transaction.amount))
                            }
                            : category
                    ));
                }
            }
        }

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

    // Arrow button functions for expenses/goals
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

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen transition-colors duration-200 bg-page text-page">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-theme-primary">Budgie 🦜</h1>
                            <p className="text-theme-secondary">
                                Plan your YNAB allocations with precision
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            <ThemeSelector
                                currentTheme={currentTheme}
                                setCurrentTheme={setCurrentTheme}
                            />

                            <button
                                onClick={() => setViewMode(viewMode === 'amount' ? 'percentage' : 'amount')}
                                className={`btn-secondary p-2 rounded-lg flex items-center space-x-2 ${viewMode === 'percentage' ? 'btn-success' : ''}`}
                            >
                                <Percent className="w-4 h-4" />
                                <span className="text-sm hidden sm:inline">
                                    {viewMode === 'amount' ? 'Show %' : 'Show $'}
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    setWhatIfMode(!whatIfMode);
                                    if (!whatIfMode) setWhatIfPay(takeHomePay);
                                }}
                                className={`btn-secondary p-2 rounded-lg flex items-center space-x-2 ${whatIfMode ? 'btn-primary' : ''}`}
                            >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm hidden sm:inline">What-If</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <SummaryCards
                        calculations={calculations}
                        currentPay={currentPay}
                        bufferPercentage={bufferPercentage}
                        viewMode={viewMode}
                        expenses={expenses}
                        savingsGoals={savingsGoals}
                        timeline={timelineData}
                        accounts={accounts}
                        categories={categories}
                    />

                    {/* Accounts Section */}
                    <AccountsSection
                        accounts={accounts}
                        onAddAccount={() => setShowAddAccount(true)}
                        onEditAccount={setEditingAccount}
                        onDeleteAccount={(account) => setConfirmDelete({
                            type: 'account',
                            id: account.id,
                            name: account.name,
                            message: `Delete "${account.name}"? All associated transactions will also be deleted.`,
                        })}
                    />

                    {/* Tab Navigation */}
                    <TabNavigation
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />

                    {/* Tab Content */}
                    {activeTab === 'budget' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Categories Section */}
                            <div className="xl:col-span-2">
                                <CategoriesSection
                                    categorizedExpenses={categorizedExpenses}
                                    viewMode={viewMode}
                                    frequencyOptions={frequencyOptions}
                                    timeline={timelineData}
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
                                    categories={categories}
                                />
                            </div>

                            {/* Right Sidebar */}
                            <div className="space-y-6">
                                <TransactionsSection
                                    transactions={transactions}
                                    accounts={accounts}
                                    categories={categories}
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

                                <SummaryPanel
                                    calculations={calculations}
                                    currentPay={currentPay}
                                    bufferPercentage={bufferPercentage}
                                    viewMode={viewMode}
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

                    {activeTab === 'funding' && (
                        <FundingMode
                            categories={categories}
                            expenses={expenses}
                            savingsGoals={savingsGoals}
                            timeline={timelineData}
                            currentPay={currentPay}
                            onFundCategory={handleFundCategory}
                            onAutoFund={handleAutoFund}
                        />
                    )}

                    {activeTab === 'transactions' && (
                        <TransactionsTab
                            transactions={transactions}
                            accounts={accounts}
                            categories={categories}
                            onAddTransaction={() => setShowAddTransaction(true)}
                            onEditTransaction={setEditingTransaction}
                            onDeleteTransaction={setConfirmDelete}
                        />
                    )}

                    {activeTab === 'calendar' && (
                        <div className="min-h-[70vh] h-full bg-theme-primary p-4 rounded-lg">
                            <CalendarView
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
                            <h2 className="text-2xl font-bold mb-6 text-theme-primary">Configuration</h2>
                            <ConfigurationPanel
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
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-theme-tertiary" />
                            <h2 className="text-2xl font-bold mb-4 text-theme-primary">Payee Management</h2>
                            <p className="text-theme-secondary mb-6">
                                Payee management functionality coming soon! This will help you organize and categorize your transaction payees.
                            </p>
                            <div className="bg-theme-secondary p-4 rounded-lg max-w-md mx-auto border border-theme-primary">
                                <p className="text-sm text-theme-blue">
                                    💡 For now, you can manage payees when adding transactions in the Transactions tab.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Modals */}
                    {showAddExpense && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add New Expense</h3>
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
                                    currentPay={currentPay}
                                    preselectedCategory={preselectedCategory}
                                />
                            </div>
                        </div>
                    )}

                    {editingExpense && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Expense</h3>
                                <AddExpenseForm
                                    expense={editingExpense}
                                    accounts={accounts}
                                    onSave={(expenseData) => {
                                        setExpenses(prev => prev.map(exp =>
                                            exp.id === editingExpense.id ? { ...exp, ...expenseData } : exp
                                        ));
                                        setEditingExpense(null);
                                    }}
                                    onCancel={() => setEditingExpense(null)}
                                    categories={categories}
                                    currentPay={currentPay}
                                />
                            </div>
                        </div>
                    )}

                    {showAddCategory && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add New Category</h3>
                                <AddCategoryForm
                                    onSave={(categoryData, addAnother) => {
                                        const newCategory = {
                                            ...categoryData,
                                            id: generateNextCategoryId(),
                                            collapsed: false,
                                            allocated: 0,
                                            spent: 0,
                                            lastFunded: null,
                                            targetBalance: 0,
                                            autoFunding: {
                                                enabled: false,
                                                maxAmount: 500,
                                                priority: 'medium'
                                            }
                                        };
                                        setCategories(prev => [...prev, newCategory]);
                                        if (!addAnother) setShowAddCategory(false);
                                    }}
                                    onCancel={() => setShowAddCategory(false)}
                                    categoryColors={categoryColors}
                                />
                            </div>
                        </div>
                    )}

                    {editingCategory && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Category</h3>
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
                                />
                            </div>
                        </div>
                    )}

                    {showAddGoal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add Savings Goal</h3>
                                <div className="text-xs text-theme-tertiary mb-1">
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
                                    accounts={accounts}
                                    currentPay={currentPay}
                                    preselectedCategory={preselectedCategory}
                                />
                            </div>
                        </div>
                    )}

                    {editingGoal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Savings Goal</h3>
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
                                    accounts={accounts}
                                    currentPay={currentPay}
                                />
                            </div>
                        </div>
                    )}

                    {showAddAccount && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add New Account</h3>
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
                                />
                            </div>
                        </div>
                    )}

                    {editingAccount && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Account</h3>
                                <AddAccountForm
                                    account={editingAccount}
                                    onSave={(accountData) => {
                                        setAccounts(prev => prev.map(acc =>
                                            acc.id === editingAccount.id ? { ...acc, ...accountData } : acc
                                        ));
                                        setEditingAccount(null);
                                    }}
                                    onCancel={() => setEditingAccount(null)}
                                />
                            </div>
                        </div>
                    )}


                    {/*Add Transaction Handler */}
                    {showAddTransaction && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add New Transaction</h3>
                                <AddTransactionForm
                                    onSave={(transactionData, addAnother) => {
                                        const newTransaction = {
                                            ...transactionData,
                                            id: Math.max(...transactions.map(t => t.id), 0) + 1,
                                        };

                                        // Handle different transaction types
                                        if (newTransaction.transfer) {
                                            // TRANSFERS: Update both account balances
                                            setAccounts(prev => prev.map(account => {
                                                if (account.id === newTransaction.accountId) {
                                                    // Subtract from source account
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(newTransaction.amount)
                                                    };
                                                } else if (account.id === newTransaction.transferAccountId) {
                                                    // Add to destination account
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(newTransaction.amount)
                                                    };
                                                }
                                                return account;
                                            }));
                                        } else if (newTransaction.isIncome || newTransaction.amount > 0) {
                                            // INCOME: Only update account balance, no category impact
                                            setAccounts(prev => prev.map(account =>
                                                account.id === newTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(newTransaction.amount)
                                                    }
                                                    : account
                                            ));
                                        } else {
                                            // EXPENSES: Update both account balance and category spent
                                            setAccounts(prev => prev.map(account =>
                                                account.id === newTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(newTransaction.amount)
                                                    }
                                                    : account
                                            ));

                                            if (newTransaction.categoryId) {
                                                setCategories(prev => prev.map(category =>
                                                    category.id === newTransaction.categoryId
                                                        ? {
                                                            ...category,
                                                            spent: (category.spent || 0) + Math.abs(newTransaction.amount)
                                                        }
                                                        : category
                                                ));
                                            }
                                        }

                                        setTransactions(prev => [...prev, newTransaction]);
                                        if (!addAnother) setShowAddTransaction(false);
                                    }}
                                    onCancel={() => setShowAddTransaction(false)}
                                    categories={categories}
                                    accounts={accounts}
                                />
                            </div>
                        </div>
                    )}

                    {editingTransaction && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Transaction</h3>
                                <AddTransactionForm
                                    transaction={editingTransaction}
                                    onSave={(transactionData) => {
                                        const oldTransaction = editingTransaction;
                                        const newTransaction = { ...oldTransaction, ...transactionData };

                                        // Reverse the old transaction's effects first
                                        if (oldTransaction.transfer) {
                                            // Reverse transfer
                                            setAccounts(prev => prev.map(account => {
                                                if (account.id === oldTransaction.accountId) {
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(oldTransaction.amount)
                                                    };
                                                } else if (account.id === oldTransaction.transferAccountId) {
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(oldTransaction.amount)
                                                    };
                                                }
                                                return account;
                                            }));
                                        } else if (oldTransaction.isIncome || oldTransaction.amount > 0) {
                                            // Reverse income
                                            setAccounts(prev => prev.map(account =>
                                                account.id === oldTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(oldTransaction.amount)
                                                    }
                                                    : account
                                            ));
                                        } else {
                                            // Reverse expense
                                            setAccounts(prev => prev.map(account =>
                                                account.id === oldTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(oldTransaction.amount)
                                                    }
                                                    : account
                                            ));

                                            if (oldTransaction.categoryId) {
                                                setCategories(prev => prev.map(category =>
                                                    category.id === oldTransaction.categoryId
                                                        ? {
                                                            ...category,
                                                            spent: Math.max(0, (category.spent || 0) - Math.abs(oldTransaction.amount))
                                                        }
                                                        : category
                                                ));
                                            }
                                        }

                                        // Now apply the new transaction's effects
                                        if (newTransaction.transfer) {
                                            setAccounts(prev => prev.map(account => {
                                                if (account.id === newTransaction.accountId) {
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(newTransaction.amount)
                                                    };
                                                } else if (account.id === newTransaction.transferAccountId) {
                                                    return {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(newTransaction.amount)
                                                    };
                                                }
                                                return account;
                                            }));
                                        } else if (newTransaction.isIncome || newTransaction.amount > 0) {
                                            setAccounts(prev => prev.map(account =>
                                                account.id === newTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) + Math.abs(newTransaction.amount)
                                                    }
                                                    : account
                                            ));
                                        } else {
                                            setAccounts(prev => prev.map(account =>
                                                account.id === newTransaction.accountId
                                                    ? {
                                                        ...account,
                                                        balance: (account.balance || 0) - Math.abs(newTransaction.amount)
                                                    }
                                                    : account
                                            ));

                                            if (newTransaction.categoryId) {
                                                setCategories(prev => prev.map(category =>
                                                    category.id === newTransaction.categoryId
                                                        ? {
                                                            ...category,
                                                            spent: (category.spent || 0) + Math.abs(newTransaction.amount)
                                                        }
                                                        : category
                                                ));
                                            }
                                        }

                                        setTransactions(prev => prev.map(txn =>
                                            txn.id === editingTransaction.id ? newTransaction : txn
                                        ));
                                        setEditingTransaction(null);
                                    }}
                                    onCancel={() => setEditingTransaction(null)}
                                    categories={categories}
                                    accounts={accounts}
                                />
                            </div>
                        </div>
                    )}



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