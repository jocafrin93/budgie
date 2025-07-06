import { Badge, Button } from 'components/ui';
import { useState } from 'react';
import { TbChevronDown, TbChevronRight, TbCreditCard, TbPigMoney, TbWallet } from 'react-icons/tb';

// Account Balance Sidebar Component
export default function AccountBalanceSidebar({
    accounts = [],
    transactions = [],
    selectedAccountId = null,
    onAccountSelect,
    onReconcileAccount,
    className = ''
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Get account type icon
    const getAccountTypeIcon = (type) => {
        switch (type) {
            case 'checking':
            case 'savings':
                return <TbWallet className="size-4" />;
            case 'credit':
                return <TbCreditCard className="size-4" />;
            case 'investment':
                return <TbPigMoney className="size-4" />;
            default:
                return <TbWallet className="size-4" />;
        }
    };

    // Calculate account balances
    const calculateAccountBalances = (account) => {
        if (!account) return { workingBalance: 0, clearedBalance: 0, pendingBalance: 0 };

        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const startingBalance = account.startingBalance || account.balance || 0;

        const workingBalance = startingBalance + accountTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const clearedBalance = startingBalance + accountTransactions
            .filter(t => t.isCleared)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingBalance = workingBalance - clearedBalance;

        return { workingBalance, clearedBalance, pendingBalance };
    };

    // Get reconciliation status
    const getReconciliationStatus = (account) => {
        if (!account.lastReconciledDate) {
            return {
                status: 'never',
                message: 'Never reconciled',
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800',
                indicator: '🔴'
            };
        }

        const lastReconciled = new Date(account.lastReconciledDate);
        const now = new Date();
        const daysDiff = Math.floor((now - lastReconciled) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3) {
            return {
                status: 'recent',
                message: `${daysDiff === 0 ? 'Today' : `${daysDiff}d ago`}`,
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
                borderColor: 'border-green-200 dark:border-green-800',
                indicator: '🟢'
            };
        } else if (daysDiff <= 7) {
            return {
                status: 'warning',
                message: `${daysDiff}d ago`,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                borderColor: 'border-yellow-200 dark:border-yellow-800',
                indicator: '🟡'
            };
        } else if (daysDiff <= 14) {
            return {
                status: 'overdue',
                message: `${daysDiff}d ago`,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                borderColor: 'border-orange-200 dark:border-orange-800',
                indicator: '🟠'
            };
        } else {
            return {
                status: 'critical',
                message: `${daysDiff}d ago`,
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
                borderColor: 'border-red-200 dark:border-red-800',
                indicator: '🔴'
            };
        }
    };

    // Calculate total balances
    const totalWorkingBalance = accounts.reduce((sum, account) => {
        const balances = calculateAccountBalances(account);
        return sum + balances.workingBalance;
    }, 0);

    const activeAccounts = accounts.filter(account => account.isActive !== false);

    return (
        <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TbWallet className="size-5 text-gray-600 dark:text-gray-400" />
                        {!isCollapsed && (
                            <h3 className="font-semibold text-gray-900 dark:text-white">Accounts</h3>
                        )}
                    </div>
                    <Button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        variant="flat"
                        size="sm"
                        isIcon
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        {isCollapsed ? <TbChevronRight className="size-4" /> : <TbChevronDown className="size-4" />}
                    </Button>
                </div>

                {/* Total Balance - Always visible */}
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                        <div className={`text-lg font-bold ${totalWorkingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalWorkingBalance)}
                        </div>
                        {!isCollapsed && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Total Working Balance
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Account List */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto">
                    {/* All Accounts Option */}
                    <button
                        onClick={() => onAccountSelect('all')}
                        className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 transition-colors ${selectedAccountId === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                    <TbWallet className="size-4 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">All Accounts</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {transactions.length} transactions
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Individual Accounts */}
                    {activeAccounts.map((account) => {
                        const balances = calculateAccountBalances(account);
                        const reconcileStatus = getReconciliationStatus(account);
                        const accountTransactions = transactions.filter(t => t.accountId === account.id);
                        const isSelected = selectedAccountId === account.id;

                        return (
                            <div key={account.id} className="border-b border-gray-100 dark:border-gray-600">
                                <button
                                    onClick={() => onAccountSelect(account.id)}
                                    className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                                {getAccountTypeIcon(account.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                                    {account.name}
                                                </div>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <div className={`text-sm font-medium ${balances.workingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(balances.workingBalance)}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {reconcileStatus.indicator}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {accountTransactions.length} transactions
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Account Details - Show when selected */}
                                {isSelected && (
                                    <div className="px-3 pb-3 bg-blue-50 dark:bg-blue-900/10">
                                        {/* Balance Breakdown */}
                                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                                <div className="text-green-600 font-medium">
                                                    {formatCurrency(balances.clearedBalance)}
                                                </div>
                                                <div className="text-gray-500">Cleared</div>
                                            </div>
                                            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                                                <div className="text-yellow-600 font-medium">
                                                    {formatCurrency(balances.pendingBalance)}
                                                </div>
                                                <div className="text-gray-500">Pending</div>
                                            </div>
                                        </div>

                                        {/* Reconciliation Status */}
                                        <div className={`text-xs px-2 py-1 rounded text-center mb-2 ${reconcileStatus.bgColor} ${reconcileStatus.borderColor} border`}>
                                            <span className={reconcileStatus.color}>
                                                Last: {reconcileStatus.message}
                                            </span>
                                        </div>

                                        {/* Quick Reconcile Button */}
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReconcileAccount(account);
                                            }}
                                            variant="filled"
                                            size="xs"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                                        >
                                            ⚖️ Reconcile
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {activeAccounts.length === 0 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <TbWallet className="size-8 mx-auto mb-2 opacity-50" />
                            <div className="text-sm">No active accounts</div>
                        </div>
                    )}
                </div>
            )}

            {/* Collapsed State - Show account count */}
            {isCollapsed && (
                <div className="p-2">
                    <div className="text-center">
                        <Badge variant="secondary" className="text-xs">
                            {activeAccounts.length}
                        </Badge>
                    </div>
                </div>
            )}
        </div>
    );
}
