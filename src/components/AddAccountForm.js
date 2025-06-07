import React, { useState } from 'react';
import CurrencyInput from './CurrencyInput';


const AddAccountForm = ({ onSave, onCancel, darkMode, account = null }) => {
    const [formData, setFormData] = useState({
        name: account?.name || '',
        type: account?.type || 'checking',
        balance: account?.balance || '',
        bankName: account?.bankName || '',
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    const handleSubmit = () => {
        if (formData.name && formData.balance !== '') {
            onSave({
                ...formData,
                balance: parseFloat(formData.balance) || 0,
            });
        }
    };

    return (
        <div className="space-y-4" onKeyDown={handleKeyDown}>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Account name (e.g., 'Main Checking')"
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                autoFocus
            />

            <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
            >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="loan">Loan</option>
            </select>

            <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Bank name (optional)"
                className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
            />
            <CurrencyInput
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="Current balance"
                darkMode={darkMode}
            />

            <div className="flex space-x-2">
                <button
                    onClick={handleSubmit}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
                    disabled={!formData.name || formData.balance === ''}
                >
                    {account ? 'Update' : 'Add'} Account
                </button>
                <button
                    onClick={onCancel}
                    className={`py-2 px-4 rounded border ${darkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default AddAccountForm; 
