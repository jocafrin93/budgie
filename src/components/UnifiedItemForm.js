import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';

const UnifiedItemForm = ({
    onSave,
    onCancel,
    categories,
    accounts,
    item = null,
    currentPay,
    preselectedCategory,
}) => {
    // Detect if we're editing an existing item and determine its type
    const isEditing = !!item;
    const detectedType = item?.targetAmount ? 'goal' : 'expense';

    const [formData, setFormData] = useState({
        name: item?.name || '',
        amount: item?.amount || item?.targetAmount || '',
        percentage: '',
        inputMode: 'amount', // 'amount' or 'percentage'
        frequency: item?.frequency || 'monthly',
        categoryId: item?.categoryId || preselectedCategory || categories[0]?.id || 1,
        priority: item?.priority || 'important',
        alreadySaved: item?.alreadySaved || 0,
        dueDate: item?.dueDate || item?.targetDate || '',
        allocationPaused: item?.allocationPaused || false,
        isRecurringExpense: item?.isRecurringExpense || false,
        priorityState: item?.priorityState || (item?.allocationPaused ? 'paused' : 'active'),
        accountId: item?.accountId || accounts?.[0]?.id || 1,
        type: detectedType, // 'expense' or 'goal'

        // Goal-specific fields
        monthlyContribution: item?.monthlyContribution || '',
        monthlyPercentage: '',
    });

    // Auto-calculate based on input mode and type
    useEffect(() => {
        if (formData.inputMode === 'percentage' && formData.percentage && !formData.amount) {
            if (formData.type === 'expense') {
                const calculatedAmount = (parseFloat(formData.percentage) / 100) * currentPay;
                setFormData(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
            } else if (formData.type === 'goal') {
                const calculatedMonthly = (parseFloat(formData.percentage) / 100) * currentPay * (12 / 26);
                setFormData(prev => ({ ...prev, monthlyContribution: calculatedMonthly.toFixed(2) }));
            }
        } else if (formData.inputMode === 'amount' && formData.amount && !formData.percentage) {
            if (formData.type === 'expense') {
                const calculatedPercentage = (parseFloat(formData.amount) / currentPay) * 100;
                setFormData(prev => ({ ...prev, percentage: calculatedPercentage.toFixed(2) }));
            } else if (formData.type === 'goal' && formData.monthlyContribution) {
                const biweeklyAmount = (parseFloat(formData.monthlyContribution) * 12) / 26;
                const calculatedPercentage = (biweeklyAmount / currentPay) * 100;
                setFormData(prev => ({ ...prev, monthlyPercentage: calculatedPercentage.toFixed(2) }));
            }
        }
    }, [formData.percentage, formData.amount, formData.monthlyContribution, formData.inputMode, formData.type, currentPay]);

    // Auto-calculate goal fields when amount and date are provided
    useEffect(() => {
        if (formData.type === 'goal') {
            const { amount, dueDate, alreadySaved, monthlyContribution } = formData;
            const remainingAmount = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(alreadySaved) || 0));

            if (dueDate && amount && !monthlyContribution && remainingAmount > 0) {
                const today = new Date();
                const target = new Date(dueDate);
                const monthsUntilTarget = Math.max(1, (target - today) / (1000 * 60 * 60 * 24 * 30.44));
                const requiredMonthly = remainingAmount / monthsUntilTarget;

                if (requiredMonthly > 0 && isFinite(requiredMonthly)) {
                    setFormData(prev => ({ ...prev, monthlyContribution: requiredMonthly.toFixed(2) }));
                }
            }
        }
    }, [formData.amount, formData.dueDate, formData.alreadySaved, formData.monthlyContribution, formData.type]);

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
        if (formData.name && formData.amount) {
            const baseData = {
                name: formData.name,
                categoryId: parseInt(formData.categoryId),
                accountId: parseInt(formData.accountId),
                alreadySaved: parseFloat(formData.alreadySaved) || 0,
                priorityState: formData.priorityState,
                allocationPaused: formData.allocationPaused,
            };

            let finalData;

            if (formData.type === 'goal') {
                const finalMonthlyContribution = formData.inputMode === 'percentage'
                    ? (parseFloat(formData.monthlyPercentage) / 100) * currentPay * (12 / 26)
                    : parseFloat(formData.monthlyContribution);

                finalData = {
                    ...baseData,
                    targetAmount: parseFloat(formData.amount),
                    monthlyContribution: finalMonthlyContribution,
                    targetDate: formData.dueDate,
                    type: 'goal'
                };
            } else {
                const finalAmount = formData.inputMode === 'percentage'
                    ? (parseFloat(formData.percentage) / 100) * currentPay
                    : parseFloat(formData.amount);

                finalData = {
                    ...baseData,
                    amount: finalAmount,
                    frequency: formData.frequency,
                    priority: formData.priority,
                    dueDate: formData.dueDate,
                    isRecurringExpense: formData.isRecurringExpense,
                    type: 'expense'
                };
            }

            onSave(finalData, addAnother);

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
                    accountId: formData.accountId,
                    type: formData.type,
                    monthlyContribution: '',
                    monthlyPercentage: '',
                });
                setTimeout(() => {
                    const nameInput = document.querySelector('input[placeholder*="name"]');
                    if (nameInput) nameInput.focus();
                }, 100);
            }
        }
    };

    // Calculate progress for funding status
    const remainingNeeded = Math.max(0, (parseFloat(formData.amount) || 0) - (parseFloat(formData.alreadySaved) || 0));
    const fundingProgress = formData.amount > 0 ? ((parseFloat(formData.alreadySaved) || 0) / parseFloat(formData.amount)) * 100 : 0;

    return (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
            {/* Type Selection - Only show if not editing */}
            {!isEditing && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-theme-primary">What are you adding?</label>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'expense', amount: '', percentage: '' }))}
                            className={`flex-1 py-2 px-4 rounded flex items-center justify-center space-x-2 ${formData.type === 'expense'
                                ? 'btn-primary'
                                : 'btn-secondary'
                                }`}
                        >
                            <span>💸</span>
                            <span>Expense</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'goal', amount: '', percentage: '' }))}
                            className={`flex-1 py-2 px-4 rounded flex items-center justify-center space-x-2 ${formData.type === 'goal'
                                ? 'btn-success'
                                : 'btn-secondary'
                                }`}
                        >
                            <span>🎯</span>
                            <span>Goal</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Name */}
            <div>
                <label className="block text-sm font-medium mb-1 text-theme-primary">
                    {formData.type === 'goal' ? 'Goal Name' : 'Expense Name'}
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={formData.type === 'goal' ? 'Emergency fund, vacation, etc.' : 'Hair coloring, groceries, etc.'}
                    className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                    autoFocus
                />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-theme-primary">
                    {formData.type === 'goal' ? 'Target Amount' : 'Amount'}
                </label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'amount', percentage: '', monthlyPercentage: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'amount'
                            ? 'bg-blue-600 text-white'
                            : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                            }`}
                    >
                        💰 Dollar Amount
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inputMode: 'percentage', amount: '', monthlyContribution: '' }))}
                        className={`flex-1 py-1 px-3 rounded text-sm ${formData.inputMode === 'percentage'
                            ? 'bg-green-600 text-white'
                            : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                            }`}
                    >
                        📊 % of Paycheck
                    </button>
                </div>

                {formData.inputMode === 'amount' ? (
                    <CurrencyInput
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value, percentage: '', monthlyPercentage: '' }))}
                        placeholder={formData.type === 'goal' ? 'Target amount' : 'Expense amount'}
                    />
                ) : (
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={formData.type === 'goal' ? formData.monthlyPercentage : formData.percentage}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [formData.type === 'goal' ? 'monthlyPercentage' : 'percentage']: e.target.value,
                                amount: '',
                                monthlyContribution: ''
                            }))}
                            placeholder="Percentage of paycheck"
                            className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                        />
                        <span className="absolute right-3 top-3 text-theme-tertiary">%</span>
                    </div>
                )}

                {/* Preview calculation */}
                {formData.inputMode === 'percentage' && (
                    <div className="text-xs text-theme-tertiary">
                        {formData.type === 'goal' && formData.monthlyPercentage ? (
                            <>≈ ${((parseFloat(formData.monthlyPercentage) / 100) * currentPay * (12 / 26)).toFixed(2)} per month</>
                        ) : formData.type === 'expense' && formData.percentage ? (
                            <>≈ ${((parseFloat(formData.percentage) / 100) * currentPay).toFixed(2)} per paycheck</>
                        ) : null}
                    </div>
                )}
                {formData.inputMode === 'amount' && formData.amount > 0 && (
                    <div className="text-xs text-theme-tertiary">
                        {formData.type === 'goal' ? (
                            <>≈ {((parseFloat(formData.monthlyContribution || 0) * 26) / (12 * currentPay) * 100).toFixed(1)}% of paycheck per month</>
                        ) : (
                            <>≈ {((parseFloat(formData.amount) / currentPay) * 100).toFixed(1)}% of paycheck</>
                        )}
                    </div>
                )}
            </div>

            {/* Frequency (Expenses only) */}
            {formData.type === 'expense' && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-theme-primary">Frequency</label>
                    <select
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
                </div>
            )}

            {/* Monthly Contribution (Goals only) */}
            {formData.type === 'goal' && formData.inputMode === 'amount' && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-theme-primary">Monthly Contribution</label>
                    <CurrencyInput
                        value={formData.monthlyContribution}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            monthlyContribution: e.target.value,
                            amount: '',
                            monthlyPercentage: ''
                        }))}
                        placeholder="How much per month"
                    />
                    <div className="text-xs text-theme-tertiary mt-1">
                        Auto-calculates if you set target amount and date
                    </div>
                </div>
            )}

            {/* Due Date / Target Date */}
            <div>
                <label className="block text-sm font-medium mb-1 text-theme-primary">
                    {formData.type === 'goal' ? 'Target Date' : 'Due Date'} (Optional)
                </label>
                <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                />
                {!formData.dueDate && (
                    <div className="p-3 rounded border border-yellow-400 bg-yellow-100 mt-2">
                        <div className="flex items-center text-sm">
                            <span className="mr-2">⚠️</span>
                            <span className="text-yellow-800">
                                {formData.type === 'goal' ? 'Target date' : 'Due date'} needed for paycheck countdown and timeline features
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Funding Status Section */}
            <div className="space-y-3 p-4 bg-theme-secondary rounded border border-theme-primary">
                <h4 className="font-medium text-theme-primary">💰 Funding Status</h4>

                <div>
                    <label className="block text-sm font-medium mb-1 text-theme-secondary">Already Saved</label>
                    <CurrencyInput
                        value={formData.alreadySaved}
                        onChange={(e) => setFormData(prev => ({ ...prev, alreadySaved: e.target.value }))}
                        placeholder="0.00"
                        className="text-sm"
                    />
                </div>

                {/* Progress Display */}
                {(parseFloat(formData.amount || 0) > 0) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-theme-secondary">
                            <span>Progress: ${parseFloat(formData.alreadySaved || 0).toFixed(2)} / ${parseFloat(formData.amount || 0).toFixed(2)}</span>
                            <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-theme-tertiary rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${fundingProgress >= 100 ? 'bg-green-500' : formData.type === 'goal' ? 'bg-green-400' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, fundingProgress)}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-theme-secondary">
                            Remaining needed: ${remainingNeeded.toFixed(2)}
                            {fundingProgress >= 100 && (
                                <span className="text-green-600 font-medium"> ✓ {formData.type === 'goal' ? 'Goal reached!' : 'Fully funded!'}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Priority Status */}
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
                            ✅ {formData.type === 'goal' ? 'Complete' : 'Funded'}
                        </button>
                    </div>
                    <div className="text-xs text-theme-tertiary mt-2">
                        Active: Allocate money • Paused: Track only • Complete: {formData.type === 'goal' ? 'Goal reached' : 'Fully funded'}
                    </div>
                </div>

                {/* Recurring checkbox (Expenses only) */}
                {formData.type === 'expense' && (
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
                )}
            </div>

            {/* Category Selection */}
            <div>
                <label className="block text-sm font-medium mb-1 text-theme-primary">Category</label>
                <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                >
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Priority (Expenses only) */}
            {formData.type === 'expense' && (
                <div>
                    <label className="block text-sm font-medium mb-1 text-theme-primary">Priority Level</label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary"
                    >
                        <option value="essential">Essential</option>
                        <option value="important">Important</option>
                        <option value="nice-to-have">Nice to Have</option>
                    </select>
                </div>
            )}

            {/* Funding Account */}
            <div>
                <label className="block text-sm font-medium mb-1 text-theme-primary">Funding Account</label>
                <select
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
                    Which account will {formData.type === 'goal' ? 'fund this goal' : 'this expense be paid from'}?
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
                <button
                    onClick={() => handleSubmit(false)}
                    className={`flex-1 py-2 px-4 rounded font-medium ${formData.type === 'goal' ? 'btn-success' : 'btn-primary'
                        }`}
                    disabled={!formData.name || !formData.amount}
                >
                    {item ? 'Update' : 'Add'} {formData.type === 'goal' ? 'Goal' : 'Expense'}
                </button>
                {!isEditing && (
                    <button
                        onClick={() => handleSubmit(true)}
                        className={`py-2 px-3 rounded font-medium ${formData.type === 'goal' ? 'btn-success' : 'btn-primary'
                            }`}
                        disabled={!formData.name || !formData.amount}
                        title="Save and add another (Shift+Enter)"
                    >
                        +
                    </button>
                )}
                <button
                    onClick={onCancel}
                    className="py-2 px-4 rounded border border-theme-primary text-theme-secondary hover:bg-theme-hover"
                >
                    Cancel
                </button>
            </div>

            <div className="text-xs text-theme-tertiary mt-2">
                💡 Press Enter to save • {!isEditing && 'Shift+Enter to save & add another • '}Escape to cancel
            </div>
        </div>
    );
};

export default UnifiedItemForm;