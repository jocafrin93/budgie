import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';

const AddTransactionForm = ({
    onSave,
    onCancel,
    categories,
    accounts,
    darkMode,
    transaction = null,
}) => {
    const [formData, setFormData] = useState({
        date: transaction?.date || new Date().toISOString().split('T')[0],
        payee: transaction?.payee || '',
        amount: transaction?.amount || '',
        categoryId: transaction?.categoryId || categories[0]?.id || 1,
        accountId: transaction?.accountId || accounts[0]?.id || 1,
        memo: transaction?.memo || '',
        cleared: transaction?.cleared || false,
        transfer: transaction?.transfer || false,
        transferAccountId: transaction?.transferAccountId || '',
        isIncome: transaction?.isIncome || false,
    });

    // Determine if this is income based on amount
    const isIncomeTransaction = parseFloat(formData.amount) > 0;

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
        if (formData.date && formData.amount && (formData.payee || formData.transfer)) {
            const transactionData = {
                ...formData,
                amount: parseFloat(formData.amount),
                // Income transactions don't need categories - set to null
                categoryId: formData.transfer ? null : (isIncomeTransaction ? null : parseInt(formData.categoryId)),
                accountId: parseInt(formData.accountId),
                transferAccountId: formData.transfer ? parseInt(formData.transferAccountId) : null,
                isIncome: isIncomeTransaction,
            };

            onSave(transactionData, addAnother);

            if (addAnother) {
                setFormData({
                    date: formData.date,
                    payee: '',
                    amount: '',
                    categoryId: formData.categoryId,
                    accountId: formData.accountId,
                    memo: '',
                    cleared: false,
                    transfer: false,
                    transferAccountId: '',
                    isIncome: false,
                });
                setTimeout(() => {
                    const payeeInput = document.querySelector('input[placeholder="Payee"]');
                    if (payeeInput) payeeInput.focus();
                }, 100);
            }
        }
    };

    return (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                            }`}
                        style={darkMode ? { colorScheme: 'dark' } : {}}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Account</label>
                    <select
                        value={formData.accountId}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                            }`}
                    >
                        {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="transferCheckbox"
                    checked={formData.transfer}
                    onChange={(e) =>
                        setFormData(prev => ({
                            ...prev,
                            transfer: e.target.checked,
                            payee: '',
                            categoryId: categories[0]?.id,
                        }))
                    }
                    className="mr-2"
                />
                <label htmlFor="transferCheckbox" className="text-sm">
                    This is a transfer between accounts
                </label>
            </div>

            {formData.transfer ? (
                <div>
                    <label className="block text-sm font-medium mb-1">Transfer To Account</label>
                    <select
                        value={formData.transferAccountId}
                        onChange={(e) => setFormData(prev => ({ ...prev, transferAccountId: e.target.value }))}
                        className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                            }`}
                    >
                        <option value="">Select account...</option>
                        {accounts
                            .filter(acc => acc.id !== parseInt(formData.accountId))
                            .map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                    </select>
                </div>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-1">Payee</label>
                        <input
                            type="text"
                            value={formData.payee}
                            onChange={(e) => setFormData(prev => ({ ...prev, payee: e.target.value }))}
                            placeholder="Payee (e.g., Employer, Store Name)"
                            className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                                }`}
                            autoFocus={!transaction}
                        />
                    </div>

                    {/* Only show category selection for expenses (negative amounts) */}
                    {!isIncomeTransaction && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                                    }`}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Show income notice for positive amounts */}
                    {isIncomeTransaction && (
                        <div className="p-3 rounded border border-green-400 bg-green-50">
                            <div className="flex items-center text-sm">
                                <span className="mr-2">💰</span>
                                <span className="text-green-800">
                                    <strong>Income Transaction</strong> - This will be added to your account balance and available for allocation to categories.
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <CurrencyInput
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full"
                />
                <div className="text-xs text-theme-tertiary mt-1">
                    {isIncomeTransaction ? (
                        <span className="text-green-600">✓ Income - will be available for allocation</span>
                    ) : parseFloat(formData.amount) < 0 ? (
                        <span className="text-red-600">Expense - will reduce category balance</span>
                    ) : (
                        "Positive amounts = Income, Negative amounts = Expenses"
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Memo (Optional)</label>
                <input
                    type="text"
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    placeholder="Additional details..."
                    className={`w-full p-2 border rounded ${darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
                        }`}
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="clearedCheckbox"
                    checked={formData.cleared}
                    onChange={(e) => setFormData(prev => ({ ...prev, cleared: e.target.checked }))}
                    className="mr-2"
                />
                <label htmlFor="clearedCheckbox" className="text-sm">
                    Cleared/Reconciled
                </label>
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => handleSubmit(false)}
                    className="flex-1 bg-blue-600 text-theme-primary py-2 px-4 rounded hover:bg-blue-700"
                    disabled={!formData.date || !formData.amount || (!formData.payee && !formData.transfer)}
                >
                    {transaction ? 'Update' : 'Add'} Transaction
                </button>
                <button
                    onClick={() => handleSubmit(true)}
                    className="bg-green-600 text-theme-primary py-2 px-3 rounded hover:bg-green-700"
                    disabled={!formData.date || !formData.amount || (!formData.payee && !formData.transfer)}
                    title="Save and add another (Shift+Enter)"
                >
                    +
                </button>
                <button
                    onClick={onCancel}
                    className={`py-2 px-4 rounded border border-theme-primary`}
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

export default AddTransactionForm;