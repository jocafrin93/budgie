import { Page } from "components/shared/Page";
import AccountsManagement from "../../../../components/budget/AccountsManagement";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

export default function BudgetAccounts() {
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

    // Map the existing hook functions to the component's expected props
    const handleAddAccount = (accountData) => {
        // Map the new component's account structure to the existing hook's structure
        const mappedAccount = {
            name: accountData.name,
            type: accountData.type,
            // Use startingBalance instead of balance for new reconciliation system
            balance: accountData.startingBalance || 0,
            startingBalance: accountData.startingBalance || 0,
            startingBalanceDate: accountData.startingBalanceDate,
            color: accountData.color || 'bg-blue-500',
            isDefault: accounts.length === 0, // First account becomes default
            // Additional fields that the new component supports
            institution: accountData.institution,
            accountNumber: accountData.accountNumber,
            isActive: accountData.isActive ?? true,
            notes: accountData.notes,
            // Reconciliation fields
            lastReconciledDate: accountData.lastReconciledDate,
            lastReconciledBalance: accountData.lastReconciledBalance || 0,
            isReconciling: accountData.isReconciling || false
        };

        return addAccount(mappedAccount);
    };

    const handleEditAccount = (updatedAccount) => {
        // Map the component's account structure to the hook's expected structure
        const mappedAccount = {
            name: updatedAccount.name,
            type: updatedAccount.type,
            balance: updatedAccount.startingBalance || updatedAccount.balance || 0,
            startingBalance: updatedAccount.startingBalance || updatedAccount.balance || 0,
            startingBalanceDate: updatedAccount.startingBalanceDate,
            color: updatedAccount.color || 'bg-blue-500',
            isDefault: updatedAccount.isDefault ?? false,
            institution: updatedAccount.institution,
            accountNumber: updatedAccount.accountNumber,
            isActive: updatedAccount.isActive ?? true,
            notes: updatedAccount.notes,
            // Preserve reconciliation fields
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

    // New reconciliation handler
    const handleReconcileAccount = (accountId, bankBalance) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
            // Update account with reconciliation data
            updateAccount(accountId, {
                ...account,
                lastReconciledDate: new Date().toISOString().split('T')[0], // Today's date
                lastReconciledBalance: bankBalance,
                isReconciling: false
            });

            console.log("Account reconciled:", accountId, "Bank balance:", bankBalance);
        }
    };

    // Map the hook's account structure to what the component expects
    const mappedAccounts = accounts.map(account => ({
        ...account,
        isActive: account.isActive ?? true, // Default to true if not set
        institution: account.institution || '',
        accountNumber: account.accountNumber || '',
        notes: account.notes || '',
        // Ensure reconciliation fields are present
        startingBalance: account.startingBalance || account.balance || 0,
        startingBalanceDate: account.startingBalanceDate || new Date().toISOString().split('T')[0],
        lastReconciledDate: account.lastReconciledDate || null,
        lastReconciledBalance: account.lastReconciledBalance || 0,
        isReconciling: account.isReconciling || false
    }));

    return (
        <Page title="Accounts">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <AccountsManagement
                    accounts={mappedAccounts}
                    transactions={transactions}
                    onAddAccount={handleAddAccount}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onToggleAccountActive={handleToggleAccountActive}
                    onReconcileAccount={handleReconcileAccount}
                />
            </div>
        </Page>
    );
}
