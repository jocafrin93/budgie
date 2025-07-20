// Test the updated date parsing logic
// This will verify if the timezone fix works correctly

console.log('=== DATE PARSING FIX TEST ===');

// Simulate the updated calculatePaychecksUntilDue function
function calculatePaychecksUntilDue(dueDate, upcomingPaychecks = [], accountId = null) {
    if (!dueDate || !upcomingPaychecks.length) return 0;

    // Parse due date safely to avoid timezone issues
    let dueDateObj;
    if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dueDate.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day); // month is 0-indexed
    } else if (typeof dueDate === 'string' && dueDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // Handle MM/DD/YYYY format
        const [month, day, year] = dueDate.split('/').map(Number);
        dueDateObj = new Date(year, month - 1, day); // month is 0-indexed
    } else {
        dueDateObj = new Date(dueDate);
    }

    // Set to start of day to avoid time comparison issues
    dueDateObj.setHours(0, 0, 0, 0);

    console.log(`Parsed due date: ${dueDateObj.toDateString()} (${dueDateObj.toISOString()})`);

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

    console.log(`Relevant paychecks for account ${accountId}:`, relevantPaychecks.length);

    // Count paychecks that occur before the due date
    const paychecksBeforeDue = relevantPaychecks.filter(paycheck => {
        const paycheckDate = new Date(paycheck.date);
        paycheckDate.setHours(0, 0, 0, 0);
        console.log(`  Paycheck ${paycheck.date} -> ${paycheckDate.toDateString()} < ${dueDateObj.toDateString()}? ${paycheckDate < dueDateObj}`);
        return paycheckDate < dueDateObj;
    });

    return paychecksBeforeDue.length;
}

// Test with your actual scenario
console.log('\n--- Testing with your scenario ---');

// Mock data based on your setup
const mockPaychecks = [
    {
        date: '2025-07-09',
        paycheck: {
            accountDistribution: [{ accountId: 'sofi-account-id' }]
        }
    },
    {
        date: '2025-07-11',
        paycheck: {
            accountDistribution: [{ accountId: 'main-account-id' }]
        }
    }
];

// Test 1: Due date as YYYY-MM-DD format
console.log('\nTest 1: Due date "2025-07-10" with Main account');
const result1 = calculatePaychecksUntilDue('2025-07-10', mockPaychecks, 'main-account-id');
console.log(`Result: ${result1} paychecks (Expected: 0 - "Due Now")`);

// Test 2: Due date as MM/DD/YYYY format (what might be causing the issue)
console.log('\nTest 2: Due date "07/10/2025" with Main account');
const result2 = calculatePaychecksUntilDue('07/10/2025', mockPaychecks, 'main-account-id');
console.log(`Result: ${result2} paychecks (Expected: 0 - "Due Now")`);

// Test 3: Test with SoFi account (should show 1 paycheck)
console.log('\nTest 3: Due date "2025-07-10" with SoFi account');
const result3 = calculatePaychecksUntilDue('2025-07-10', mockPaychecks, 'sofi-account-id');
console.log(`Result: ${result3} paychecks (Expected: 1 - "1 paycheck left")`);

// Test 4: Check what happens with the old Date() constructor (problematic)
console.log('\n--- Testing problematic date parsing ---');
const problematicDate1 = new Date('2025-07-10');
const problematicDate2 = new Date('07/10/2025');
console.log(`new Date('2025-07-10'): ${problematicDate1.toDateString()} (${problematicDate1.toISOString()})`);
console.log(`new Date('07/10/2025'): ${problematicDate2.toDateString()} (${problematicDate2.toISOString()})`);

// Test 5: Check our fixed parsing
console.log('\n--- Testing fixed date parsing ---');
function parseFixedDate(dateStr) {
    let dueDateObj;
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        dueDateObj = new Date(year, month - 1, day);
    } else if (typeof dateStr === 'string' && dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [month, day, year] = dateStr.split('/').map(Number);
        dueDateObj = new Date(year, month - 1, day);
    } else {
        dueDateObj = new Date(dateStr);
    }
    dueDateObj.setHours(0, 0, 0, 0);
    return dueDateObj;
}

const fixedDate1 = parseFixedDate('2025-07-10');
const fixedDate2 = parseFixedDate('07/10/2025');
console.log(`Fixed parsing '2025-07-10': ${fixedDate1.toDateString()} (${fixedDate1.toISOString()})`);
console.log(`Fixed parsing '07/10/2025': ${fixedDate2.toDateString()} (${fixedDate2.toISOString()})`);

console.log('\n=== TEST COMPLETE ===');
console.log('If the fixed parsing shows July 10, 2025 consistently, the fix should work!');
