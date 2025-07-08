// Fix for paycheck countdown issue
// This will help us identify and fix the account ID mapping problem

console.log('=== PAYCHECK COUNTDOWN FIX ===');

// The issue is likely one of these:
console.log('Potential issues to check:');
console.log('1. Account ID mismatch between category and paycheck');
console.log('2. Date parsing issue (7/9 vs 7/10)');
console.log('3. Account name vs ID mapping problem');
console.log('');

// Let's create a test to verify the exact issue
function debugPaycheckCountdown() {
    console.log('=== DEBUGGING PAYCHECK COUNTDOWN ===');

    // From your screenshots, I can see:
    console.log('Your setup:');
    console.log('- SoFi paycheck: July 9, 2025');
    console.log('- Main paycheck: July 11, 2025');
    console.log('- Car expense: Due July 10, 2025, funded by Main');
    console.log('- Expected: "Due Now" (since Main paycheck is AFTER due date)');
    console.log('- Actual: "1 paycheck left" (wrong!)');
    console.log('');

    console.log('This suggests the system is finding the SoFi paycheck (July 9)');
    console.log('instead of the Main paycheck (July 11).');
    console.log('');
    console.log('Possible causes:');
    console.log('1. Category accountId is pointing to SoFi instead of Main');
    console.log('2. Account IDs are mixed up in the data');
    console.log('3. The "Main" dropdown in the form is saving the wrong ID');
    console.log('');

    // Let's check what the actual account mapping should be
    console.log('Expected data structure:');
    console.log('Accounts: [');
    console.log('  { id: 1, name: "Main", ... },');
    console.log('  { id: 2, name: "SoFi", ... }');
    console.log(']');
    console.log('');
    console.log('Paychecks: [');
    console.log('  { id: 1, name: "Main", startDate: "2025-07-11", accountDistribution: [{ accountId: 1, ... }] },');
    console.log('  { id: 2, name: "SoFi", startDate: "2025-07-09", accountDistribution: [{ accountId: 2, ... }] }');
    console.log(']');
    console.log('');
    console.log('Categories: [');
    console.log('  { id: 1, name: "Car", accountId: 1, dueDate: "2025-07-10", ... }');
    console.log(']');
    console.log('');

    console.log('If Car category has accountId: 1, it should only find Main paycheck (July 11)');
    console.log('Since July 11 > July 10, result should be 0 ("Due Now")');
    console.log('');
    console.log('But if Car category has accountId: 2, it would find SoFi paycheck (July 9)');
    console.log('Since July 9 < July 10, result would be 1 ("1 paycheck left")');
    console.log('');
    console.log('CONCLUSION: Your Car category probably has the wrong accountId!');
}

debugPaycheckCountdown();

// Quick fix suggestion
console.log('=== QUICK FIX ===');
console.log('1. Open your browser console');
console.log('2. Run: localStorage.getItem("budgetCalc_categories")');
console.log('3. Find your Car category and check its accountId');
console.log('4. Compare with localStorage.getItem("budgetCalc_accounts")');
console.log('5. Make sure Car category accountId matches Main account ID');
console.log('');
console.log('Or try this in console:');
console.log('const categories = JSON.parse(localStorage.getItem("budgetCalc_categories") || "[]");');
console.log('const accounts = JSON.parse(localStorage.getItem("budgetCalc_accounts") || "[]");');
console.log('const carCategory = categories.find(c => c.name.toLowerCase().includes("car"));');
console.log('const mainAccount = accounts.find(a => a.name === "Main");');
console.log('console.log("Car category accountId:", carCategory?.accountId);');
console.log('console.log("Main account ID:", mainAccount?.id);');
console.log('console.log("Match?", carCategory?.accountId === mainAccount?.id);');
