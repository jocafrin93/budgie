// utils/dataMigration.js
// Converts existing budget data to new three-layer structure

/**
 * Migrates existing budget data to the new three-layer architecture
 * @param {Object} existingData - Current app data structure
 * @returns {Object} New three-layer data structure
 */
export const migrateToThreeLayer = (existingData) => {
    const {
        categories = [],
        expenses = [],
        savingsGoals = [],
        accounts = [],
        transactions = [],
        paySchedule = {}
    } = existingData;

    console.log('Starting migration to three-layer structure...');

    // ===========================================
    // LAYER 1: PLANNING ITEMS
    // ===========================================
    const planningItems = [];
    let nextPlanningId = 1;

    // Convert expenses to planning items
    expenses.forEach((expense, index) => {
        planningItems.push({
            id: nextPlanningId++,
            name: expense.name,
            type: "expense",
            amount: expense.amount,
            frequency: expense.frequency || "monthly",

            // Planning state - if it was paused, make it inactive
            isActive: !expense.allocationPaused && expense.priorityState === 'active',
            priority: expense.priority || "medium",
            notes: "",

            // Organization
            categoryId: expense.categoryId,
            sortOrder: index + 1,

            // Additional expense fields
            dueDate: expense.dueDate || null,
            accountId: expense.accountID || expense.accountId || null,
            isRecurring: expense.isRecurringExpense || true,

            // Metadata
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),

            // Keep original ID for reference during migration
            originalExpenseId: expense.id
        });
    });

    // Convert savings goals to planning items
    savingsGoals.forEach((goal, index) => {
        planningItems.push({
            id: nextPlanningId++,
            name: goal.name,
            type: "savings-goal",
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate,

            // Planning state
            isActive: !goal.allocationPaused && goal.priorityState === 'active',
            priority: "medium", // Goals are generally medium priority
            notes: "",

            // Organization
            categoryId: goal.categoryId,
            sortOrder: expenses.filter(e => e.categoryId === goal.categoryId).length + index + 1,

            // Additional goal fields
            monthlyContribution: goal.monthlyContribution || 0,
            alreadySaved: goal.alreadySaved || 0,
            accountId: goal.accountId || null,

            // Metadata
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),

            // Keep original ID for reference
            originalGoalId: goal.id
        });
    });

    // ===========================================
    // LAYER 2: ACTIVE BUDGET ALLOCATIONS
    // ===========================================
    const activeBudgetAllocations = [];
    let nextAllocationId = 1;

    // Create allocations for active planning items
    planningItems
        .filter(item => item.isActive)
        .forEach(item => {
            let monthlyAllocation = 0;

            if (item.type === "expense") {
                // Calculate monthly amount based on frequency
                const frequencyMap = {
                    'weekly': item.amount * 4.33,
                    'bi-weekly': item.amount * 2.17,
                    'every-3-weeks': item.amount * 1.44,
                    'monthly': item.amount,
                    'every-6-weeks': item.amount * 0.72,
                    'every-7-weeks': item.amount * 0.62,
                    'every-8-weeks': item.amount * 0.54,
                    'quarterly': item.amount / 3,
                    'annually': item.amount / 12,
                    'per-paycheck': item.amount * 2.17 // Assuming bi-weekly pay
                };
                monthlyAllocation = frequencyMap[item.frequency] || item.amount;
            } else if (item.type === "savings-goal") {
                monthlyAllocation = item.monthlyContribution || 0;

                // If no monthly contribution set, calculate based on target date
                if (monthlyAllocation === 0 && item.targetDate && item.targetAmount) {
                    const monthsUntilTarget = calculateMonthsUntilDate(item.targetDate);
                    const remainingAmount = item.targetAmount - (item.alreadySaved || 0);
                    monthlyAllocation = Math.max(0, remainingAmount / monthsUntilTarget);
                }
            }

            // Calculate per-paycheck amount (assuming bi-weekly pay for now)
            const payFrequency = paySchedule.frequency || 'bi-weekly';
            const paychecksPerMonth = payFrequency === 'bi-weekly' ? 2.17 :
                payFrequency === 'weekly' ? 4.33 :
                    payFrequency === 'monthly' ? 1 : 2.17;

            const perPaycheckAmount = monthlyAllocation / paychecksPerMonth;

            activeBudgetAllocations.push({
                id: nextAllocationId++,
                planningItemId: item.id,
                categoryId: item.categoryId,

                // Funding details
                monthlyAllocation: Math.round(monthlyAllocation * 100) / 100,
                perPaycheckAmount: Math.round(perPaycheckAmount * 100) / 100,

                // Account routing
                sourceAccountId: item.accountId || (accounts[0]?.id) || 1,

                // Timeline
                startDate: new Date().toISOString().split('T')[0],
                endDate: item.targetDate || null,

                // Status
                isPaused: false,
                pauseReason: null,

                // Metadata
                createdAt: new Date().toISOString(),
                lastFunded: null
            });
        });

    // ===========================================
    // LAYER 3: CATEGORY ENVELOPES
    // ===========================================
    const categoryEnvelopes = categories.map((category, index) => ({
        id: category.id,
        name: category.name,
        color: category.color,

        // Real money tracking (preserve existing allocated/spent if available)
        totalAllocated: category.allocated || 0,
        totalSpent: category.spent || 0,
        currentBalance: (category.allocated || 0) - (category.spent || 0),

        // Funding history
        lastFunded: category.lastFunded || null,
        lastFundedAmount: 0,

        // Organization & DnD
        sortOrder: index + 1,
        isCollapsed: category.collapsed || false,

        // Goals & limits
        targetBalance: category.targetBalance || 0,

        // Auto-funding rules (preserve existing settings)
        autoFunding: {
            enabled: category.autoFunding?.enabled || false,
            maxPerPaycheck: category.autoFunding?.maxAmount || 500,
            priority: category.autoFunding?.priority || "medium"
        }
    }));

    // ===========================================
    // MIGRATE TRANSACTIONS
    // ===========================================
    const migratedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        description: transaction.description || transaction.name || "",

        // Category assignment
        categoryId: transaction.categoryId || null,
        planningItemId: null, // Could be enhanced to link to specific planning items

        // Account info
        accountId: transaction.accountId,
        transferAccountId: transaction.transferAccountId || null,

        // Transaction type
        type: transaction.isIncome ? "income" :
            transaction.transfer ? "transfer" :
                transaction.amount > 0 ? "income" : "expense",
        isReconciled: transaction.isReconciled || false,

        // Additional fields
        isTransfer: transaction.transfer || false,

        // Metadata
        createdAt: transaction.createdAt || new Date().toISOString(),
        importedFrom: null
    }));

    // ===========================================
    // RETURN MIGRATED DATA
    // ===========================================
    const migratedData = {
        planningItems,
        activeBudgetAllocations,
        categoryEnvelopes,
        transactions: migratedTransactions,
        accounts, // Keep accounts as-is
        paySchedule, // Keep pay schedule as-is

        // Migration metadata
        migrationDate: new Date().toISOString(),
        originalDataBackup: existingData, // Keep backup for safety
        migrationVersion: "1.0"
    };

    console.log('Migration completed!');
    console.log(`Created ${planningItems.length} planning items`);
    console.log(`Created ${activeBudgetAllocations.length} active budget allocations`);
    console.log(`Migrated ${categoryEnvelopes.length} category envelopes`);
    console.log(`Migrated ${migratedTransactions.length} transactions`);

    return migratedData;
};

/**
 * Helper function to calculate months between now and target date
 */
const calculateMonthsUntilDate = (targetDate) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
    return Math.max(1, Math.ceil(diffMonths)); // At least 1 month
};

/**
 * Validates the migrated data structure
 */
export const validateMigratedData = (migratedData) => {
    const {
        planningItems,
        activeBudgetAllocations,
        categoryEnvelopes
    } = migratedData;

    const issues = [];

    // Check that all planning items have valid categories
    planningItems.forEach(item => {
        if (!categoryEnvelopes.find(cat => cat.id === item.categoryId)) {
            issues.push(`Planning item "${item.name}" references non-existent category ${item.categoryId}`);
        }
    });

    // Check that all allocations reference valid planning items
    activeBudgetAllocations.forEach(allocation => {
        if (!planningItems.find(item => item.id === allocation.planningItemId)) {
            issues.push(`Budget allocation ${allocation.id} references non-existent planning item ${allocation.planningItemId}`);
        }
    });

    // Check for reasonable amounts
    activeBudgetAllocations.forEach(allocation => {
        if (allocation.monthlyAllocation < 0 || allocation.monthlyAllocation > 10000) {
            issues.push(`Budget allocation ${allocation.id} has suspicious monthly amount: $${allocation.monthlyAllocation}`);
        }
    });

    return {
        isValid: issues.length === 0,
        issues
    };
};

/**
 * Creates a summary of the migration
 */
export const getMigrationSummary = (originalData, migratedData) => {
    return {
        original: {
            categories: originalData.categories?.length || 0,
            expenses: originalData.expenses?.length || 0,
            savingsGoals: originalData.savingsGoals?.length || 0,
            transactions: originalData.transactions?.length || 0
        },
        migrated: {
            planningItems: migratedData.planningItems?.length || 0,
            activeBudgetAllocations: migratedData.activeBudgetAllocations?.length || 0,
            categoryEnvelopes: migratedData.categoryEnvelopes?.length || 0,
            transactions: migratedData.transactions?.length || 0
        },
        validation: validateMigratedData(migratedData)
    };
};