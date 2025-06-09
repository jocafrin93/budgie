import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';


const AddGoalForm = ({
    onSave,
    onCancel,
    categories,
    accounts,
    darkMode,
    goal = null,
    currentPay,
    preselectedCategory,
}) => {
    const [formData, setFormData] = useState({
        name: goal?.name || '',
        targetAmount: goal?.targetAmount || '',
        monthlyContribution: goal?.monthlyContribution || '',
        monthlyPercentage: '',
        inputMode: 'amount',
        targetDate: goal?.targetDate || '',
        categoryId: goal?.categoryId || preselectedCategory || categories[0]?.id || 1,
        alreadySaved: goal?.alreadySaved || 0,
        allocationPaused: goal?.allocationPaused || false,
        priorityState: goal?.priorityState || (goal?.allocationPaused ? 'paused' : 'active'),
        accountId: goal?.accountId || accounts?.[0]?.id || 1,

    });

    useEffect(() => {
        const {
            targetAmount,
            monthlyContribution,
            targetDate,
            monthlyPercentage,
            inputMode,
            alreadySaved,
        } = formData;

        if (inputMode === 'percentage' && monthlyPercentage && !monthlyContribution) {
            const calculatedAmount = (parseFloat(monthlyPercentage) / 100) * currentPay * (12 / 26);
            setFormData(prev => ({ ...prev, monthlyContribution: calculatedAmount.toFixed(2) }));
        } else if (inputMode === 'amount' && monthlyContribution && !monthlyPercentage) {
            const biweeklyAmount = (parseFloat(monthlyContribution) * 12) / 26;
            const calculatedPercentage = (biweeklyAmount / currentPay) * 100;
            setFormData(prev => ({ ...prev, monthlyPercentage: calculatedPercentage.toFixed(2) }));
        }

        const remainingAmount = Math.max(0, (parseFloat(targetAmount) || 0) - (parseFloat(alreadySaved) || 0));

        if (targetDate && targetAmount && !monthlyContribution && !monthlyPercentage && remainingAmount > 0) {
            const today = new Date();
            const target = new Date(targetDate);
            const monthsUntilTarget = Math.max(1, (target - today) / (1000 * 60 * 60 * 24 * 30.44));
            const requiredMonthly = remainingAmount / monthsUntilTarget;

            if (requiredMonthly > 0 && isFinite(requiredMonthly)) {
                setFormData(prev => ({ ...prev, monthlyContribution: requiredMonthly.toFixed(2) }));
            }
        } else if (targetDate && monthlyContribution && !targetAmount) {
            const today = new Date();
            const target = new Date(targetDate);
            const monthsUntilTarget = Math.max(1, (target - today) / (1000 * 60 * 60 * 24 * 30.44));
            const possibleAmount = parseFloat(monthlyContribution) * monthsUntilTarget + (parseFloat(alreadySaved) || 0);

            if (possibleAmount > 0 && isFinite(possibleAmount)) {
                setFormData(prev => ({ ...prev, targetAmount: possibleAmount.toFixed(2) }));
            }
        }
    }, [
        formData.targetAmount,
        formData.monthlyContribution,
        formData.targetDate,
        formData.monthlyPercentage,
        formData.inputMode,
        formData.alreadySaved,
        currentPay,
    ]);

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
        if (
            formData.name &&
            formData.targetAmount &&
            (formData.monthlyContribution || formData.monthlyPercentage) &&
            formData.targetDate
        ) {
            const finalMonthlyContribution =
                formData.inputMode === 'percentage'
                    ? (parseFloat(formData.monthlyPercentage) / 100) * currentPay * (12 / 26)
                    : parseFloat(formData.monthlyContribution);

            onSave(
                {
                    ...formData,
                    targetAmount: parseFloat(formData.targetAmount),
                    monthlyContribution: finalMonthlyContribution,
                    categoryId: parseInt(formData.categoryId),
                    accountId: parseInt(formData.accountId),
                    alreadySaved: parseFloat(formData.alreadySaved) || 0,
                },
                addAnother
            );

            if (addAnother) {
                setFormData({
                    name: '',
                    targetAmount: '',
                    monthlyContribution: '',
                    monthlyPercentage: '',
                    inputMode: formData.inputMode,
                    targetDate: '',
                    categoryId: formData.categoryId,
                    alreadySaved: 0,
                    allocationPaused: false,
                    priorityState: 'active',
                });
                setTimeout(() => {
                    const nameInput = document.querySelector('input[placeholder="Goal name"]');
                    if (nameInput) nameInput.focus();
                }, 100);
            }
        }
    };

    const remainingNeeded = Math.max(0, (parseFloat(formData.targetAmount) || 0) - (parseFloat(formData.alreadySaved) || 0));
    const fundingProgress = formData.targetAmount > 0
        ? ((parseFloat(formData.alreadySaved) || 0) / parseFloat(formData.targetAmount)) * 100
        : 0;

    return (

        <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div>
                <label className="block text-sm font-medium mb-1">Goal Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="a pony, a summer estate, a case of caviar"
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Target Date</label>
                <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                    style={darkMode ? { colorScheme: 'dark' } : {}}
                />
            </div>
            {!formData.dueDate && (
                <div className="p-2 rounded border border-yellow-400 bg-yellow-100">
                    <div className="flex items-center text-sm">
                        <span className="mr-2">⚠️</span>
                        <span className="text-yellow-800">
                            Target date needed for paycheck countdown and timeline features
                        </span>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Target Amount</label>
                    <CurrencyInput
                        value={formData.targetAmount}
                        onChange={(e) =>
                            setFormData(prev => ({
                                ...prev,
                                targetAmount: e.target.value,
                                monthlyContribution: '',
                                monthlyPercentage: '',
                            }))
                        }
                        placeholder="Target amount"
                        darkMode={darkMode}
                    />

                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Monthly Contribution</label>
                    <div className="space-y-2">
                        <div className="flex space-x-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData(prev => ({ ...prev, inputMode: 'amount', monthlyPercentage: '' }))
                                }
                                className={`flex-1 py-1 px-2 rounded text-xs ${formData.inputMode === 'amount'
                                    ? 'bg-blue-600 text-white'
                                    : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                                    }`}
                            >
                                $
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData(prev => ({ ...prev, inputMode: 'percentage', monthlyContribution: '' }))
                                }
                                className={`flex-1 py-1 px-2 rounded text-xs ${formData.inputMode === 'percentage'
                                    ? 'bg-green-600 text-white'
                                    : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                                    }`}
                            >
                                %
                            </button>
                        </div>

                        {formData.inputMode === 'amount' ? (
                            <CurrencyInput
                                value={formData.monthlyContribution}
                                onChange={(e) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        monthlyContribution: e.target.value,
                                        targetAmount: '',
                                        monthlyPercentage: '',
                                    }))
                                }
                                placeholder="Monthly amount"
                                darkMode={darkMode}
                            />
                        ) : (
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.monthlyPercentage}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            monthlyPercentage: e.target.value,
                                            monthlyContribution: '',
                                            targetAmount: '',
                                        }))
                                    }
                                    placeholder="% per paycheck"
                                    className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        }`}
                                />
                                <span className="absolute right-3 top-3 text-gray-400">%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">🎯 Progress Tracking</h4>

                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Already Saved
                    </label>
                    <CurrencyInput
                        value={formData.alreadySaved}
                        onChange={(e) => setFormData(prev => ({ ...prev, alreadySaved: e.target.value }))}
                        placeholder="0.00"
                        darkMode={darkMode}
                        className="text-sm"
                    />
                </div>

                {(parseFloat(formData.targetAmount || 0) > 0) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>
                                Progress: ${parseFloat(formData.alreadySaved || 0).toLocaleString()} / $
                                {parseFloat(formData.targetAmount || 0).toLocaleString()}
                            </span>
                            <span className="font-medium">{fundingProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${fundingProgress >= 100 ? 'bg-green-500' : 'bg-green-400'}`}
                                style={{ width: `${Math.min(100, fundingProgress)}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Remaining needed: ${remainingNeeded.toLocaleString()}
                            {fundingProgress >= 100 && (
                                <span className="text-green-600 dark:text-green-400 font-medium"> ✓ Goal reached!</span>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Priority Status
                    </label>
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
            </div>

            <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
            >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
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
                    Which account will fund this goal?
                </div>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    disabled={
                        !formData.targetAmount ||
                        (!formData.monthlyContribution && !formData.monthlyPercentage) ||
                        !formData.name ||
                        !formData.targetDate
                    }
                >
                    {goal ? 'Update' : 'Add'} Goal
                </button>
                <button
                    onClick={() => handleSubmit(true)}
                    className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                    disabled={
                        !formData.targetAmount ||
                        (!formData.monthlyContribution && !formData.monthlyPercentage) ||
                        !formData.name ||
                        !formData.targetDate
                    }
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

export default AddGoalForm;