// Comprehensive debug script to identify the account ID mismatch
console.log('=== COMPREHENSIVE ACCOUNT DEBUG ===');

console.log('Based on your feedback, the behavior is completely backwards:');
console.log('- Main account (paycheck July 11) shows "1 paycheck left" ❌');
console.log('- SoFi account (paycheck July 9) shows "Due Now" ❌');
console.log('');
console.log('This means the account IDs are mismatched somewhere.');
console.log('');

console.log('🔍 STEP 1: Run these commands in your browser console to get the raw data:');
console.log('');
console.log('// Get accounts');
console.log('const accounts = JSON.parse(localStorage.getItem("budgetCalc_accounts") || "[]");');
console.log('console.log("=== ACCOUNTS ===");');
console.log('accounts.forEach((acc, i) => console.log(`${i}: ID="${acc.id}", Name="${acc.name}"`));');
console.log('');

console.log('// Get paychecks');
console.log('const paychecks = JSON.parse(localStorage.getItem("budgetCalc_paychecks") || "[]");');
console.log('console.log("=== PAYCHECKS ===");');
console.log('paychecks.forEach((pc, i) => {');
console.log('  console.log(`${i}: Name="${pc.name}", Start="${pc.startDate}"`);');
console.log('  console.log("  Account Distribution:", pc.accountDistribution);');
console.log('});');
console.log('');

console.log('// Get categories');
console.log('const categories = JSON.parse(localStorage.getItem("budgetCalc_categories") || "[]");');
console.log('const carCategory = categories.find(c => c.name.toLowerCase().includes("car"));');
console.log('console.log("=== CAR CATEGORY ===");');
console.log('console.log("Car category:", carCategory);');
console.log('if (carCategory) {');
console.log('  console.log(`Car accountId: "${carCategory.accountId}"`);');
console.log('  console.log(`Car dueDate: "${carCategory.dueDate}"`);');
console.log('}');
console.log('');

console.log('🔍 STEP 2: After running the above, copy the output here and I will analyze it.');
console.log('');

console.log('🎯 EXPECTED RESULTS:');
console.log('- You should have 2 accounts: Main and SoFi');
console.log('- You should have 2 paychecks: one for July 9 (SoFi) and one for July 11 (Main)');
console.log('- Your Car category should have accountId pointing to Main account');
console.log('- The Main paycheck should have accountDistribution with Main account ID');
console.log('- The SoFi paycheck should have accountDistribution with SoFi account ID');
console.log('');

console.log('🚨 LIKELY ISSUES TO LOOK FOR:');
console.log('1. Car category accountId = SoFi ID (should be Main ID)');
console.log('2. Paycheck accountDistribution IDs are swapped');
console.log('3. Account IDs are inconsistent (e.g., "main" vs "main-account")');
console.log('4. Missing or null accountId in Car category');
console.log('');

console.log('Once you provide the console output, I can identify the exact fix needed!');
