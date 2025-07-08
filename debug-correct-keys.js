// Debug script with the CORRECT localStorage keys from your app
console.log('=== CORRECT LOCALSTORAGE KEYS DEBUG ===');

console.log('Now using the actual keys from your codebase:');
console.log('- budgetCalc_accounts');
console.log('- budgetCalc_paychecks');
console.log('- budgetCalc_categories');
console.log('');

console.log('🔍 Run these commands in your browser console (on the budget categories page):');
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
console.log('  console.log(`${i}: Name="${pc.name}", Start="${pc.startDate}", Frequency="${pc.frequency}"`);');
console.log('  console.log("  Account Distribution:", pc.accountDistribution);');
console.log('  pc.accountDistribution.forEach((dist, j) => {');
console.log('    console.log(`    ${j}: AccountID="${dist.accountId}", Amount="${dist.amount}"`);');
console.log('  });');
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
console.log('} else {');
console.log('  console.log("No car category found. All categories:");');
console.log('  categories.forEach((cat, i) => console.log(`  ${i}: "${cat.name}" (accountId: ${cat.accountId})`));');
console.log('}');
console.log('');

console.log('🎯 WHAT TO LOOK FOR:');
console.log('1. Account IDs should be consistent between accounts and paycheck distributions');
console.log('2. Car category accountId should match the Main account ID');
console.log('3. Paycheck dates should be July 9 (SoFi) and July 11 (Main)');
console.log('4. Account distribution should map correctly to account IDs');
console.log('');

console.log('Once you run these commands, copy the output here so I can identify the exact mismatch!');
