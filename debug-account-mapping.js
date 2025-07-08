// Debug the actual account ID mapping issue
console.log('=== ACCOUNT MAPPING DEBUG ===');

// This script will help us understand what's actually happening with account IDs

console.log('Based on your feedback:');
console.log('- Main account (paycheck July 11) shows "1 paycheck left" ❌');
console.log('- SoFi account (paycheck July 9) shows "Due Now" ❌');
console.log('');
console.log('This is BACKWARDS! It should be:');
console.log('- Main account (paycheck July 11) shows "Due Now" ✅');
console.log('- SoFi account (paycheck July 9) shows "1 paycheck left" ✅');
console.log('');

console.log('This suggests one of these issues:');
console.log('1. Account IDs are swapped in the data');
console.log('2. The account filtering logic is inverted');
console.log('3. The paycheck dates are wrong');
console.log('4. The accountDistribution mapping is incorrect');
console.log('');

console.log('To debug this, please run these commands in your browser console:');
console.log('');
console.log('// 1. Check your actual accounts');
console.log('const accounts = JSON.parse(localStorage.getItem("budgetCalc_accounts") || "[]");');
console.log('console.log("=== ACCOUNTS ===");');
console.log('accounts.forEach(acc => console.log(`ID: ${acc.id}, Name: ${acc.name}`));');
console.log('');

console.log('// 2. Check your actual paychecks');
console.log('const paychecks = JSON.parse(localStorage.getItem("budgetCalc_paychecks") || "[]");');
console.log('console.log("=== PAYCHECKS ===");');
console.log('paychecks.forEach(pc => {');
console.log('  console.log(`Name: ${pc.name}, Start Date: ${pc.startDate}`);');
console.log('  console.log("Account Distribution:", pc.accountDistribution);');
console.log('});');
console.log('');

console.log('// 3. Check your Car category');
console.log('const categories = JSON.parse(localStorage.getItem("budgetCalc_categories") || "[]");');
console.log('const carCategory = categories.find(c => c.name.toLowerCase().includes("car"));');
console.log('console.log("=== CAR CATEGORY ===");');
console.log('console.log("Car category:", carCategory);');
console.log('');

console.log('// 4. Check what the paycheck management hook returns');
console.log('// (This needs to be run in the actual app context)');
console.log('');

console.log('EXPECTED RESULTS:');
console.log('- Main account should have ID X');
console.log('- SoFi account should have ID Y');
console.log('- Main paycheck should have accountDistribution with ID X');
console.log('- SoFi paycheck should have accountDistribution with ID Y');
console.log('- Car category should have accountId = X (Main)');
console.log('');

console.log('LIKELY ISSUES:');
console.log('1. Car category accountId points to SoFi instead of Main');
console.log('2. Paycheck accountDistribution IDs are swapped');
console.log('3. Account IDs in the accounts array are wrong');
console.log('');

console.log('Please copy the output from the browser console commands above');
console.log('so I can see the actual data structure and fix the mapping issue.');
