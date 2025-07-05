import { Page } from "components/shared/Page";
import SimplifiedSummaryCards from "../../../../components/budget/SimplifiedSummaryCards";
import UnifiedEnvelopeBudgetView from "../../../../components/budget/UnifiedEnvelopeBudgetView";

export default function BudgetOverview() {
    // Mock data - replace with your actual data hooks/context
    const mockCategories = [
        { id: 1, name: "Groceries", available: 250.00, allocated: 300.00, type: "single" },
        { id: 2, name: "Utilities", available: 150.00, allocated: 200.00, type: "single" },
        { id: 3, name: "Entertainment", available: 75.00, allocated: 100.00, type: "multiple" }
    ];

    const mockPlanningItems = [
        { id: 1, categoryId: 1, name: "Weekly Groceries", amount: 75, frequency: "weekly", isActive: true },
        { id: 2, categoryId: 2, name: "Electric Bill", amount: 120, frequency: "monthly", isActive: true, dueDate: "2025-01-15" },
        { id: 3, categoryId: 3, name: "Movies", amount: 50, frequency: "monthly", isActive: true }
    ];

    const mockSummaryData = {
        toBeAllocated: 500.00,
        totalIncome: 3000.00,
        totalAllocated: 2500.00,
        totalSpent: 1800.00
    };

    // Mock handlers - replace with your actual functions
    const handleAddCategory = (category) => {
        console.log("Add category:", category);
    };

    const handleEditCategory = (category) => {
        console.log("Edit category:", category);
    };

    const handleDeleteCategory = (categoryId) => {
        console.log("Delete category:", categoryId);
    };

    const handleAddItem = (item) => {
        console.log("Add item:", item);
    };

    const handleEditItem = (item) => {
        console.log("Edit item:", item);
    };

    const handleDeleteItem = (itemId) => {
        console.log("Delete item:", itemId);
    };

    const handleToggleItemActive = (itemId) => {
        console.log("Toggle item active:", itemId);
    };

    const handleToggleCategoryActive = (categoryId) => {
        console.log("Toggle category active:", categoryId);
    };

    const handleMoveItem = (itemId, newCategoryId) => {
        console.log("Move item:", itemId, "to category:", newCategoryId);
    };

    const handleReorderItems = (categoryId, items) => {
        console.log("Reorder items in category:", categoryId, items);
    };

    const handleReorderCategories = (categories) => {
        console.log("Reorder categories:", categories);
    };

    const fundCategory = (categoryId, amount) => {
        console.log("Fund category:", categoryId, "with amount:", amount);
    };

    const transferFunds = (fromId, toId, amount) => {
        console.log("Transfer funds from:", fromId, "to:", toId, "amount:", amount);
    };

    return (
        <Page title="Budget Overview">
            <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
                {/* Summary Cards */}
                <div className="mb-6">
                    <SimplifiedSummaryCards
                        summaryData={mockSummaryData}
                        categories={mockCategories}
                    />
                </div>

                {/* Main Budget View */}
                <UnifiedEnvelopeBudgetView
                    categories={mockCategories}
                    planningItems={mockPlanningItems}
                    toBeAllocated={mockSummaryData.toBeAllocated}
                    fundCategory={fundCategory}
                    transferFunds={transferFunds}
                    onAddCategory={handleAddCategory}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddItem={handleAddItem}
                    onEditItem={handleEditItem}
                    onDeleteItem={handleDeleteItem}
                    onToggleItemActive={handleToggleItemActive}
                    onToggleCategoryActive={handleToggleCategoryActive}
                    onMoveItem={handleMoveItem}
                    onReorderItems={handleReorderItems}
                    onReorderCategories={handleReorderCategories}
                    payFrequency="biweekly"
                    payFrequencyOptions={[
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Bi-weekly" },
                        { value: "monthly", label: "Monthly" }
                    ]}
                    getAllUpcomingPaycheckDates={() => [
                        { date: new Date('2025-01-10') },
                        { date: new Date('2025-01-24') },
                        { date: new Date('2025-02-07') }
                    ]}
                />
            </div>
        </Page>
    );
}
