import SimplifiedSummaryCards from "components/budget/SimplifiedSummaryCards";
import UpcomingPaychecks from "components/budget/UpcomingPaychecks";
import { Page } from "components/shared/Page";
import { useAccountManagement } from "../../../../hooks/useAccountManagement";
import { useCategoryManagement } from "../../../../hooks/useCategoryManagement";
import { useDataModel } from "../../../../hooks/useDataModel";

export default function Home() {
  // Use real data from hooks instead of mock data
  const { accounts } = useAccountManagement();
  const { categories } = useCategoryManagement();
  const { planningItems } = useDataModel({
    initialCategories: [],
    initialAccounts: [],
    payFrequency: 'bi-weekly'
  });

  // For now, transactions is empty - this will be populated when transaction management is implemented
  const transactions = [];

  return (
    <Page title="Dashboard">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Budget Overview
            </h2>
            <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
              Your financial snapshot at a glance
            </p>
          </div>

          {/* Budget Summary Cards */}
          <SimplifiedSummaryCards
            accounts={accounts || []}
            categories={categories || []}
            planningItems={planningItems || []}
            transactions={transactions}
            className="mb-6"
          />

          {/* Upcoming Paychecks - Payday Functionality */}
          <UpcomingPaychecks
            accounts={accounts || []}
            onStartPaydayWorkflow={(paycheck) => {
              console.log('Starting payday workflow for:', paycheck);
              // This will be implemented with the full payday workflow
            }}
            maxPaychecks={3}
          />

          {/* Additional dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50 mb-4">
                Recent Activity
              </h3>
              <p className="text-gray-600 dark:text-dark-300">
                Recent transactions and budget changes will appear here.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50 mb-4">
                Quick Actions
              </h3>
              <p className="text-gray-600 dark:text-dark-300">
                Quick budget actions and shortcuts will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
