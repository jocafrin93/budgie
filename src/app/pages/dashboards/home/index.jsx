import SimplifiedSummaryCards from "components/budget/SimplifiedSummaryCards";
import { Page } from "components/shared/Page";

export default function Home() {
  // Mock data for now - this will be replaced with real data from context
  const mockData = {
    accounts: [
      { id: 1, name: "Checking", balance: 2500, monthlyIncome: 4000 },
      { id: 2, name: "Savings", balance: 5000, monthlyIncome: 0 }
    ],
    categories: [
      { id: 1, name: "Housing", allocated: 1200 },
      { id: 2, name: "Food", allocated: 400 },
      { id: 3, name: "Transportation", allocated: 300 }
    ],
    planningItems: [
      {
        id: 1,
        name: "Emergency Fund",
        type: "savings-goal",
        isActive: true,
        targetAmount: 10000,
        alreadySaved: 5000,
        targetDate: "2024-12-31"
      },
      {
        id: 2,
        name: "Car Insurance",
        type: "expense",
        isActive: true,
        amount: 150,
        alreadySaved: 150,
        dueDate: "2025-01-15"
      }
    ]
  };

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
            accounts={mockData.accounts}
            categories={mockData.categories}
            planningItems={mockData.planningItems}
            className="mb-6"
          />

          {/* Additional dashboard content can go here */}
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
