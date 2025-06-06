import React, { useState, useEffect } from 'react';

const AddExpenseForm = ({
    onSave,
    onCancel,
    categories,
    darkMode,
    expense = null,
    currentPay,
    preselectedCategory,
}) => {
    const [formData, setFormData] = useState({
        name: expense?.name || '',
        amount: expense?.amount || '',
        percentage: '',
        inputMode: 'amount',
        frequency: expense?.frequency || 'monthly',
        categoryId: expense?.categoryId || preselectedCategory || categories[0]?.id || 1,
        priority: expense?.priority || 'important',
        alreadySaved: expense?.alreadySaved || 0,
        dueDate: expense?.dueDate || '',
        allocationPaused: expense?.allocationPaused || false,
        isRecurringExpense: expense?.isRecurringExpense || false,
        priorityState: expense?.priorityState || (expense?.allocationPaused ? 'paused' : 'active'),
    });

    useEffect(() => {
        if (formData.inputMode === 'percentage' && formData.percentage && !formData.amount) {
            const calculatedAmount = (parseFloat(formData.percentage) / 100) * currentPay;
            setFormData(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
        } else if (formData.inputMode === 'amount' && formData.amount && !formData.percentage) {
            const calculatedPercentage = (parseFloat(formData.amount) / currentPay) * 100;
            setFormData(prev => ({ ...prev, percentage: calculatedPercentage.toFixed(2) }));
        }
    }, [formData.percentage, formData.amount, formData.inputMode, currentPay]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handleSubmit(true);
            } else {
                handleSubmit(false);
            }
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleSubmit = (addAnother = false) => {
        if (formData.name && (formData.amount || formData.percentage)) {
            const finalAmount = formData.inputMode === 'percentage'
                ? (parseFloat(formData.percentage) / 100) * currentPay
                : parseFloat(formData.amount);

            onSave({
                ...formData,
                amount: finalAmount,
                categoryId: parseInt(formData.categoryId),
                alreadySaved: parseFloat(formData.alreadySaved) || 0
            }, addAnother);

            if (addAnother) {
                setFormData({
                    name: '',
                    amount: '',
                    percentage: '',
                    inputMode: formData.inputMode,
                    frequency: formData.frequency,
                    categoryId: formData.categoryId,
                    priority: formData.priority,
                    alreadySaved: 0,
                    dueDate: '',
                    allocationPaused: false,
                    isRecurringExpense: false,
                    priorityState: 'active',
                });
                setTimeout(() => {
                    const nameInput = document.querySelector('input[placeholder="Expense name"]');
                    if (nameInput) nameInput.focus();
                }, 100);
            }
        }
    };

    const remainingNeeded = Math.max(0, (parseFloat(formData.amount) || 0) - (parseFloat(formData.alreadySaved) || 0));
    const fundingProgress = formData.amount > 0 ? ((parseFloat(formData.alreadySaved) || 0) / parseFloat(formData.amount)) * 100 : 0;

    return (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Expense name"
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                autoFocus
            />

            <div className="space-y-2">
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'amount', percentage: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'amount'
                                ? 'bg-blue-600 text-white'
                                : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                            }`}
                    >
                        $ Amount
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'percentage', amount: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'percentage'
                                ? 'bg-green-600 text-white'
                                : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                            }`}
                    >
                        % of Paycheck
                    </button>
                </div>

                {formData.inputMode === 'amount' ? (
                    <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value, percentage: '' }))}
                        placeholder="Amount"
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                ) : (
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={formData.percentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value, amount: '' }))}
                            placeholder="Percentage of paycheck"
                            className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                        <span className="absolute right-3 top-3 text-gray-400">%</span>
                    </div>
                )}

                {formData.percentage && formData.inputMode === 'percentage' && (
                    <div className="text-xs text-gray-500">
                        ≈ ${((parseFloat(formData.percentage) / 100) * currentPay).toFixed(2)} per paycheck
                    </div>
                )}
                {formData.amount && formData.inputMode === 'amount' && (
                    <div className="text-xs text-gray-500">
                        ≈ {((parseFloat(formData.amount) / currentPay) * 100).toFixed(1)}% of paycheck
                    </div>
                )}
            </div>

            <select
                name="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="every-3-weeks">Every 3 weeks</option>
                <option value="monthly">Monthly</option>
                <option value="every-6-weeks">Every 6 weeks</option>
                <option value="every-7-weeks">Every 7 weeks</option>
                <option value="every-8-weeks">Every 8 weeks</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
                <option value="per-paycheck">Per Paycheck (Direct)</option>
            </select>

            <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">💰 Funding Status</h4>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Already Saved</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.alreadySaved}
                            onChange={(e) => setFormData(prev => ({ ...prev, alreadySaved: e.target.value }))}
                            placeholder="0.00"
                            className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Due Date (Optional)</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className={`w-full p-2 border rounded text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                            style={darkMode ? { colorScheme: 'dark' } : {}}
                        />
                    </div>
                </div>

                {formData.amount && formData.alreadySaved > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>Progress: ${parseFloat(formData.alreadySaved || 0).toFixed(2)} / ${parseFloat(formData.amount || 0).toFixed(2)}</span>
                            <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${fundingProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, fundingProgress)}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Remaining needed: ${remainingNeeded.toFixed(2)}
                            {fundingProgress >= 100 && <span className="text-green-600 dark:text-green-400 font-medium"> ✓ Fully funded!</span>}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Priority Status</label>
                    <div className="flex space-x-1">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'active' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'active'
                                    ? 'bg-blue-500 text-white border border-blue-500'
                                    : darkMode
                                        ? 'border border-gray-600 hover:bg-gray-700 text-gray-300'
                                        : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            🟢 Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'paused' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'paused'
                                    ? 'bg-blue-500 text-white border border-blue-500'
                                    : darkMode
                                        ? 'border border-gray-600 hover:bg-gray-700 text-gray-300'
                                        : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            ⏸️ Paused
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'complete' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'complete'
                                    ? 'bg-blue-500 text-white border border-blue-500'
                                    : darkMode
                                        ? 'border border-gray-600 hover:bg-gray-700 text-gray-300'
                                        : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            ✅ Funded
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                        Active: Allocate money • Paused: Track only • Complete: Goal reached
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="recurringExpense"
                        checked={formData.isRecurringExpense}
                        onChange={(e) => setFormData(prev => ({ ...prev, isRecurringExpense: e.target.checked }))}
                        className="mr-2"
                    />
                    <label htmlFor="recurringExpense" className="text-sm text-gray-700 dark:text-gray-300">
                        This is a recurring expense
                    </label>
                </div>
            </div>

            <select
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
                <option value="essential">Essential</option>
                <option value="important">Important</option>
                <option value="nice-to-have">Nice to Have</option>
            </select>

            <div className="flex space-x-2">
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    disabled={!formData.name || (!formData.amount && !formData.percentage)}
                >
                    {expense ? 'Update' : 'Add'} Expense
                </button>
                <button
                    onClick={() => handleSubmit(true)}
                    className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                    disabled={!formData.name || (!formData.amount && !formData.percentage)}
                    title="Save and add another (Shift+Enter)"
                >
                    +
                </button>
                <button
                    onClick={onCancel}
                    className={`py-2 px-4 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
                >
                    Cancel
                </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
                💡 Press Enter to save • Shift+Enter to save & add another • Escape to cancel
            </div>
        </div>
    );
};

export default AddExpenseForm;
