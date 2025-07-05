import { Page } from "components/shared/Page";
import AccountsManagement from "../../../../components/budget/AccountsManagement";

export default function BudgetAccounts() {
    // Mock data - replace with your actual data hooks/context
    const mockAccounts = [
        {
            id: 1,
            name: "Checking Account",
            type: "checking",
            balance: 2500.00,
            isActive: true,
            institution: "Chase Bank",
            accountNumber: "****1234"
        },
        {
            id: 2,
            name: "Savings Account",
            type: "savings",
            balance: 15000.00,
            isActive: true,
            institution: "Chase Bank",
            accountNumber: "****5678"
        },
        {
            id: 3,
            name: "Credit Card",
            type: "credit",
            balance: -850.00,
            isActive: true,
            institution: "Capital One",
            accountNumber: "****9012"
        }
    ];

    // Mock handlers - replace with your actual functions
    const handleAddAccount = (account) => {
        console.log("Add account:", account);
    };

    const handleEditAccount = (account) => {
        console.log("Edit account:", account);
    };

    const handleDeleteAccount = (accountId) => {
        console.log("Delete account:", accountId);
    };

    const handleToggleAccountActive = (accountId) => {
        console.log("Toggle account active:", accountId);
    };

    const handleUpdateBalance = (accountId, newBalance) => {
        console.log("Update balance:", accountId, newBalance);
    };

    return (
        <Page title="Accounts">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <AccountsManagement
                    accounts={mockAccounts}
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
