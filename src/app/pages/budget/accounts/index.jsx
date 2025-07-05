import { Page } from "components/shared/Page";
import AccountsManagement from "../../../../components/budget/AccountsManagement";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";

export default function BudgetAccounts() {
    // Use the existing account management hook
    const {
        accounts,
        addAccount,
        updateAccount,
        deleteAccount
    } = useAccountManagement();

    // Map the existing hook functions to the component's expected props
    const handleAddAccount = (accountData) => {
        // Map the new component's account structure to the existing hook's structure
        const mappedAccount = {
            name: accountData.name,
            type: accountData.type,
            balance: accountData.balance,
            color: accountData.color || 'bg-blue-500',
            isDefault: accounts.length === 0, // First account becomes default
            // Additional fields that the new component supports
            institution: accountData.institution,
            accountNumber: accountData.accountNumber,
            isActive: accountData.isActive ?? true,
            notes: accountData.notes
        };

        return addAccount(mappedAccount);
    };

    const handleEditAccount = (updatedAccount) => {
        // Map the component's account structure to the hook's expected structure
        const mappedAccount = {
            name: updatedAccount.name,
            type: updatedAccount.type,
            balance: updatedAccount.balance,
            color: updatedAccount.color || 'bg-blue-500',
            isDefault: updatedAccount.isDefault ?? false,
            institution: updatedAccount.institution,
            accountNumber: updatedAccount.accountNumber,
            isActive: updatedAccount.isActive ?? true,
            notes: updatedAccount.notes
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

    const handleUpdateBalance = (accountId, newBalance, reason) => {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
            updateAccount(accountId, {
                ...account,
                balance: newBalance
            });
        }
        console.log("Updated balance:", accountId, newBalance, reason);
    };

    // Map the hook's account structure to what the component expects
    const mappedAccounts = accounts.map(account => ({
        ...account,
        isActive: account.isActive ?? true, // Default to true if not set
        institution: account.institution || '',
        accountNumber: account.accountNumber || '',
        notes: account.notes || ''
    }));

    return (
        <Page title="Accounts">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <AccountsManagement
                    accounts={mappedAccounts}
                    onAddAccount={handleAddAccount}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onToggleAccountActive={handleToggleAccountActive}
                    onUpdateBalance={handleUpdateBalance}
                />
            </div>
        </Page>
    );
}
