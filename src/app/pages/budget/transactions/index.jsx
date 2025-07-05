import { Page } from "components/shared/Page";
import TransactionsTab from "../../../../components/budget/TransactionsTab";

export default function BudgetTransactions() {
    // Mock data - replace with your actual data hooks/context
    const mockTransactions = [
        {
            id: 1,
            date: "2025-01-05",
            payee: "Grocery Store",
            amount: -85.50,
            categoryId: 1,
            accountId: 1,
            memo: "Weekly groceries",
            isCleared: true
        },
        {
            id: 2,
            date: "2025-01-04",
            payee: "Salary Deposit",
            amount: 2500.00,
            categoryId: null,
            accountId: 1,
            memo: "Bi-weekly salary",
            isCleared: true
        },
        {
            id: 3,
            date: "2025-01-03",
            payee: "Electric Company",
            amount: -120.00,
            categoryId: 2,
            accountId: 1,
            memo: "Monthly electric bill",
            isCleared: false
        }
    ];

    const mockAccounts = [
        { id: 1, name: "Checking Account", balance: 2500.00 },
        { id: 2, name: "Savings Account", balance: 5000.00 },
        { id: 3, name: "Credit Card", balance: -250.00 }
    ];

    const mockCategories = [
        { id: 1, name: "Groceries" },
        { id: 2, name: "Utilities" },
        { id: 3, name: "Entertainment" },
        { id: 4, name: "Transportation" },
        { id: 5, name: "Healthcare" }
    ];

    // Mock handlers - replace with your actual functions
    const handleAddTransaction = (transaction) => {
        console.log("Add transaction:", transaction);
    };

    const handleEditTransaction = (transaction) => {
        console.log("Edit transaction:", transaction);
    };

    const handleDeleteTransaction = (transactionId) => {
        console.log("Delete transaction:", transactionId);
    };

    const handleAccountViewChange = (accountId) => {
        console.log("Change account view to:", accountId);
    };

    return (
        <Page title="Transactions">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <TransactionsTab
                    transactions={mockTransactions}
                    accounts={mockAccounts}
                    categories={mockCategories}
                    onAddTransaction={handleAddTransaction}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onAccountViewChange={handleAccountViewChange}
                    viewAccount="all"
                />
            </div>
        </Page>
    );
}
