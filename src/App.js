import React, { useState, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Download, Edit2, Trash2, Calculator, Target, DollarSign, Eye, Percent, Users, Palette, Settings, Calendar, Upload } from 'lucide-react';

// Import NEW streamlined components
import SimplifiedSummaryCards from './components/SimplifiedSummaryCards';
import UnifiedCategoryCard from './components/UnifiedCategoryCard';
import UnifiedItemForm from './components/UnifiedItemForm';

// Import existing components we're keeping
import AddCategoryForm from './components/AddCategoryForm';
import AddAccountForm from './components/AddAccountForm';
import AddTransactionForm from './components/AddTransactionForm';
import CalendarView from './components/CalendarView';
import ConfigurationPanel from './components/ConfigurationPanel';
import AccountsSection from './components/AccountsSection';
import TransactionsTab from './components/TransactionsTab';
import ConfirmDialog from './components/ConfirmDialog';
import CurrencyInput from './components/CurrencyInput';
import ThemeSelector from './components/ThemeSelector';
import PlanningMode from './components/PlanningMode';
import EnhancedCategoryCard from './components/EnhancedCategoryCard';
import ImprovedFundingMode from './components/ImprovedFundingMode';

// Import hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useBudgetCalculations } from './hooks/useBudgetCalculations';
import { usePaycheckTimeline } from './hooks/usePaycheckTimeline';

// Import utilities
import { generateCalendarEvents } from './utils/calendarUtils';
import { exportToYNAB } from './utils/exportUtils';


const App = () => {
    // Enhanced state management using localStorage hook
    const [takeHomePay, setTakeHomePay] = useLocalStorage('budgetCalc_takeHomePay', 2800);
    const [roundingOption, setRoundingOption] = useLocalStorage('budgetCalc_roundingOption', 5);
    const [bufferPercentage, setBufferPercentage] = useLocalStorage('budgetCalc_bufferPercentage', 7);
    const [currentTheme, setCurrentTheme] = useLocalStorage('budgetCalc_theme', 'light');
    const [payFrequency, setPayFrequency] = useLocalStorage('budgetCalc_payFrequency', 'bi-weekly');

    // Categories state (keeping existing structure)
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

    // Expenses and goals state (keeping existing structure)
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

    // Accounts state (keeping existing structure)
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

    // Transactions state (keeping existing structure)
    const [transactions, setTransactions] = useLocalStorage('budgetCalc_transactions', []);

    // Pay schedule state (keeping existing structure)
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

    // NEW: Streamlined UI state
    const [viewMode, setViewMode] = useState('planning'); // 'planning' or 'funding'
    const [whatIfMode, setWhatIfMode] = useState(false);
    const [whatIfPay, setWhatIfPay] = useState(2800);
    const [showConfig, setShowConfig] = useState(false);
    const [activeTab, setActiveTab] = useState('budget'); // Simplified tabs

    // Modal states (keeping existing structure)
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false); // NEW: Unified item form
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showAddTransaction, setShowAddTransaction] = useState(false);

    // Editing states (simplified)
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null); // NEW: Unified editing
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Constants (keeping existing logic)
    const currentPay = whatIfMode ? whatIfPay : takeHomePay;
    // console.log('Current pay value:', currentPay, 'takeHomePay:', takeHomePay, 'whatIfPay:', whatIfPay);


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

    const payFrequencyOptions = [
        { value: 'weekly', label: 'Weekly', paychecksPerMonth: 4.33 },
        { value: 'bi-weekly', label: 'Bi-weekly', paychecksPerMonth: 2.17 },
        { value: 'semi-monthly', label: 'Semi-monthly (15th & 30th)', paychecksPerMonth: 2.0 },
        { value: 'monthly', label: 'Monthly', paychecksPerMonth: 1.0 },
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

    // Get per check amounts
    const convertToPerPaycheck = (monthlyAmount) => {
        const payFreqOption = payFrequencyOptions.find(opt => opt.value === payFrequency);
        const paychecksPerMonth = payFreqOption?.paychecksPerMonth || 2.17;
        return monthlyAmount / paychecksPerMonth;
    };
    // Keep existing calculation hooks
    const budgetCalculations = useBudgetCalculations({
        expenses,
        savingsGoals,
        currentPay,
        roundingOption,
        bufferPercentage,
        frequencyOptions,
    });
    console.log('Budget calculations result:', budgetCalculations);


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

    // // Migration effect (keeping existing logic)
    // useEffect(() => {
    //     if (categories.length > 0 && !categories[0].hasOwnProperty('allocated')) {
    //         const migratedCategories = migrateCategoriesData(categories);
    //         setCategories(migratedCategories);
    //     }
    // }, []);

    // Set Theme (keeping existing logic)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);


    // Helper functions (keeping existing logic)
    const generateNextCategoryId = () => {
        if (categories.length === 0) return 1;
        return Math.max(...categories.map(c => c.id)) + 1;
    };

    // NEW: Funding functions for the unified system
    const handleFundCategory = (categoryId, amount) => {
        // Check if we have enough to allocate
        const available = allocationData.toBeAllocated;
        if (amount > available) {
            alert(`Only $${available.toFixed(2)} available to allocate`);
            return;
        }

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
    // NEW: Unified item handlers
    const handleAddItem = (categoryId) => {
        setPreselectedCategory(categoryId);
        setShowAddItem(true);
    };

    const handleSaveItem = (itemData, addAnother = false) => {
        console.log('=== SAVE ITEM DEBUG ===');
        console.log('itemData received:', itemData);
        console.log('editingItem:', editingItem);
        console.log('addAnother:', addAnother);
        console.log('======================');

        console.log('Saving item:', itemData, 'editingItem:', editingItem);

        if (editingItem) {
            // Update existing item
            if (itemData.type === 'goal' || itemData.targetAmount) {
                setSavingsGoals(prev => prev.map(goal =>
                    goal.id === editingItem.id ? { ...goal, ...itemData } : goal
                ));
            } else {
                setExpenses(prev => prev.map(expense =>
                    expense.id === editingItem.id ? { ...expense, ...itemData } : expense
                ));
            }

            // Update localStorage planning items
            try {
                const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
                const updatedItems = planningItems.map(item =>
                    item.id === editingItem.id ? { ...item, ...itemData } : item
                );
                localStorage.setItem('budgetCalc_planningItems', JSON.stringify(updatedItems));
            } catch (error) {
                console.error('Error updating planning items:', error);
            }

            setEditingItem(null);
        } else {
            // Add new item
            const newItem = {
                ...itemData,
                id: Math.max(
                    ...expenses.map(e => e.id),
                    ...savingsGoals.map(g => g.id),
                    0
                ) + 1,
                collapsed: true,
            };

            if (itemData.type === 'goal' || itemData.targetAmount) {
                setSavingsGoals(prev => [...prev, newItem]);
            } else {
                setExpenses(prev => [...prev, newItem]);
            }

            // ADD THIS: Also add to localStorage planning items
            try {
                const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
                const newPlanningItem = {
                    ...newItem,
                    type: itemData.type === 'goal' || itemData.targetAmount ? 'savings-goal' : 'expense',
                    isActive: !itemData.allocationPaused && itemData.priorityState === 'active'
                };
                planningItems.push(newPlanningItem);
                localStorage.setItem('budgetCalc_planningItems', JSON.stringify(planningItems));

                // Also add to active budget allocations if active
                if (newPlanningItem.isActive) {
                    const activeBudgetAllocations = JSON.parse(localStorage.getItem('budgetCalc_activeBudgetAllocations') || '[]');
                    const newAllocation = {
                        id: Math.max(...activeBudgetAllocations.map(a => a.id), 0) + 1,
                        planningItemId: newItem.id,
                        categoryId: newItem.categoryId,
                        monthlyAllocation: newPlanningItem.type === 'expense' ? newItem.amount : newItem.monthlyContribution || 0,
                        perPaycheckAmount: 0, // Will be calculated
                        sourceAccountId: newItem.accountId || accounts[0]?.id || 1,
                        isPaused: false,
                        createdAt: new Date().toISOString()
                    };
                    activeBudgetAllocations.push(newAllocation);
                    localStorage.setItem('budgetCalc_activeBudgetAllocations', JSON.stringify(activeBudgetAllocations));
                }
            } catch (error) {
                console.error('Error adding to planning items:', error);
            }

            if (!addAnother) {
                setShowAddItem(false);
                setPreselectedCategory(null);
            }
        }
    };

    // Keep existing delete handlers
    const handleDeleteExpense = (expenseId) => {
        setExpenses(expenses.filter(exp => exp.id !== expenseId));
        try {
            const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
            const updatedItems = planningItems.filter(item => item.id !== expenseId);
            localStorage.setItem('budgetCalc_planningItems', JSON.stringify(updatedItems));
        } catch (error) {
            console.error('Error deleting from planning items:', error);
        }
        setConfirmDelete(null);
    };

    const handleDeleteGoal = (goalId) => {
        setSavingsGoals(savingsGoals.filter(goal => goal.id !== goalId));
        try {
            const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
            const updatedItems = planningItems.filter(item => item.id !== goalId);
            localStorage.setItem('budgetCalc_planningItems', JSON.stringify(updatedItems));
        } catch (error) {
            console.error('Error deleting from planning items:', error);
        }
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
        const transaction = transactions.find(txn => txn.id === transactionId);

        if (transaction) {
            // Reverse the transaction's effects (keeping existing logic)
            if (transaction.transfer) {
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
                setAccounts(prev => prev.map(account =>
                    account.id === transaction.accountId
                        ? {
                            ...account,
                            balance: (account.balance || 0) - Math.abs(transaction.amount)
                        }
                        : account
                ));
            } else {
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
            viewMode: 'amount',
            frequencyOptions,
        });
    };

    // Toggle item active/inactive status  
    const handleToggleItemActive = (itemId, isActive) => {
        // Update in both expenses and savings goals
        setExpenses(prev => prev.map(expense =>
            expense.id === itemId
                ? {
                    ...expense,
                    isActive,
                    allocationPaused: !isActive,
                    priorityState: isActive ? 'active' : 'paused'
                }
                : expense
        ));

        setSavingsGoals(prev => prev.map(goal =>
            goal.id === itemId
                ? {
                    ...goal,
                    isActive,
                    allocationPaused: !isActive,
                    priorityState: isActive ? 'active' : 'paused'
                }
                : goal
        ));

        // Update planning items in localStorage
        try {
            const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
            const updatedItems = planningItems.map(item =>
                item.id === itemId ? { ...item, isActive } : item
            );
            localStorage.setItem('budgetCalc_planningItems', JSON.stringify(updatedItems));

            // Also update active budget allocations
            const activeBudgetAllocations = JSON.parse(localStorage.getItem('budgetCalc_activeBudgetAllocations') || '[]');
            if (isActive) {
                // Add to active allocations if not already there
                const exists = activeBudgetAllocations.some(allocation => allocation.planningItemId === itemId);
                if (!exists) {
                    const planningItem = updatedItems.find(item => item.id === itemId);
                    if (planningItem) {
                        const newAllocation = {
                            id: Math.max(...activeBudgetAllocations.map(a => a.id), 0) + 1,
                            planningItemId: itemId,
                            categoryId: planningItem.categoryId,
                            monthlyAllocation: planningItem.type === 'expense' ? planningItem.amount : planningItem.monthlyContribution || 0,
                            perPaycheckAmount: 0, // Will be calculated
                            sourceAccountId: planningItem.accountId || accounts[0]?.id || 1,
                            isPaused: false,
                            createdAt: new Date().toISOString()
                        };
                        activeBudgetAllocations.push(newAllocation);
                    }
                }
            } else {
                // Remove from active allocations
                const filteredAllocations = activeBudgetAllocations.filter(allocation => allocation.planningItemId !== itemId);
                localStorage.setItem('budgetCalc_activeBudgetAllocations', JSON.stringify(filteredAllocations));
            }

            if (isActive) {
                localStorage.setItem('budgetCalc_activeBudgetAllocations', JSON.stringify(activeBudgetAllocations));
            }
        } catch (error) {
            console.error('Error updating planning items:', error);
        }
    };

    // Move item between categories
    const handleMoveItem = (itemId, newCategoryId) => {
        // Update in expenses and savings goals
        setExpenses(prev => prev.map(expense =>
            expense.id === itemId ? { ...expense, categoryId: newCategoryId } : expense
        ));

        setSavingsGoals(prev => prev.map(goal =>
            goal.id === itemId ? { ...goal, categoryId: newCategoryId } : goal
        ));

        // Update planning items in localStorage
        try {
            const planningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
            const updatedItems = planningItems.map(item =>
                item.id === itemId ? { ...item, categoryId: newCategoryId } : item
            );
            localStorage.setItem('budgetCalc_planningItems', JSON.stringify(updatedItems));

            // Update active budget allocations
            const activeBudgetAllocations = JSON.parse(localStorage.getItem('budgetCalc_activeBudgetAllocations') || '[]');
            const updatedAllocations = activeBudgetAllocations.map(allocation =>
                allocation.planningItemId === itemId ? { ...allocation, categoryId: newCategoryId } : allocation
            );
            localStorage.setItem('budgetCalc_activeBudgetAllocations', JSON.stringify(updatedAllocations));
        } catch (error) {
            console.error('Error moving item:', error);
        }
    };

    // Toggle category collapse
    const handleToggleCategoryCollapse = (categoryId) => {
        setCategories(prev => prev.map(category =>
            category.id === categoryId ? { ...category, collapsed: !category.collapsed } : category
        ));
    };

    // Streamlined tabs
    const tabs = [
        { id: 'budget', label: 'Budget', icon: Calculator },
        { id: 'transactions', label: 'Transactions', icon: DollarSign },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'config', label: 'Config', icon: Settings }
    ];

    const calculateToBeAllocated = () => {
        // Total money in all accounts
        const totalAccountBalance = accounts.reduce((total, account) => {
            return total + (account.balance || 0);
        }, 0);

        // Total money already allocated to categories
        const totalAllocated = categories.reduce((total, category) => {
            return total + (category.allocated || 0);
        }, 0);

        // Money available to allocate = Account balances - Already allocated
        const toBeAllocated = totalAccountBalance - totalAllocated;

        return {
            totalAccountBalance,
            totalAllocated,
            toBeAllocated: Math.max(0, toBeAllocated) // Never negative
        };
    };
    const allocationData = calculateToBeAllocated();

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen transition-colors duration-200 bg-page text-page">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-theme-primary">Budgie 🦜</h1>
                            <p className="text-theme-secondary">
                                Your unified budget companion
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            <ThemeSelector
                                currentTheme={currentTheme}
                                setCurrentTheme={setCurrentTheme}
                            />

                            <div className="bg-theme-secondary px-4 py-2 rounded-lg">
                                <div className="text-xs text-theme-tertiary">To Be Allocated</div>
                                <div className="font-bold text-green-600">
                                    ${allocationData.toBeAllocated.toFixed(2)}
                                </div>
                            </div>

                            {/* Planning/Funding Mode Toggle (only show on budget tab) */}
                            {activeTab === 'budget' && (
                                <button
                                    onClick={() => setViewMode(viewMode === 'planning' ? 'funding' : 'planning')}
                                    className={`btn-secondary p-2 rounded-lg flex items-center space-x-2 ${viewMode === 'funding' ? 'btn-success' : ''}`}
                                >
                                    {viewMode === 'planning' ? <Target className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                    <span className="text-sm hidden sm:inline">
                                        {viewMode === 'planning' ? 'Plan' : 'Fund'}
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
                        allocationData={allocationData}
                    />

                    {/* Accounts Section (keeping existing) */}
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

                    {/* Streamlined Tab Navigation */}
                    <div className="border-b border-theme-secondary mb-8">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
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
                                    onClick={() => setShowAddCategory(true)}
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
                                    expenses={expenses}
                                    savingsGoals={savingsGoals}
                                    payFrequency={payFrequency}
                                    payFrequencyOptions={payFrequencyOptions}
                                    onAddItem={handleAddItem}
                                    onEditItem={setEditingItem}
                                    onDeleteItem={(item) => setConfirmDelete({
                                        type: item.type === 'savings-goal' ? 'goal' : 'expense',
                                        id: item.id,
                                        name: item.name,
                                        message: `Delete "${item.name}"?`,
                                    })}
                                    onToggleItemActive={handleToggleItemActive}
                                    onEditCategory={setEditingCategory}
                                    onDeleteCategory={(cat) => setConfirmDelete({
                                        type: 'category',
                                        id: cat.id,
                                        name: cat.name,
                                        message: `Delete "${cat.name}"? All items will be moved to the first category.`,
                                    })}
                                    onAddCategory={() => setShowAddCategory(true)}
                                    onMoveItem={handleMoveItem}
                                    onToggleCollapse={handleToggleCategoryCollapse}
                                />
                            ) : (
                                <div className="space-y-6">
                                    <ImprovedFundingMode
                                        categories={categories}
                                        currentPay={currentPay}
                                        onFundCategory={handleFundCategory}
                                        paySchedule={paySchedule}

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
                                                <EnhancedCategoryCard
                                                    key={category.id}
                                                    category={category}
                                                    viewMode={viewMode}
                                                    onFund={handleFundCategory}
                                                    onEditCategory={setEditingCategory}
                                                    onDeleteCategory={(cat) => setConfirmDelete({
                                                        type: 'category',
                                                        id: cat.id,
                                                        name: cat.name,
                                                        message: `Delete "${cat.name}"? All items will be moved to the first category.`,
                                                    })}
                                                    onAddItem={handleAddItem}
                                                    onEditItem={setEditingItem}
                                                    onDeleteItem={(item) => setConfirmDelete({
                                                        type: item.type === 'savings-goal' ? 'goal' : 'expense',
                                                        id: item.id,
                                                        name: item.name,
                                                        message: `Delete "${item.name}"?`,
                                                    })}
                                                    onToggleItemActive={handleToggleItemActive}
                                                    onToggleCollapse={handleToggleCategoryCollapse}
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


                            {/* Existing Configuration Panel */}
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
                                payFrequency={payFrequency}
                                setPayFrequency={setPayFrequency}
                                payFrequencyOptions={payFrequencyOptions}

                            />
                        </div>
                    )}

                    {/* NEW: Unified Item Modal */}
                    {showAddItem && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">
                                    {editingItem ? 'Edit Item' : 'Add Budget Item'}
                                </h3>
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
                                    currentPay={currentPay}
                                    preselectedCategory={preselectedCategory}
                                />
                            </div>
                        </div>
                    )}

                    {editingItem && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Item</h3>
                                <UnifiedItemForm
                                    item={editingItem}
                                    onSave={handleSaveItem}
                                    onCancel={() => setEditingItem(null)}
                                    categories={categories}
                                    accounts={accounts}
                                    currentPay={currentPay}
                                />
                            </div>
                        </div>
                    )}

                    {/* Keep existing modals */}
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

                    {/* Keep other existing modals... (AddAccount, AddTransaction, etc.) */}
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

                    {/* Edit Account Modal */}
                    {editingAccount && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Account</h3>
                                <AddAccountForm
                                    account={editingAccount}  // Pass the account being edited
                                    onSave={(accountData) => {
                                        // Update the existing account
                                        setAccounts(prev => prev.map(account =>
                                            account.id === editingAccount.id
                                                ? { ...account, ...accountData }
                                                : account
                                        ));
                                        setEditingAccount(null);
                                    }}
                                    onCancel={() => setEditingAccount(null)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Add Transaction Modal */}
                    {showAddTransaction && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Add New Transaction</h3>
                                <AddTransactionForm
                                    onSave={(transactionData) => {
                                        const newTransaction = {
                                            ...transactionData,
                                            id: Math.max(...transactions.map(t => t.id), 0) + 1,
                                            createdAt: new Date().toISOString()
                                        };
                                        setTransactions(prev => [...prev, newTransaction]);

                                        // Update account balance
                                        setAccounts(prev => prev.map(account =>
                                            account.id === newTransaction.accountId
                                                ? { ...account, balance: (account.balance || 0) + newTransaction.amount }
                                                : account
                                        ));

                                        setShowAddTransaction(false);
                                    }}
                                    onCancel={() => setShowAddTransaction(false)}
                                    accounts={accounts}
                                    categories={categories}
                                />
                            </div>
                        </div>
                    )}

                    {/* Edit Transaction Modal */}
                    {editingTransaction && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-theme-primary p-6 rounded-lg w-96 border border-theme-primary">
                                <h3 className="text-lg font-semibold mb-4 text-theme-primary">Edit Transaction</h3>
                                <AddTransactionForm
                                    transaction={editingTransaction}  // Pass the transaction being edited
                                    onSave={(transactionData) => {
                                        // First, reverse the effects of the old transaction
                                        const oldTransaction = editingTransaction;

                                        // Reverse old transaction effects on account
                                        setAccounts(prev => prev.map(account => {
                                            if (account.id === oldTransaction.accountId) {
                                                return {
                                                    ...account,
                                                    balance: (account.balance || 0) - oldTransaction.amount
                                                };
                                            }
                                            if (oldTransaction.transferAccountId && account.id === oldTransaction.transferAccountId) {
                                                return {
                                                    ...account,
                                                    balance: (account.balance || 0) + oldTransaction.amount
                                                };
                                            }
                                            return account;
                                        }));

                                        // Update the transaction
                                        const updatedTransaction = {
                                            ...oldTransaction,
                                            ...transactionData,
                                            lastModified: new Date().toISOString()
                                        };

                                        setTransactions(prev => prev.map(txn =>
                                            txn.id === editingTransaction.id ? updatedTransaction : txn
                                        ));

                                        // Apply new transaction effects on account
                                        setAccounts(prev => prev.map(account => {
                                            if (account.id === updatedTransaction.accountId) {
                                                return {
                                                    ...account,
                                                    balance: (account.balance || 0) + updatedTransaction.amount
                                                };
                                            }
                                            if (updatedTransaction.transferAccountId && account.id === updatedTransaction.transferAccountId) {
                                                return {
                                                    ...account,
                                                    balance: (account.balance || 0) - updatedTransaction.amount
                                                };
                                            }
                                            return account;
                                        }));

                                        // Update category spending if it's an expense
                                        if (updatedTransaction.categoryId && updatedTransaction.amount < 0) {
                                            setCategories(prev => prev.map(category =>
                                                category.id === updatedTransaction.categoryId
                                                    ? {
                                                        ...category,
                                                        spent: (category.spent || 0) + Math.abs(updatedTransaction.amount)
                                                    }
                                                    : category
                                            ));
                                        }

                                        setEditingTransaction(null);
                                    }}
                                    onCancel={() => setEditingTransaction(null)}
                                    accounts={accounts}
                                    categories={categories}
                                />
                            </div>
                        </div>
                    )}

                    {/* Continue with existing transaction modal and confirm delete... */}
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