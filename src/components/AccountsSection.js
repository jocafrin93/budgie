import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AccountsSection = ({
    accounts,
    onAddAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    return (
        <div className="bg-theme-primary rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center text-theme-primary">
                    🏦 <span className="ml-2">Accounts</span>
                </h2>
                <button
                    onClick={onAddAccount}
                    className="btn-theme-primary px-3 py-2 rounded text-sm flex items-center"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => (
                    <div
                        key={account.id}
                        className="p-4 rounded border border-theme-primary bg-theme-secondary"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="font-medium text-theme-primary">{account.name}</div>
                                <div className="text-sm text-theme-tertiary capitalize">
                                    {account.type} • {account.bankName}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-semibold ${account.type === 'credit'
                                    ? account.balance < 0
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                    : account.balance >= 0
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                    }`}>
                                    ${Math.abs(account.balance).toFixed(2)}
                                </div>
                                <div className="text-xs text-theme-tertiary">
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
                                    className="btn-secondary p-1 rounded"
                                    title="Edit account"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onDeleteAccount(account)}
                                    className="btn-danger p-1 rounded"
                                    title="Delete account"
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