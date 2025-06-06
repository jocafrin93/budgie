const { useState, useEffect, useMemo } = React;

// Inline utilities (temporarily)
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = React.useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};

const frequencyOptions = [
    { value: "weekly", label: "Weekly", weeksPerYear: 52 },
    { value: "bi-weekly", label: "Bi-weekly", weeksPerYear: 26 },
    { value: "every-3-weeks", label: "Every 3 weeks", weeksPerYear: 17.33 },
    { value: "monthly", label: "Monthly", weeksPerYear: 12 },
    { value: "every-6-weeks", label: "Every 6 weeks", weeksPerYear: 8.67 },
    { value: "every-7-weeks", label: "Every 7 weeks", weeksPerYear: 7.43 },
    { value: "every-8-weeks", label: "Every 8 weeks", weeksPerYear: 6.5 },
    { value: "quarterly", label: "Quarterly", weeksPerYear: 4 },
    { value: "annually", label: "Annually", weeksPerYear: 1 },
    { value: "per-paycheck", label: "Per Paycheck (Direct)", weeksPerYear: 26 },
];

// Inline components (temporarily)
const AddExpenseForm = ({ onSave, onCancel, categories, darkMode, currentPay }) => {
    return (
        <div className="p-4">
            <p>AddExpenseForm placeholder - we'll implement this next</p>
            <div className="flex space-x-2 mt-4">
                <button onClick={() => onSave({}, false)} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Add
                </button>
                <button onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded">
                    Cancel
                </button>
            </div>
        </div>
    );
};

const ConfirmDialog = ({ confirmDelete, onConfirm, onCancel, darkMode }) => {
    if (!confirmDelete) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg w-96`}>
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p className="mb-6">{confirmDelete.message}</p>
                <div className="flex space-x-2">
                    <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 px-4 rounded">
                        Delete
                    </button>
                    <button onClick={onCancel} className="flex-1 bg-gray-600 text-white py-2 px-4 rounded">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// Tab component
const TabButton = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${active
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
    >
        <span>{icon}</span>
        <span>{children}</span>
    </button>
);

// Budget Calculator Tab (your existing functionality)
const BudgetCalculatorTab = ({
    darkMode,
    setDarkMode,
    expenses,
    setExpenses,
    categories,
    setCategories,
    showAddExpense,
    setShowAddExpense,
    confirmDelete,
    setConfirmDelete,
    // ... all your other props
}) => {
    // This will contain most of your current HTML content
    // For now, let's just put a placeholder
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Budget Calculator</h2>
            <p>Your existing calculator functionality will go here...</p>

            {/* Add Expense Modal */}
            {showAddExpense && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto`}>
                        <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
                        <AddExpenseForm
                            onSave={(expenseData, addAnother) => {
                                const newExpense = {
                                    ...expenseData,
                                    id: Math.max(...expenses.map((e) => e.id), 0) + 1,
                                    collapsed: true,
                                };
                                setExpenses((prev) => [...prev, newExpense]);
                                if (!addAnother) setShowAddExpense(false);
                            }}
                            onCancel={() => setShowAddExpense(false)}
                            categories={categories}
                            darkMode={darkMode}
                            currentPay={2800} // We'll make this dynamic later
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Budget Manager Tab (new functionality)
const BudgetManagerTab = ({ darkMode }) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">💰 Budget Manager</h2>
                <div className="text-sm text-gray-500">
                    Real money allocation & tracking
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Paycheck Panel */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <h3 className="text-lg font-semibold mb-4">🎯 This Paycheck</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <span>Available to allocate:</span>
                            <span className="font-bold text-blue-600">$2,800.00</span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active allocations:</span>
                                <span>$2,450.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Remaining:</span>
                                <span className="text-green-600 font-medium">$350.00</span>
                            </div>
                        </div>

                        <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium">
                            💫 Allocate This Paycheck
                        </button>
                    </div>
                </div>

                {/* Category Balances */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                    <h3 className="text-lg font-semibold mb-4">💳 Category Balances</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 border rounded">
                            <div>
                                <div className="font-medium">Emergency Fund</div>
                                <div className="text-sm text-gray-500">Goal: $10,000</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">$3,250</div>
                                <div className="text-xs text-gray-500">32% funded</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 border rounded">
                            <div>
                                <div className="font-medium">Hair coloring</div>
                                <div className="text-sm text-gray-500">Every 6 weeks</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">$120</div>
                                <div className="text-xs text-green-600">Ready!</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-gray-500 italic">
                🚧 Budget Manager features coming soon!
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    const [darkMode, setDarkMode] = useLocalStorage('budgetCalc_darkMode', true);
    const [activeTab, setActiveTab] = useState('calculator');

    // Your existing state
    const [expenses, setExpenses] = useLocalStorage('budgetCalc_expenses', []);
    const [categories, setCategories] = useLocalStorage('budgetCalc_categories', []);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Apply dark mode to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleConfirmDelete = () => {
        // Handle deletions based on type
        setConfirmDelete(null);
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
            }`}>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Budgie 🦜</h1>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Your complete budgeting companion
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                                } transition-colors`}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-8 border-b border-gray-200 dark:border-gray-700">
                    <TabButton
                        active={activeTab === 'calculator'}
                        onClick={() => setActiveTab('calculator')}
                        icon="📊"
                    >
                        Budget Calculator
                    </TabButton>
                    <TabButton
                        active={activeTab === 'manager'}
                        onClick={() => setActiveTab('manager')}
                        icon="💰"
                    >
                        Budget Manager
                    </TabButton>
                </div>

                {/* Tab Content */}
                {activeTab === 'calculator' && (
                    <BudgetCalculatorTab
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        expenses={expenses}
                        setExpenses={setExpenses}
                        categories={categories}
                        setCategories={setCategories}
                        showAddExpense={showAddExpense}
                        setShowAddExpense={setShowAddExpense}
                        confirmDelete={confirmDelete}
                        setConfirmDelete={setConfirmDelete}
                    />
                )}

                {activeTab === 'manager' && (
                    <BudgetManagerTab darkMode={darkMode} />
                )}

                {/* Shared Modals */}
                <ConfirmDialog
                    confirmDelete={confirmDelete}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setConfirmDelete(null)}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
};

export default App;
