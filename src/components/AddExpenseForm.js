import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';

const AddExpenseForm = ({
    onSave,
    onCancel,
    categories,
    accounts,
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
        accountId: expense?.accountId || accounts?.[0]?.id || 1,
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
                accountId: parseInt(formData.accountId),
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
                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                autoFocus
            />

            <div className="space-y-2">
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'amount', percentage: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'amount'
                            ? 'bg-blue-600 text-white'
                            : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                            }`}
                    >
                        $ Amount
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'percentage', amount: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'percentage'
                            ? 'bg-green-600 text-white'
                            : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                            }`}
                    >
                        % of Paycheck
                    </button>
                </div>

                {formData.inputMode === 'amount' ? (
                    <CurrencyInput
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value, percentage: '' }))}
                        placeholder="Amount"
                    />
                ) : (
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={formData.percentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value, amount: '' }))}
                            placeholder="Percentage of paycheck"
                            className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                        />
                        <span className="absolute right-3 top-3 text-theme-tertiary">%</span>
                    </div>
                )}

                {formData.percentage && formData.inputMode === 'percentage' && (
                    <div className="text-xs text-theme-tertiary">
                        ≈ ${((parseFloat(formData.percentage) / 100) * currentPay).toFixed(2)} per paycheck
                    </div>
                )}
                {formData.amount > 0 && formData.inputMode === 'amount' && (
                    <div className="text-xs text-theme-tertiary">
                        ≈ {((parseFloat(formData.amount) / currentPay) * 100).toFixed(1)}% of paycheck
                    </div>
                )}
            </div>

            <select
                name="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
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

            <div className="space-y-3 p-4 bg-theme-secondary rounded border border-theme-primary">
                <h4 className="font-medium text-theme-primary">💰 Funding Status</h4>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-theme-secondary">Already Saved</label>
                        <CurrencyInput
                            value={formData.alreadySaved}
                            onChange={(e) => setFormData(prev => ({ ...prev, alreadySaved: e.target.value }))}
                            placeholder="0.00"
                            className="text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-theme-secondary">Due Date (Optional)</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full p-2 border rounded text-sm bg-theme-primary border-theme-primary text-theme-primary"
                        />
                    </div>
                </div>
                {!formData.dueDate && (
                    <div className="p-3 rounded border border-yellow-400 bg-yellow-100 mt-2">
                        <div className="flex items-center text-sm">
                            <span className="mr-2">⚠️</span>
                            <span className="text-yellow-800">
                                Due date needed for paycheck countdown and timeline features
                            </span>
                        </div>
                    </div>
                )}

                {(parseFloat(formData.amount || 0) > 0) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-theme-secondary">
                            <span>Progress: ${parseFloat(formData.alreadySaved || 0).toFixed(2)} / ${parseFloat(formData.amount || 0).toFixed(2)}</span>
                            <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-theme-tertiary rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${fundingProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, fundingProgress)}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Remaining needed: ${remainingNeeded.toFixed(2)}
                            {fundingProgress >= 100 && <span className="text-green-600 font-medium"> ✓ Fully funded!</span>}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2 text-theme-secondary">Priority Status</label>
                    <div className="flex space-x-1">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'active' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'active'
                                ? 'bg-blue-500 text-white border border-blue-500'
                                : 'border border-theme-primary hover:bg-theme-hover text-theme-secondary'
                                }`}
                        >
                            🟢 Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'paused' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'paused'
                                ? 'bg-blue-500 text-white border border-blue-500'
                                : 'border border-theme-primary hover:bg-theme-hover text-theme-secondary'
                                }`}
                        >
                            ⏸️ Paused
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priorityState: 'complete' }))}
                            className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-colors ${formData.priorityState === 'complete'
                                ? 'bg-blue-500 text-white border border-blue-500'
                                : 'border border-theme-primary hover:bg-theme-hover text-theme-secondary'
                                }`}
                        >
                            ✅ Funded
                        </button>
                    </div>
                    <div className="text-xs text-theme-tertiary mt-2">
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
                    <label htmlFor="recurringExpense" className="text-sm text-theme-secondary">
                        This is a recurring expense
                    </label>
                </div>
            </div>

            <select
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
            >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>

            <div>
                <label className="block text-sm font-medium mb-1 text-theme-primary">Funding Account</label>
                <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountId: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                >
                    {accounts?.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.name} ({account.bankName})
                        </option>
                    ))}
                </select>
                <div className="text-xs text-theme-tertiary mt-1">
                    Which account will this expense be paid from?
                </div>
            </div>

            <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
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
                    className="py-2 px-4 rounded border border-theme-primary text-theme-secondary hover:bg-theme-hover"
                >
                    Cancel
                </button>
            </div>

            <div className="text-xs text-theme-tertiary mt-2">
                💡 Press Enter to save • Shift+Enter to save & add another • Escape to cancel
            </div>
        </div>
    );
};

export default AddExpenseForm;