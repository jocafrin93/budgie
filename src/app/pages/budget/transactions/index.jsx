import { Page } from "components/shared/Page";
import TransactionsTab from "../../../../components/budget/TransactionsTab";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { useTransactionManagement } from "../../../../hooks/useTransactionManagement";

export default function BudgetTransactions() {
    // Use persistent data management hooks
    const { accounts, setAccounts } = useAccountManagement();
    const { categories, setCategories } = useCategoryManagement();
    const {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    } = useTransactionManagement(accounts, setAccounts, categories, setCategories);

    // Payee management
    const [payees, setPayees] = useLocalStorage('budgetCalc_payees', [
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

    // Handlers for transaction operations
    const handleAddTransaction = (transactionData) => {
        console.log("Raw transaction data received:", transactionData);

        const processedData = {
            ...transactionData,
            accountId: parseInt(transactionData.accountId),
            categoryId: transactionData.categoryId ? parseInt(transactionData.categoryId) : null,
            amount: parseFloat(transactionData.amount) || 0,
            transferAccountId: transactionData.transferAccountId ? parseInt(transactionData.transferAccountId) : undefined
        };

        console.log("Processed transaction:", processedData);
        addTransaction(processedData);
        console.log("Transaction added successfully");
    };

    const handleEditTransaction = (updatedTransaction) => {
        const processedData = {
            ...updatedTransaction,
            accountId: parseInt(updatedTransaction.accountId),
            categoryId: updatedTransaction.categoryId ? parseInt(updatedTransaction.categoryId) : null,
            amount: parseFloat(updatedTransaction.amount) || 0,
            transferAccountId: updatedTransaction.transferAccountId ? parseInt(updatedTransaction.transferAccountId) : undefined
        };

        updateTransaction(updatedTransaction.id, processedData);
        console.log("Updated transaction:", processedData);
    };

    const handleDeleteTransaction = (transactionId) => {
        deleteTransaction(transactionId);
        console.log("Deleted transaction:", transactionId);
    };

    const handleAccountViewChange = (accountId) => {
        console.log("Change account view to:", accountId);
    };

    return (
        <Page title="Transactions">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <TransactionsTab
                    transactions={transactions}
                    accounts={accounts}
                    categories={categories}
                    payees={payees}
                    onAddPayee={handleAddPayee}
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
