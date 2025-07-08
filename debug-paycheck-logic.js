// Simple Node.js script to test paycheck logic
// Run with: node debug-paycheck-logic.js

console.log('=== PAYCHECK LOGIC DEBUG ===');

// Mock data based on your configuration
const mockPaychecks = [
    {
        id: 1,
        name: "Check 1",
        frequency: "biweekly",
        startDate: "2025-07-09", // July 9th
        baseAmount: 2000,
        isActive: true,
        accountDistribution: [
            {
                accountId: 1, // Bank A
                amount: 2000,
                distributionType: "fixed",
                distributionValue: 2000
            }
        ]
    },
    {
        id: 2,
        name: "Check 2",
        frequency: "biweekly",
        startDate: "2025-07-11", // July 11th (2-day offset)
        baseAmount: 1500,
        isActive: true,
        accountDistribution: [
            {
                accountId: 2, // Bank B
                amount: 1500,
                distributionType: "fixed",
                distributionValue: 1500
            }
        ]
    }
];

// Mock category with due date July 10th
const mockCategory = {
    id: 1,
    name: "Test Expense",
    dueDate: "2025-07-10",
    accountId: 1, // Initially funded by Bank A
    amount: 100
};

// Simulate the getAllUpcomingPaycheckDates function
function simulateGetAllUpcomingPaycheckDates(numberOfMonths = 3) {
    console.log('\n--- Simulating getAllUpcomingPaycheckDates ---');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + numberOfMonths);

    console.log('Date range:', today.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

    const allDates = [];

    mockPaychecks.filter(p => p.isActive).forEach(paycheck => {
        console.log('Processing paycheck:', paycheck.name);

        // Generate some upcoming dates for this paycheck
        let currentDate = new Date(paycheck.startDate);

        for (let i = 0; i < 10; i++) {
            if (currentDate >= today && currentDate <= endDate) {
                const formattedDate = currentDate.toISOString().split('T')[0];

                allDates.push({
                    date: new Date(currentDate),
                    paycheck: { ...paycheck },
                    formattedDate: formattedDate,
                    daysUntil: Math.ceil((currentDate - today) / (1000 * 60 * 60 * 24))
                });

                console.log(`  Added date: ${formattedDate}, account distribution:`, paycheck.accountDistribution);
            }

            // Move to next paycheck date based on frequency
            switch (paycheck.frequency) {
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'biweekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                default:
                    currentDate.setDate(currentDate.getDate() + 14);
            }
        }
    });

    return allDates.sort((a, b) => a.date - b.date);
}

// Test the calculatePaychecksUntilDue function
function calculatePaychecksUntilDue_Debug(dueDate, upcomingPaychecks = [], accountId = null) {
    console.log('\n--- calculatePaychecksUntilDue Debug ---');
    console.log('Due date:', dueDate);
    console.log('Account ID:', accountId);
    console.log('Upcoming paychecks count:', upcomingPaychecks.length);

    if (!dueDate || !upcomingPaychecks.length) {
        console.log('Early return: no due date or no paychecks');
        return 0;
    }

    // Parse due date safely
    let dueDateObj;
    if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDate.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day);
    } else {
        dueDateObj = new Date(dueDate);
    }
    console.log('Parsed due date:', dueDateObj.toISOString().split('T')[0]);

    // Filter paychecks by account if specified
    let relevantPaychecks = upcomingPaychecks;
    if (accountId !== null) {
        console.log('Filtering by account ID:', accountId);
        relevantPaychecks = upcomingPaychecks.filter(paycheckEntry => {
            if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
                const hasAccount = paycheckEntry.paycheck.accountDistribution.some(dist =>
                    String(dist.accountId) === String(accountId)
                );
                console.log(`  Paycheck ${paycheckEntry.formattedDate}: has account ${accountId}? ${hasAccount}`);
                console.log('    Distribution:', paycheckEntry.paycheck.accountDistribution);
                return hasAccount;
            }
            console.log(`  Paycheck ${paycheckEntry.formattedDate}: no distribution data`);
            return false;
        });
    }
    console.log('Relevant paychecks after filtering:', relevantPaychecks.length);

    // Count paychecks that occur before the due date
    const result = relevantPaychecks.filter(paycheck => {
        const paycheckDate = new Date(paycheck.date);
        const isBeforeDue = paycheckDate < dueDateObj;
        console.log(`  ${paycheck.formattedDate} (${paycheckDate.toISOString().split('T')[0]}) < ${dueDateObj.toISOString().split('T')[0]}? ${isBeforeDue}`);
        return isBeforeDue;
    }).length;

    console.log('Final result:', result);
    return result;
}

// Test with mock data
const upcomingPaychecks = simulateGetAllUpcomingPaycheckDates();
console.log('\nGenerated upcoming paychecks:', upcomingPaychecks.length);

// Test scenarios
console.log('\n=== TESTING SCENARIOS ===');

// Test 1: Category funded by Bank A (should show paychecks left)
console.log('\n--- Test 1: Category funded by Bank A ---');
const result1 = calculatePaychecksUntilDue_Debug(mockCategory.dueDate, upcomingPaychecks, 1);
console.log(`Result for Bank A: ${result1} paychecks`);
if (result1 === 0) {
    console.log('🚨 ISSUE: Showing "Due Now" for Bank A - this might be wrong!');
} else {
    console.log('✅ Showing', result1, 'paychecks left for Bank A');
}

// Test 2: Category funded by Bank B (should show "Due Now")
console.log('\n--- Test 2: Category funded by Bank B ---');
const result2 = calculatePaychecksUntilDue_Debug(mockCategory.dueDate, upcomingPaychecks, 2);
console.log(`Result for Bank B: ${result2} paychecks`);
if (result2 === 0) {
    console.log('✅ Correctly showing "Due Now" for Bank B');
} else {
    console.log('🚨 ISSUE: Should show "Due Now" for Bank B but showing', result2, 'paychecks');
}

console.log('\n=== DEBUG COMPLETE ===');
