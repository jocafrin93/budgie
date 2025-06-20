// components/TransactionsTab.js
import { ChevronDown, ChevronUp, Edit2, Plus, Repeat, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const TransactionsTab = ({
    transactions,
    accounts,
    categories,
    darkMode,
    onAddTransaction,
    onEditTransaction,
    onDeleteTransaction
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [accountFilter, setAccountFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    const filteredAndSortedTransactions = transactions
        .filter(transaction => {
            const matchesSearch = transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.memo?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' ||
                (typeFilter === 'income' && transaction.amount > 0) ||
                (typeFilter === 'expense' && transaction.amount < 0) ||
                (typeFilter === 'transfer' && transaction.transfer);
            const matchesAccount = accountFilter === 'all' || transaction.accountId === parseInt(accountFilter);
            return matchesSearch && matchesType && matchesAccount;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.date);
                    bValue = new Date(b.date);
                    break;
                case 'amount':
                    aValue = Math.abs(a.amount);
                    bValue = Math.abs(b.amount);
                    break;
                case 'payee':
                    aValue = a.payee?.toLowerCase() || '';
                    bValue = b.payee?.toLowerCase() || '';
                    break;
                case 'account':
                    aValue = accounts.find(acc => acc.id === a.accountId)?.name || '';
                    bValue = accounts.find(acc => acc.id === b.accountId)?.name || '';
                    break;
                case 'category':
                    aValue = categories.find(cat => cat.id === a.categoryId)?.name || '';
                    bValue = categories.find(cat => cat.id === b.categoryId)?.name || '';
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'desc') {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });

    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'Unknown';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : '';
    };

    const formatAmount = (amount, isTransfer = false) => {
        const absAmount = Math.abs(amount);
        if (isTransfer) {
            return `$${absAmount.toFixed(2)}`;
        }
        return amount >= 0 ? `$${absAmount.toFixed(2)}` : `-$${absAmount.toFixed(2)}`;
    };

    const getAmountColor = (amount, isTransfer = false) => {
        if (isTransfer) return 'text-theme-blue';
        return amount >= 0 ? 'text-theme-green' : 'text-theme-red';
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null;
        return sortOrder === 'desc' ?
            <ChevronDown className="w-4 h-4 inline ml-1" /> :
            <ChevronUp className="w-4 h-4 inline ml-1" />;
    };

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Transactions</h2>
                    <p className={`text-sm text-theme-primary`}>
                        {filteredAndSortedTransactions.length} transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={onAddTransaction}
                    className="bg-blue-600 text-theme-primary px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Transaction</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 rounded-lg bg-theme-secondary">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded border bg-theme-primary border-theme-primary text-theme-primary placeholder-theme-tertiary"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        id="typeFilter"
                        aria-label="Transaction Type"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary"
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expenses</option>
                        <option value="transfer">Transfers</option>
                    </select>

                    {/* Account Filter */}
                    <select
                        id="accountFilter"
                        aria-label="Account Filter"
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('all');
                            setAccountFilter('all');
                        }}
                        className="px-4 py-2 rounded border bg-theme-primary border-theme-primary hover:bg-theme-hover text-theme-primary"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-lg border overflow-hidden border-theme-primary">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium border-b table-header border-theme-primary text-theme-secondary">
                    <button
                        onClick={() => handleSort('date')}
                        className="col-span-2 text-left hover:text-theme-blue flex items-center"
                    >
                        Date <SortIcon column="date" />
                    </button>
                    <button
                        onClick={() => handleSort('payee')}
                        className="col-span-3 text-left hover:text-theme-blue flex items-center"
                    >
                        Payee <SortIcon column="payee" />
                    </button>
                    <button
                        onClick={() => handleSort('category')}
                        className="col-span-2 text-left hover:text-theme-blue flex items-center"
                    >
                        Category <SortIcon column="category" />
                    </button>
                    <button
                        onClick={() => handleSort('account')}
                        className="col-span-2 text-left hover:text-theme-blue flex items-center"
                    >
                        Account <SortIcon column="account" />
                    </button>
                    <button
                        onClick={() => handleSort('amount')}
                        className="col-span-2 text-right hover:text-theme-blue flex items-center justify-end"
                    >
                        Amount <SortIcon column="amount" />
                    </button>
                    <div className="col-span-1 text-center">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-theme-primary">
                    {filteredAndSortedTransactions.length === 0 ? (
                        <div className="text-center py-12 text-theme-secondary">
                            {transactions.length === 0 ? (
                                <>
                                    <p className="text-lg font-medium mb-2">No transactions yet</p>
                                    <p>Add your first transaction to get started!</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg font-medium mb-2">No transactions match your filters</p>
                                    <p>Try adjusting your search or filter criteria</p>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredAndSortedTransactions.map((transaction, index) => {
                            const transferAccount = transaction.transferAccountId
                                ? accounts.find(acc => acc.id === transaction.transferAccountId)
                                : null;

                            return (
                                <div
                                    key={transaction.id}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm transition-colors hover:table-row-hover ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
                                        }`}
                                >
                                    {/* Date */}
                                    <div className="col-span-2 flex items-center text-theme-primary">
                                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                        {transaction.cleared && (
                                            <span className="ml-2 text-theme-green text-xs">✓</span>
                                        )}
                                    </div>

                                    {/* Payee */}
                                    <div className="col-span-3 flex items-center">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-1">
                                                <span className="font-medium truncate text-theme-primary">
                                                    {transaction.transfer
                                                        ? `Transfer to ${transferAccount?.name || 'Unknown'}`
                                                        : transaction.payee || 'Unknown Payee'}
                                                </span>
                                                {transaction.recurring && (
                                                    <Repeat className="w-3 h-3 text-theme-blue flex-shrink-0" title="Recurring" />
                                                )}
                                            </div>
                                            {transaction.memo && (
                                                <div className="text-xs text-theme-tertiary truncate mt-0.5">
                                                    {transaction.memo}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="truncate text-theme-secondary">
                                            {transaction.transfer ? 'Transfer' : getCategoryName(transaction.categoryId) || 'Uncategorized'}
                                        </span>
                                    </div>

                                    {/* Account */}
                                    <div className="col-span-2 flex items-center">
                                        <span className="truncate text-theme-secondary">
                                            {getAccountName(transaction.accountId)}
                                        </span>
                                    </div>

                                    {/* Amount */}
                                    <div className="col-span-2 flex items-center justify-end">
                                        <span className={`font-semibold ${getAmountColor(transaction.amount, transaction.transfer)}`}>
                                            {formatAmount(transaction.amount, transaction.transfer)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex items-center justify-center space-x-1">
                                        <button
                                            onClick={() => onEditTransaction(transaction)}
                                            className="p-1 rounded hover:bg-theme-hover transition-colors text-theme-secondary"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteTransaction({
                                                type: 'transaction',
                                                id: transaction.id,
                                                name: transaction.transfer
                                                    ? `Transfer to ${transferAccount?.name}`
                                                    : transaction.payee,
                                                message: 'Delete this transaction?',
                                            })}
                                            className="p-1 rounded hover:bg-theme-hover text-theme-red transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            {filteredAndSortedTransactions.length > 0 && (
                <div className="p-4 rounded-lg bg-theme-secondary">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-theme-secondary font-medium">Total Income</p>
                            <p className="text-lg font-semibold text-theme-green">
                                ${filteredAndSortedTransactions
                                    .filter(t => t.amount > 0 && !t.transfer)
                                    .reduce((sum, t) => sum + t.amount, 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-theme-secondary font-medium">Total Expenses</p>
                            <p className="text-lg font-semibold text-theme-red">
                                ${filteredAndSortedTransactions
                                    .filter(t => t.amount < 0 && !t.transfer)
                                    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-theme-secondary font-medium">Net Amount</p>
                            <p className={`text-lg font-semibold ${filteredAndSortedTransactions.reduce((sum, t) => sum + (t.transfer ? 0 : t.amount), 0) >= 0
                                ? 'text-theme-green' : 'text-theme-red'
                                }`}>
                                ${filteredAndSortedTransactions
                                    .reduce((sum, t) => sum + (t.transfer ? 0 : t.amount), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTab;
