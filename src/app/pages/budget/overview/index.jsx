import { Page } from "components/shared/Page";
import SimplifiedSummaryCards from "../../../../components/budget/SimplifiedSummaryCards";
import UnifiedEnvelopeBudgetView from "../../../../components/budget/UnifiedEnvelopeBudgetView";

export default function BudgetOverview() {
    // Get breakpoint context for responsive rendering
    const { mdAndDown } = useBreakpointsContext();
    // Modal state for category form
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Modal state for item form
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [preselectedCategory, setPreselectedCategory] = useState(null);

    // Quick Allocate Modal state
    const [quickAllocateModal, setQuickAllocateModal] = useState({ isOpen: false });

    // Monthly budget navigator state
    const [currentBudgetMonth, setCurrentBudgetMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Get accounts data from the hook
    const { accounts } = useAccountManagement();

    // Use paycheck management hook with safe fallback
    const paycheckHookResult = usePaycheckManagement(accounts || []);
    const {
        getPaychecksInDateRange,
        getUpcomingPaycheckDatesForAccount,
        getTodayLocal,
        getAllUpcomingPaycheckDates
    } = paycheckHookResult || {};

    // Category management hook
    const {
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        migrateCategoriesWithTypes,
        setCategories
    } = useCategoryManagement();

    // Category groups management hook
    const {
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        reorderGroups,
        toggleGroupCollapsed,
        getSortedGroups
    } = useCategoryGroups();

    // Use transaction management hook properly (same as transactions page)
    const {
        transactions
    } = useTransactionManagement(accounts, () => { }, categories, setCategories);

    // Helper function to calculate spent amount for a category from transactions
    const calculateCategorySpent = useCallback((categoryId) => {
        if (!transactions || !Array.isArray(transactions)) return 0;

        return transactions.reduce((total, transaction) => {
            // Only count expense transactions (negative amounts) for this category
            if (transaction.categoryId === categoryId && transaction.amount < 0) {
                return total + Math.abs(transaction.amount);
            }

            // Handle split transactions
            if (transaction.isSplit && transaction.splits) {
                const categorySpent = transaction.splits
                    .filter(split => split.categoryId === categoryId && split.amount < 0)
                    .reduce((sum, split) => sum + Math.abs(split.amount), 0);
                return total + categorySpent;
            }

            return total;
        }, 0);
    }, [transactions]);

    // Data model hook for planning items - simplified to prevent infinite loops
    const {
        planningItems,
        addItem,
        updateItem,
        removeItem,
        toggleItemActive
    } = useDataModel({
        initialCategories: [],
        initialAccounts: []
    });

    // Envelope budgeting hook - now using real transactions
    useEnvelopeBudgeting({
        categories,
        planningItems,
        transactions: transactions || [],
        accounts: accounts || []
    });

    // Monthly budgeting hook - use direct import
    const monthlyBudgetingHook = useMonthlyBudgeting(categories, transactions);
    const {
        getMonthData,
        getAvailableMonths: getMonthlyAvailableMonths,
        carryForwardFromPreviousMonth,
        initializeMonth
    } = monthlyBudgetingHook;

    // Initialize current month on component mount
    useEffect(() => {
        initializeMonth(currentBudgetMonth);
    }, [currentBudgetMonth, initializeMonth]);

    // Migrate categories to include type field if needed
    useEffect(() => {
        migrateCategoriesWithTypes(planningItems);
    }, [migrateCategoriesWithTypes, planningItems]);

    // Initialize sortOrder for existing categories that don't have it
    useEffect(() => {
        const needsSortOrderInit = categories.some(cat => typeof cat.sortOrder !== 'number');

        if (needsSortOrderInit) {
            console.log('🔄 Initializing sortOrder for existing categories');
            categories.forEach((category, index) => {
                if (typeof category.sortOrder !== 'number') {
                    console.log(`🔄 Setting sortOrder ${index} for category ${category.name}`);
                    updateCategory(category.id, { sortOrder: index });
                }
            });
        }
    }, [categories, updateCategory]);

    // Conservative paycheck info (from EnhancedBudgetTable)
    const getConservativePaycheckInfo = useCallback((payFreq) => {
        switch (payFreq) {
            case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
            case 'biweekly':
            case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
            case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
            case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
            default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        }
    }, []);

    // Helper function to calculate monthly amount based on frequency
    // This is used for recurring expenses without specific due dates
    const calculateMonthlyAmount = useCallback((amount, frequency) => {
        const multipliers = {
            'daily': 30.44,
            'weekly': 4.33,
            'bi-weekly': 2.17,
            'every-2-weeks': 2.17,
            'monthly': 1,
            'quarterly': 1 / 3,
            'semi-annually': 1 / 6,
            'annually': 1 / 12,
            'every-6-weeks': 52 / 6 / 12,  // ~0.72 times per month
            'every-7-weeks': 52 / 7 / 12,  // ~0.62 times per month
            'every-8-weeks': 52 / 8 / 12,  // ~0.54 times per month
            'every-3-months': 1 / 3,       // Fixed: was 4, should be 1/3
            'every-6-months': 1 / 6,       // Fixed: was 2, should be 1/6
            'yearly': 1 / 12
        };
        return amount * (multipliers[frequency] || 1);
    }, []);

    // Helper function to calculate paychecks until due date using account-specific paycheck schedule
    const calculatePaychecksUntilDue = useCallback((dueDate, accountId) => {
        if (!dueDate) return null;

        try {
            // Check if paycheck management functions are available
            if (getTodayLocal && getUpcomingPaycheckDatesForAccount && accounts) {
                // If accountId is provided, get paychecks only for that specific account
                if (accountId) {
                    const account = accounts.find(acc => acc.id === accountId);
                    if (account) {
                        // Calculate months ahead needed to cover the due date
                        const today = new Date();
                        const due = new Date(dueDate);
                        const monthsAhead = Math.ceil((due - today) / (1000 * 60 * 60 * 24 * 30)) + 1;

                        // Get paychecks specifically for this account
                        const accountPaychecks = getUpcomingPaycheckDatesForAccount(accountId, monthsAhead);

                        console.log(`🔍 PAYCHECK DEBUG for account ${account.name}:`, {
                            accountId,
                            dueDate,
                            monthsAhead,
                            totalAccountPaychecks: accountPaychecks.length,
                            accountPaycheckDates: accountPaychecks.map(p => p.formattedDate || p.date)
                        });

                        // Filter to only include paychecks before or on the due date
                        const paychecksUntilDue = accountPaychecks.filter(paycheck => {
                            const paycheckDate = new Date(paycheck.date);
                            const isBeforeDue = paycheckDate <= due;
                            console.log(`🔍 Paycheck ${paycheck.formattedDate || paycheck.date}: ${isBeforeDue ? 'INCLUDED' : 'EXCLUDED'} (due: ${dueDate})`);
                            return isBeforeDue;
                        });

                        console.log(`🔍 FINAL RESULT for account ${account.name}: ${paychecksUntilDue.length} paychecks until ${dueDate}`);
                        console.log(`🔍 Included paycheck dates:`, paychecksUntilDue.map(p => p.formattedDate || p.date));

                        return paychecksUntilDue.length;
                    }
                }

                // Fallback to all paychecks if no specific account
                const paychecksInRange = getPaychecksInDateRange(getTodayLocal(), dueDate);
                console.log(`Calculating all paychecks until ${dueDate}:`, paychecksInRange.length);
                return paychecksInRange.length;
            } else {
                console.warn('Paycheck management functions not available, using fallback calculation');
                throw new Error('Paycheck functions not available');
            }
        } catch (error) {
            console.error('Error calculating paychecks until due:', error);
            // Fallback to old calculation
            const due = new Date(dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 0) return 0;
            return Math.ceil(daysUntilDue / 14); // Assuming bi-weekly pay
        }
    }, [getTodayLocal, getPaychecksInDateRange, getUpcomingPaycheckDatesForAccount, accounts]);

    // Helper function to calculate smart per-paycheck amount based on current allocation progress
    const calculateSmartPerPaycheck = useCallback((monthlyTarget, currentlyAllocated) => {
        const paycheckInfo = getConservativePaycheckInfo('bi-weekly');
        const remainingNeeded = Math.max(0, monthlyTarget - currentlyAllocated);

        // For now, use simple division by conservative paycheck count
        // TODO: Could be enhanced to consider actual remaining paychecks in current period
        return remainingNeeded / paycheckInfo.conservative;
    }, [getConservativePaycheckInfo]);

    // Transform data for the budget table
    const transformDataForBudgetTable = useCallback((categories = [], planningItems = []) => {
        // Sort categories by sortOrder first, then by ID for consistent ordering
        const sortedCategories = [...categories].sort((a, b) => {
            // If both have sortOrder, use that
            if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
                return a.sortOrder - b.sortOrder;
            }
            // If only one has sortOrder, prioritize it
            if (typeof a.sortOrder === 'number') return -1;
            if (typeof b.sortOrder === 'number') return 1;
            // If neither has sortOrder, sort by ID
            return a.id - b.id;
        });

        return sortedCategories.map((category, index) => {
            let monthlyNeed = 0;
            let subItems = [];
            let categoryDueDate = null;

            if (category.type === 'single') {
                // For single categories, use the category's own data
                if (category.planningType === 'expense') {
                    // NEW LOGIC: If amount exists but no due date, interpret as "per paycheck"
                    if (category.amount && !category.dueDate) {
                        // Amount without due date = per paycheck amount
                        // Convert to monthly by multiplying by conservative paycheck count (2 for bi-weekly)
                        const paycheckInfo = getConservativePaycheckInfo('bi-weekly');
                        monthlyNeed = (category.amount || 0) * paycheckInfo.conservative;
                    } else {
                        // Use frequency-based calculation for monthly amount (existing logic)
                        monthlyNeed = calculateMonthlyAmount(
                            category.amount || 0,
                            category.frequency || 'monthly'
                        );
                    }
                    categoryDueDate = category.dueDate || null;
                } else if (category.planningType === 'goal') {
                    // For goals, use monthly contribution
                    monthlyNeed = category.monthlyContribution || 0;
                }

                // Single categories don't have sub-items, they are self-contained
                subItems = [];
            } else {
                // For multiple categories, get planning items for this category
                const categoryItems = planningItems.filter(item =>
                    item.categoryId === category.id // Show ALL items (active and inactive)
                );

                // Calculate totals for the category from planning items (only active items)
                monthlyNeed = categoryItems.reduce((sum, item) => {
                    // Only include active items in calculations
                    if (item.isActive === false) return sum;

                    if (item.type === 'savings-goal') {
                        return sum + (item.monthlyContribution || 0);
                    } else {
                        // For expenses, use simple frequency-based calculation (static reference)
                        return sum + calculateMonthlyAmount(
                            item.amount || 0,
                            item.frequency || 'monthly'
                        );
                    }
                }, 0);

                // Transform sub-items
                subItems = categoryItems.map(item => {
                    const monthlyNeed = item.type === 'savings-goal'
                        ? (item.monthlyContribution || 0)
                        : calculateMonthlyAmount(item.amount || 0, item.frequency || 'monthly');

                    // Debug the accountId being passed
                    console.log(`🔍 ITEM ACCOUNT DEBUG for ${item.name}:`, {
                        itemAccountId: item.accountId,
                        itemAccountIdType: typeof item.accountId,
                        itemData: item
                    });

                    const paychecksUntilDue = item.dueDate ? calculatePaychecksUntilDue(item.dueDate, item.accountId) : null;

                    // Calculate per paycheck based on due date if available
                    let perPaycheck;
                    const paycheckInfo = getConservativePaycheckInfo('bi-weekly');

                    if (item.dueDate && paychecksUntilDue > 0) {
                        // For items with due dates, calculate based on total amount needed divided by paychecks remaining
                        const totalAmountNeeded = item.type === 'savings-goal'
                            ? (item.monthlyContribution || 0)
                            : (item.amount || 0);
                        perPaycheck = totalAmountNeeded / paychecksUntilDue;

                        console.log(`💰 Per-paycheck calculation for ${item.name}:`, {
                            totalAmountNeeded,
                            paychecksUntilDue,
                            perPaycheck,
                            itemType: item.type,
                            dueDate: item.dueDate
                        });
                    } else {
                        // For items without due dates, use conservative approach (2 paychecks per month for bi-weekly)
                        perPaycheck = monthlyNeed / paycheckInfo.conservative;
                    }

                    return {
                        id: item.id,
                        parentId: category.id,
                        name: item.name,
                        amount: item.amount || (item.type === 'savings-goal' ? item.monthlyContribution : 0),
                        frequency: item.frequency || 'monthly',
                        monthlyNeed,
                        perPaycheck,
                        allocated: item.allocated || 0,
                        spent: 0, // TODO: Calculate from transactions
                        available: (item.allocated || 0) - 0, // allocated - spent
                        dueDate: item.dueDate || null,
                        paychecksUntilDue,
                        isSubItem: true,
                        isActive: item.isActive !== false, // Default to true only if undefined, preserve false
                        type: item.type
                    };
                });
            }

            // Calculate smart per-paycheck amount based on current allocation progress
            const allocated = category.allocated || 0;
            let perPaycheck;

            // NEW LOGIC: If this is a single expense category with amount but no due date, use the amount directly as per-paycheck
            if (category.type === 'single' && category.planningType === 'expense' && category.amount && !category.dueDate) {
                perPaycheck = category.amount; // Amount is already per-paycheck
            } else {
                perPaycheck = calculateSmartPerPaycheck(monthlyNeed, allocated);
            }

            // Calculate actual spent amount from transactions
            const actualSpent = calculateCategorySpent(category.id);
            const available = allocated - actualSpent;

            return {
                id: category.id,
                name: category.name,
                type: category.type || 'multiple',
                planningType: category.planningType, // Pass through planning type for single categories
                accountId: category.accountId, // Pass through account ID for paycheck calculations
                groupId: category.groupId, // CRITICAL: Pass through groupId for group organization
                monthlyNeed,
                perPaycheck,
                allocated,
                spent: actualSpent,
                available,
                dueDate: categoryDueDate,
                color: category.color || 'bg-primary-500',
                isActive: category.isActive !== false, // Default to true if not specified
                isParent: true,
                subItems,
                // Goal-specific properties
                targetAmount: category.targetAmount,
                targetDate: category.targetDate,
                perPaycheckContribution: category.monthlyContribution, // Map monthlyContribution to perPaycheckContribution
                alreadySaved: category.alreadySaved,
                // Expense-specific properties
                amount: category.amount,
                frequency: category.frequency,
                isRecurring: category.isRecurring,
                // CRITICAL: Preserve sortOrder field for drag & drop functionality
                // Initialize sortOrder if not present (for existing categories)
                sortOrder: typeof category.sortOrder === 'number' ? category.sortOrder : index
            };
        });
    }, [calculatePaychecksUntilDue, getConservativePaycheckInfo, calculateMonthlyAmount, calculateCategorySpent, calculateSmartPerPaycheck]);

    // Transform the real data for the table
    const tableData = useMemo(() =>
        transformDataForBudgetTable(categories, planningItems),
        [categories, planningItems, transformDataForBudgetTable]
    );

    // Modal handlers
    const handleCloseCategoryModal = useCallback(() => {
        setShowCategoryModal(false);
        setEditingCategory(null);
    }, []);

    const handleCloseItemModal = useCallback(() => {
        setShowItemModal(false);
        setEditingItem(null);
        setPreselectedCategory(null);
    }, []);

    // Use scheduled transactions hook properly for cloud storage compatibility
    useScheduledTransactions();

    // Handler functions for the table
    const handleAddCategory = useCallback(() => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    }, []);

    const handleSaveCategory = useCallback((categoryData, addAnother = false) => {
        try {
            if (editingCategory) {
                // Update existing category
                updateCategory(editingCategory.id, {
                    name: categoryData.name,
                    type: categoryData.type,
                    color: categoryData.color,
                    status: categoryData.status,
                    priority: categoryData.priority,
                    description: categoryData.description,
                    autoFunding: categoryData.autoFunding,
                    accountId: categoryData.accountId,
                    groupId: categoryData.groupId, // Include groupId
                    isActive: categoryData.status === 'active',
                    // Include planning data for single categories
                    planningType: categoryData.planningType,
                    amount: categoryData.amount,
                    frequency: categoryData.frequency,
                    dueDate: categoryData.dueDate,
                    isRecurring: categoryData.isRecurring,
                    targetAmount: categoryData.targetAmount,
                    targetDate: categoryData.targetDate,
                    monthlyContribution: categoryData.monthlyContribution,
                    alreadySaved: categoryData.alreadySaved
                });

                // For single categories, remove any existing planning items since they shouldn't exist
                if (categoryData.type === 'single') {
                    const existingItems = planningItems.filter(item => item.categoryId === editingCategory.id);
                    existingItems.forEach(item => {
                        removeItem(item.id);
                    });
                }
            } else {
                // Add new category - let the category management hook generate the proper ID
                addCategory({
                    name: categoryData.name,
                    type: categoryData.type,
                    color: categoryData.color,
                    status: categoryData.status,
                    priority: categoryData.priority,
                    description: categoryData.description,
                    autoFunding: categoryData.autoFunding,
                    accountId: categoryData.accountId,
                    isActive: categoryData.status === 'active',
                    // Include planning data for single categories
                    planningType: categoryData.planningType,
                    amount: categoryData.amount,
                    frequency: categoryData.frequency,
                    dueDate: categoryData.dueDate,
                    isRecurring: categoryData.isRecurring,
                    targetAmount: categoryData.targetAmount,
                    targetDate: categoryData.targetDate,
                    monthlyContribution: categoryData.monthlyContribution,
                    alreadySaved: categoryData.alreadySaved
                });
            }

            // Close modal if not adding another
            if (!addAnother) {
                handleCloseCategoryModal();
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    }, [editingCategory, addCategory, updateCategory, planningItems, handleCloseCategoryModal, removeItem]);

    const handleEditCategory = useCallback((categoryData) => {
        try {
            // Find the original category from the categories array
            const originalCategory = categories.find(cat => cat.id === categoryData.id);

            // Use the original category data instead of the transformed table data
            const categoryToEdit = originalCategory || categoryData;

            // Set the category to edit and show the modal
            setEditingCategory(categoryToEdit);
            setShowCategoryModal(true);
        } catch (error) {
            console.error("Error editing category:", error);
        }
    }, [categories]);

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
