import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AccountsSection = ({
    accounts,
    darkMode,
    onAddAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    return (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 mb-8 shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                    🏦 <span className="ml-2">Accounts</span>
                </h2>
                <button
                    onClick={onAddAccount}
                    className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => (
                    <div
                        key={account.id}
                        className={`p-4 rounded border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="font-medium">{account.name}</div>
                                <div className="text-sm text-gray-500 capitalize">
                                    {account.type} • {account.bankName}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-semibold ${account.type === 'credit'
                                        ? account.balance < 0
                                            ? 'text-red-400'
                                            : 'text-green-400'
                                        : account.balance >= 0
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                    }`}>
                                    ${Math.abs(account.balance).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {account.type === 'credit'
                                        ? account.balance < 0
                                            ? 'owed'
                                            : 'credit'
                                        : 'balance'
                                    }
                                </div>
                            </div>
                            <div className="flex space-x-1 ml-2">
                                <button
                                    onClick={() => onEditAccount(account)}
                                    className="p-1 hover:bg-gray-600 rounded"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onDeleteAccount(account)}
                                    className="p-1 hover:bg-gray-600 rounded text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountsSection;