// Test to verify account ID flow in the budget system
// Run with: node test-account-id-flow.js

console.log('=== ACCOUNT ID FLOW TEST ===');

// Simulate the transformDataForBudgetTable function from budget overview
function transformDataForBudgetTable(categories = [], planningItems = []) {
    console.log('\n--- Transform Data Function ---');
    console.log('Input categories:', categories.map(c => ({ id: c.id, name: c.name, accountId: c.accountId })));

    return categories.map(category => {
        console.log(`\nProcessing category: ${category.name}`);
        console.log(`  Original accountId: ${category.accountId}`);

        const transformed = {
            id: category.id,
            name: category.name,
            type: category.type || 'multiple',
            planningType: category.planningType,
            accountId: category.accountId, // ✅ This should be passed through
            monthlyNeed: 100,
            perPaycheck: 50,
            allocated: category.allocated || 0,
            spent: category.spent || 0,
            available: category.available || 0,
            dueDate: category.dueDate,
            color: category.color || 'bg-blue-500',
            isActive: category.isActive !== false,
            isParent: true,
            subItems: []
        };

        console.log(`  Transformed accountId: ${transformed.accountId}`);
        return transformed;
    });
}

// Mock categories with different account IDs
const mockCategories = [
    {
        id: 1,
        name: "Rent",
        type: "single",
        planningType: "expense",
        accountId: 1, // Bank A
        dueDate: "2025-07-10",
        amount: 1200,
        frequency: "monthly"
    },
    {
        id: 2,
        name: "Groceries",
        type: "single",
        planningType: "expense",
        accountId: 2, // Bank B
        dueDate: "2025-07-10",
        amount: 400,
        frequency: "monthly"
    }
];

// Test the transformation
const transformedData = transformDataForBudgetTable(mockCategories);

console.log('\n--- Final Transformed Data ---');
transformedData.forEach(item => {
    console.log(`Category: ${item.name}`);
    console.log(`  ID: ${item.id}`);
    console.log(`  Account ID: ${item.accountId}`);
    console.log(`  Due Date: ${item.dueDate}`);
    console.log(`  Type: ${item.type}`);
    console.log('');
});

// Test the calculatePaychecksUntilDue function with the transformed data
console.log('--- Testing calculatePaychecksUntilDue with transformed data ---');

// Mock upcoming paychecks (same as before)
const mockUpcomingPaychecks = [
    {
        date: new Date('2025-07-09'),
        formattedDate: '2025-07-09',
        paycheck: {
            id: 1,
            name: "Check 1",
            accountDistribution: [{ accountId: 1, amount: 2000 }]
        }
    },
    {
        date: new Date('2025-07-11'),
        formattedDate: '2025-07-11',
        paycheck: {
            id: 2,
            name: "Check 2",
            accountDistribution: [{ accountId: 2, amount: 1500 }]
        }
    }
];

// Import the actual function
function calculatePaychecksUntilDue(dueDate, upcomingPaychecks = [], accountId = null) {
    console.log(`\n  Testing: dueDate=${dueDate}, accountId=${accountId}`);

    if (!dueDate || !upcomingPaychecks.length) return 0;

    // Parse due date safely
    let dueDateObj;
    if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDate.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day);
    } else {
        dueDateObj = new Date(dueDate);
    }

    // Filter paychecks by account if specified
    let relevantPaychecks = upcomingPaychecks;
    if (accountId !== null) {
        console.log(`  Filtering by account ID: ${accountId}`);
        relevantPaychecks = upcomingPaychecks.filter(paycheckEntry => {
            if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
                const hasAccount = paycheckEntry.paycheck.accountDistribution.some(dist =>
                    String(dist.accountId) === String(accountId)
                );
                console.log(`    Paycheck ${paycheckEntry.formattedDate}: has account ${accountId}? ${hasAccount}`);
                return hasAccount;
            }
            return false;
        });
    }

    // Count paychecks that occur before the due date
    const result = relevantPaychecks.filter(paycheck => {
        const paycheckDate = new Date(paycheck.date);
        const isBeforeDue = paycheckDate < dueDateObj;
        console.log(`    ${paycheck.formattedDate} < ${dueDate}? ${isBeforeDue}`);
        return isBeforeDue;
    }).length;

    console.log(`  Result: ${result} paychecks`);
    return result;
}

// Test each transformed category
transformedData.forEach(category => {
    console.log(`\nTesting category: ${category.name}`);
    const result = calculatePaychecksUntilDue(category.dueDate, mockUpcomingPaychecks, category.accountId);

    if (result === 0) {
        console.log(`  ❌ Shows "Due Now" - might be unexpected for ${category.name}`);
    } else {
        console.log(`  ✅ Shows "${result} paychecks left"`);
    }
});

console.log('\n=== TEST COMPLETE ===');
