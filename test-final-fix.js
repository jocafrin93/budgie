// Test the final timezone fix
console.log('=== FINAL TIMEZONE FIX TEST ===');

// Import the updated function (simulate it)
function calculatePaychecksUntilDue(dueDate, upcomingPaychecks = [], accountId = null) {
    if (!dueDate || !upcomingPaychecks.length) return 0;

    // Parse due date safely to avoid timezone issues - FIXED VERSION
    const parseDateSafely = (dateInput) => {
        if (!dateInput) return null;

        let dateObj;
        if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle YYYY-MM-DD format
            const [year, month, day] = dateInput.split('-').map(Number);
            dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else if (typeof dateInput === 'string' && dateInput.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            // Handle MM/DD/YYYY format
            const [month, day, year] = dateInput.split('/').map(Number);
            dateObj = new Date(year, month - 1, day); // month is 0-indexed
        } else {
            // Fallback to regular Date constructor
            dateObj = new Date(dateInput);
        }

        // Set to start of day to avoid time comparison issues
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    };

    const dueDateObj = parseDateSafely(dueDate);
    if (!dueDateObj) return 0;

    console.log(`Due date parsed as: ${dueDateObj.toDateString()}`);

    // Filter paychecks by account if specified
    let relevantPaychecks = upcomingPaychecks;
    if (accountId !== null) {
        relevantPaychecks = upcomingPaychecks.filter(paycheckEntry => {
            if (paycheckEntry.paycheck && paycheckEntry.paycheck.accountDistribution) {
                return paycheckEntry.paycheck.accountDistribution.some(dist =>
                    String(dist.accountId) === String(accountId)
                );
            }
            return false;
        });
    }

    console.log(`Found ${relevantPaychecks.length} relevant paychecks for account ${accountId}`);

    // Count paychecks that occur before the due date
    const paychecksBeforeDue = relevantPaychecks.filter(paycheck => {
        const paycheckDate = parseDateSafely(paycheck.date);
        const isBefore = paycheckDate && paycheckDate < dueDateObj;
        console.log(`  Paycheck ${paycheck.date} -> ${paycheckDate?.toDateString()} < ${dueDateObj.toDateString()}? ${isBefore}`);
        return isBefore;
    });

    return paychecksBeforeDue.length;
}

// Test with your exact scenario
const mockPaychecks = [
    {
        date: '2025-07-09',
        paycheck: {
            accountDistribution: [{ accountId: 'sofi-id' }]
        }
    },
    {
        date: '2025-07-11',
        paycheck: {
            accountDistribution: [{ accountId: 'main-id' }]
        }
    }
];

console.log('\n--- Your Car Expense Test ---');
console.log('Setup:');
console.log('- SoFi paycheck: July 9, 2025');
console.log('- Main paycheck: July 11, 2025');
console.log('- Car expense: Due July 10, 2025, funded by Main');
console.log('');

// Test the problematic scenario
console.log('Testing Car expense (Main account, due 2025-07-10):');
const result = calculatePaychecksUntilDue('2025-07-10', mockPaychecks, 'main-id');
console.log(`Result: ${result} paychecks`);
console.log(`Expected: 0 paychecks (should show "Due Now")`);
console.log(`Status: ${result === 0 ? '✅ FIXED!' : '❌ Still broken'}`);

console.log('\n--- Verification Test ---');
console.log('Testing SoFi account (should show 1 paycheck):');
const sofiResult = calculatePaychecksUntilDue('2025-07-10', mockPaychecks, 'sofi-id');
console.log(`Result: ${sofiResult} paychecks`);
console.log(`Expected: 1 paycheck (should show "1 paycheck left")`);
console.log(`Status: ${sofiResult === 1 ? '✅ Correct!' : '❌ Wrong'}`);

console.log('\n=== FINAL TEST COMPLETE ===');
console.log('If both tests show ✅, the timezone fix is working correctly!');
