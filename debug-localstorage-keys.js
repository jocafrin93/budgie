// Debug script to find the actual localStorage keys
console.log('=== LOCALSTORAGE KEY DISCOVERY ===');

console.log('All localStorage keys that might contain budget data:');
console.log('');

console.log('🔍 Run this in your browser console to find the actual keys:');
console.log('');
console.log('// List all localStorage keys');
console.log('console.log("=== ALL LOCALSTORAGE KEYS ===");');
console.log('for (let i = 0; i < localStorage.length; i++) {');
console.log('  const key = localStorage.key(i);');
console.log('  console.log(`${i}: "${key}"`);');
console.log('}');
console.log('');

console.log('// Look for budget-related keys specifically');
console.log('console.log("=== BUDGET-RELATED KEYS ===");');
console.log('for (let i = 0; i < localStorage.length; i++) {');
console.log('  const key = localStorage.key(i);');
console.log('  if (key.toLowerCase().includes("budget") || key.toLowerCase().includes("account") || key.toLowerCase().includes("paycheck") || key.toLowerCase().includes("category")) {');
console.log('    console.log(`Found: "${key}"`);');
console.log('    const value = localStorage.getItem(key);');
console.log('    console.log(`  Length: ${value ? value.length : 0} characters`);');
console.log('    if (value && value.length < 200) {');
console.log('      console.log(`  Preview: ${value.substring(0, 100)}...`);');
console.log('    }');
console.log('  }');
console.log('}');
console.log('');

console.log('🎯 LIKELY SCENARIOS:');
console.log('1. Keys might be "accounts", "paychecks", "categories" (without "budgetCalc_" prefix)');
console.log('2. Keys might have a different prefix like "budgie_" or "budget_"');
console.log('3. Data might be stored in a single key like "budgetData" or "appData"');
console.log('4. Keys might be namespaced differently');
console.log('');

console.log('Once you run the above commands and find the actual keys,');
console.log('we can modify our debug script to use the correct localStorage keys!');
