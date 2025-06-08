import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const TransactionsSection = ({
    transactions,
    accounts,
    categories,
    darkMode,
    onAddTransaction,
    onShowAllTransactions,
    onEditTransaction,
    onDeleteTransaction,
}) => {
    return (
        <div className={`bg-theme-primary rounded-lg p-4 shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    💳 Recent Transactions
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={onAddTransaction}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Transaction
                    </button>
                    <button
                        onClick={onShowAllTransactions}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700"
                    >
                        View All
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {transactions
                    .slice(-5)
                    .reverse()
                    .map(transaction => {
                        const account = accounts.find(acc => acc.id === transaction.accountId);
                        const category = categories.find(cat => cat.id === transaction.categoryId);
                        const transferAccount = transaction.transferAccountId
                            ? accounts.find(acc => acc.id === transaction.transferAccountId)
                            : null;

                        return (
                            <div
                                key={transaction.id}
                                className={`p-3 rounded border ${darkMode
                                    ? 'border-gray-600 bg-gray-700'
                                    : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center">
                                            <span className="font-medium truncate">
                                                {transaction.transfer
                                                    ? `Transfer to ${transferAccount?.name}`
                                                    : transaction.payee}
                                            </span>
                                            {transaction.cleared && (
                                                <span className="ml-2 text-green-500">✓</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {transaction.date} • {account?.name}{' '}
                                            {category && `• ${category.name}`}
                                        </div>
                                        {transaction.memo && (
                                            <div className="text-xs text-gray-400 truncate">
                                                {transaction.memo}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right ml-2">
                                        <div className="font-semibold">
                                            ${transaction.amount.toFixed(2)}
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => onEditTransaction(transaction)}
                                                className="p-1 hover:bg-black/10 rounded"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteTransaction(transaction)}
                                                className="p-1 hover:bg-black/10 rounded text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                {transactions.length === 0 && (
                    <p className="text-gray-500 text-sm italic text-center py-4">
                        No transactions yet
                    </p>
                )}
            </div>
        </div>
    );
};

export default TransactionsSection; 
