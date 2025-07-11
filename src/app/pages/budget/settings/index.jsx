import { Page } from "components/shared/Page";
import React from "react";
import PaycheckManager from "../../../../components/budget/PaycheckManager";
import PayeeManagement from "../../../../components/budget/PayeeManagement";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useStorage } from "../../../../hooks/useStorage";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

export default function BudgetSettings() {
    // Use the existing account management hook
    const {
        accounts,
        addAccount,
        updateAccount,
        deleteAccount
    } = useAccountManagement();

    // Use transaction management hook for reconciliation
    const {
        transactions
    } = useTransactionManagement();

    // Use cloud storage for payees - now syncs to Google Drive
    const [payees, setPayees] = useStorage('budgetCalc_payees', [
        'Amazon',
        'Target',
        'Walmart',
        'Starbucks',
        'Shell Gas Station',
        'Electric Company',
        'Water Department',
        'Internet Provider'
    ]);

    const handleAddPayee = (newPayee) => {
        if (newPayee.trim() && !payees.includes(newPayee.trim())) {
            setPayees(prev => [...prev, newPayee.trim()]);
        }
    };

    const handleEditPayee = (oldPayee, newPayee) => {
        if (newPayee.trim() && !payees.includes(newPayee.trim())) {
            setPayees(prev => prev.map(payee => payee === oldPayee ? newPayee.trim() : payee));
        }
    };

    const handleDeletePayee = (payeeToDelete) => {
        setPayees(prev => prev.filter(payee => payee !== payeeToDelete));
    };

    return (
        <Page title="Budget Settings">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                        Budget Settings
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
                        Configure your budget preferences and settings
                    </p>
                </div>

                <div className="mt-6 space-y-8">
                    {/* Cloud Storage Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Cloud Storage & Sync
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Connect with Google Drive to sync your budget data across devices
                            </p>
                        </div>
                        {(() => {
                            const CloudStorageStatus = React.lazy(() => import("../../../../components/budget/CloudStorageStatus"));
                            return (
                                <React.Suspense fallback={<div className="p-4 text-center">Loading cloud storage status...</div>}>
                                    <CloudStorageStatus />
                                </React.Suspense>
                            );
                        })()}
                    </div>

                    {/* Account Management Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Account Management
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Manage your financial accounts, balances, and reconciliation settings
                            </p>
                        </div>

                        {/* Dynamic import for AccountsManagement */}
                        {(() => {
                            const AccountsManagement = React.lazy(() => import("../../../../components/budget/AccountsManagement"));

                            // Map the existing hook functions to the component's expected props
                            const handleAddAccount = (accountData) => {
                                const mappedAccount = {
                                    name: accountData.name,
                                    type: accountData.type,
                                    balance: accountData.startingBalance || 0,
                                    startingBalance: accountData.startingBalance || 0,
                                    startingBalanceDate: accountData.startingBalanceDate,
                                    color: accountData.color || 'bg-primary-500',
                                    isDefault: accounts.length === 0,
                                    institution: accountData.institution,
                                    accountNumber: accountData.accountNumber,
                                    isActive: accountData.isActive ?? true,
                                    notes: accountData.notes,
                                    lastReconciledDate: accountData.lastReconciledDate,
                                    lastReconciledBalance: accountData.lastReconciledBalance || 0,
                                    isReconciling: accountData.isReconciling || false
                                };
                                return addAccount(mappedAccount);
                            };

                            const handleEditAccount = (updatedAccount) => {
                                const mappedAccount = {
                                    name: updatedAccount.name,
                                    type: updatedAccount.type,
                                    balance: updatedAccount.startingBalance || updatedAccount.balance || 0,
                                    startingBalance: updatedAccount.startingBalance || updatedAccount.balance || 0,
                                    startingBalanceDate: updatedAccount.startingBalanceDate,
                                    color: updatedAccount.color || 'bg-primary-500',
                                    isDefault: updatedAccount.isDefault ?? false,
                                    institution: updatedAccount.institution,
                                    accountNumber: updatedAccount.accountNumber,
                                    isActive: updatedAccount.isActive ?? true,
                                    notes: updatedAccount.notes,
                                    lastReconciledDate: updatedAccount.lastReconciledDate,
                                    lastReconciledBalance: updatedAccount.lastReconciledBalance || 0,
                                    isReconciling: updatedAccount.isReconciling || false
                                };
                                updateAccount(updatedAccount.id, mappedAccount);
                            };

                            const handleDeleteAccount = (accountId) => {
                                deleteAccount(accountId);
                            };

                            const handleToggleAccountActive = (accountId) => {
                                const account = accounts.find(acc => acc.id === accountId);
                                if (account) {
                                    updateAccount(accountId, {
                                        ...account,
                                        isActive: !(account.isActive ?? true)
                                    });
                                }
                            };

                            const handleReconcileAccount = (accountId, bankBalance) => {
                                const account = accounts.find(acc => acc.id === accountId);
                                if (account) {
                                    updateAccount(accountId, {
                                        ...account,
                                        lastReconciledDate: new Date().toISOString().split('T')[0],
                                        lastReconciledBalance: bankBalance,
                                        isReconciling: false
                                    });
                                }
                            };

                            // Map the hook's account structure to what the component expects
                            const mappedAccounts = accounts.map(account => ({
                                ...account,
                                isActive: account.isActive ?? true,
                                institution: account.institution || '',
                                accountNumber: account.accountNumber || '',
                                notes: account.notes || '',
                                startingBalance: account.startingBalance || account.balance || 0,
                                startingBalanceDate: account.startingBalanceDate || new Date().toISOString().split('T')[0],
                                lastReconciledDate: account.lastReconciledDate || null,
                                lastReconciledBalance: account.lastReconciledBalance || 0,
                                isReconciling: account.isReconciling || false
                            }));

                            return (
                                <React.Suspense fallback={<div className="p-4 text-center">Loading accounts...</div>}>
                                    <AccountsManagement
                                        accounts={mappedAccounts}
                                        transactions={transactions}
                                        onAddAccount={handleAddAccount}
                                        onEditAccount={handleEditAccount}
                                        onDeleteAccount={handleDeleteAccount}
                                        onToggleAccountActive={handleToggleAccountActive}
                                        onReconcileAccount={handleReconcileAccount}
                                    />
                                </React.Suspense>
                            );
                        })()}
                    </div>

                    {/* Payee Management Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Payee Management
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Manage your list of payees for quick transaction entry
                            </p>
                        </div>
                        <PayeeManagement
                            payees={payees}
                            onAddPayee={handleAddPayee}
                            onEditPayee={handleEditPayee}
                            onDeletePayee={handleDeletePayee}
                        />
                    </div>

                    {/* Paycheck Management Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Paycheck Management
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Configure your paycheck schedule and automatic budget allocation
                            </p>
                        </div>
                        <PaycheckManager
                            accounts={accounts}
                            onStartPaydayWorkflow={() => {
                                // TODO: Implement payday workflow modal
                                console.log('Starting payday workflow...');
                            }}
                        />
                    </div>
                </div>
            </div>
        </Page>
    );
}
