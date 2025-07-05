import { Page } from "components/shared/Page";

export default function BudgetCalendar() {
    return (
        <Page title="Calendar">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                        Budget Calendar
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mt-1">
                        View your budget timeline and upcoming expenses
                    </p>
                </div>

                <div className="mt-6">
                    <div className="bg-white dark:bg-dark-700 rounded-lg p-6 shadow-sm">
                        <p className="text-gray-600 dark:text-dark-300">
                            CalendarView component will be integrated here.
                        </p>
                    </div>
                </div>
            </div>
        </Page>
    );
}
