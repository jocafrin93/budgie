// Debug script to check actual localStorage data
// Run with: node debug-real-data.js

console.log('=== REAL DATA DEBUG ===');

// Simulate reading from localStorage (you'll need to copy the actual data)
console.log('Please run this in your browser console to get the actual data:');
console.log('');
console.log('// Copy and paste this into your browser console:');
console.log('console.log("=== ACCOUNTS ===");');
console.log('console.log(JSON.parse(localStorage.getItem("budgetCalc_accounts") || "[]"));');
console.log('console.log("=== PAYCHECKS ===");');
console.log('console.log(JSON.parse(localStorage.getItem("budgetCalc_paychecks") || "[]"));');
console.log('console.log("=== CATEGORIES ===");');
console.log('console.log(JSON.parse(localStorage.getItem("budgetCalc_categories") || "[]"));');
console.log('');
console.log('Then copy the output here so I can see the actual account ID mappings.');
console.log('');
console.log('The issue is likely that:');
console.log('1. Your "Main" account has ID X in the accounts array');
console.log('2. Your "Main" paycheck has accountDistribution with ID Y');
console.log('3. Your "Car" category has accountId Z');
console.log('4. X, Y, and Z are not matching up correctly');
console.log('');
console.log('Expected behavior:');
console.log('- Car expense due July 10');
console.log('- Funded by Main account');
console.log('- Main paycheck is July 11 (AFTER due date)');
console.log('- Should show "Due Now" but shows "1 paycheck left"');
console.log('');
console.log('This means the system is finding a paycheck BEFORE July 10,');
console.log('which suggests it\'s matching the wrong account ID.');
