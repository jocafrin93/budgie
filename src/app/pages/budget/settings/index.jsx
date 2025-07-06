import { Page } from "components/shared/Page";
import PayeeManagement from "../../../../components/budget/PayeeManagement";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";

// Import PaycheckManager
import PaycheckManager from "../../../../components/budget/PaycheckManager";

export default function BudgetSettings() {
    // Account management for paycheck configuration
    const { accounts } = useAccountManagement();

    // Use the same payee storage as transactions page
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

                <div className="mt-6 space-y-6">
                    {/* Payee Management Section */}
                    <PayeeManagement
                        payees={payees}
                        onAddPayee={handleAddPayee}
                        onEditPayee={handleEditPayee}
                        onDeletePayee={handleDeletePayee}
                    />

                    {/* Paycheck Management Section */}
                    <PaycheckManager
                        accounts={accounts}
                        onStartPaydayWorkflow={() => {
                            // TODO: Implement payday workflow modal
                            console.log('Starting payday workflow...');
                        }}
                    />
                </div>
            </div>
        </Page>
    );
}
