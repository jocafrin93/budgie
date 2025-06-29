// src/components/PaydayWorkflow.js
import { useCallback, useEffect, useState } from 'react';
import { CurrencyField } from './form';

/**
 * Enhanced PaydayWorkflow component
 * 
 * This component provides a complete workflow for recording paycheck transactions
 * and then allocating money to categories when a paycheck is received.
 */
const PaydayWorkflow = ({
  // Paycheck template information (optional - for defaults)
  paycheck,
  accounts,

  // Category data
  categories,
  toBeAllocated,
  planningItems,
  onEditItem,

  // Transaction functions
  addTransaction,
  ensureIncomeCategory, // ← Add this prop

  // Envelope budgeting functions
  fundCategory,
  autoFundCategories,
  getFundingSuggestions,

  // Configuration
  frequencyOptions, // ← Add this prop to use your constants

  // Optional callback when workflow completes
  onComplete,

  // Theme support
  darkMode = false
}) => {
  // Track the workflow step
  const [step, setStep] = useState('record-paycheck'); // record-paycheck, allocate, complete

  // Helper function to get today's date in local timezone (most reliable method)
  const getTodaysDate = () => {
    // Get today's date and ensure it's in local timezone
    const now = new Date();
    // Offset timezone difference to get true local date
    const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert to milliseconds
    const localDate = new Date(now.getTime() - timezoneOffset);
    const result = localDate.toISOString().split('T')[0];

    console.log('PaydayWorkflow - getTodaysDate():', {
      now: now,
      timezoneOffset: timezoneOffset,
      localDate: localDate,
      result: result,
      expectedToday: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    });
    return result;
  };

  // Paycheck transaction data
  const [paycheckData, setPaycheckData] = useState({
    date: getTodaysDate(), // Today's date in local timezone
    amount: paycheck?.baseAmount || 0,
    payee: paycheck?.name || 'Paycheck',
    notes: '',
    accountDistribution: paycheck?.accountDistribution || (accounts.length > 0 ? [{
      accountId: accounts[0].id,
      amount: paycheck?.baseAmount || 0
    }] : [])
  });

  // Track allocation amounts for each category
  const [allocations, setAllocations] = useState({});

  // Track total allocated and remaining
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // Track auto-allocation settings
  const [useAutoAllocation, setUseAutoAllocation] = useState(false);
  const [autoAllocationPercent, setAutoAllocationPercent] = useState(100);

  // Get funding suggestions based on active planning items
  const [suggestions, setSuggestions] = useState([]);

  // Helper function to validate amounts
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    return Math.min(Math.max(amount, -100000), 100000);
  };

  // Helper function to get account name
  const getAccountName = (accountId) => {
    if (!accountId || !accounts) return 'Unknown Account';
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Update total allocated and remaining when allocations change
  useEffect(() => {
    const total = Object.values(allocations).reduce((sum, amount) => {
      return sum + validateAmount(amount);
    }, 0);
    setTotalAllocated(total);
    setRemaining(paycheckData.amount - total);
  }, [allocations, paycheckData.amount]);

  // Get funding suggestions when component mounts or dependencies change
  useEffect(() => {
    if (getFundingSuggestions && categories && planningItems) {
      const fundingSuggestions = getFundingSuggestions();
      setSuggestions(fundingSuggestions);
    }
  }, [getFundingSuggestions, categories, planningItems]);

  // Handle paycheck amount change and update distribution
  const handlePaycheckAmountChange = (eventOrValue) => {
    console.log('PaydayWorkflow - handlePaycheckAmountChange called with:', eventOrValue, typeof eventOrValue);

    // Handle both event objects and direct values
    let newAmount;
    if (eventOrValue && eventOrValue.target) {
      // It's an event object - extract the value
      newAmount = eventOrValue.target.value;
      console.log('PaydayWorkflow - Extracted value from event:', newAmount);
    } else {
      // It's a direct value
      newAmount = eventOrValue;
    }

    // Convert string to number if needed
    const numericAmount = typeof newAmount === 'string' ? parseFloat(newAmount) || 0 : newAmount;
    const validatedAmount = validateAmount(numericAmount);

    console.log('PaydayWorkflow - Amount processing:', {
      original: eventOrValue,
      extracted: newAmount,
      numericAmount,
      validatedAmount,
      type: typeof newAmount
    });

    setPaycheckData(prev => {
      // Update distribution amounts proportionally
      const totalCurrentDistribution = prev.accountDistribution.reduce((sum, dist) => {
        const distAmount = typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount;
        return sum + distAmount;
      }, 0);

      let updatedDistribution;
      if (totalCurrentDistribution > 0 && validatedAmount > 0) {
        // Proportional update
        updatedDistribution = prev.accountDistribution.map(dist => {
          const currentAmount = typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount;
          const proportion = currentAmount / totalCurrentDistribution;
          return {
            ...dist,
            amount: proportion * validatedAmount
          };
        });
      } else {
        // Equal distribution if no current distribution or first time setting amount
        const amountPerAccount = validatedAmount / Math.max(1, prev.accountDistribution.length);
        updatedDistribution = prev.accountDistribution.map(dist => ({
          ...dist,
          amount: amountPerAccount
        }));
      }

      const newData = {
        ...prev,
        amount: validatedAmount, // Store as number
        accountDistribution: updatedDistribution
      };

      console.log('PaydayWorkflow - Updated paycheckData:', newData);
      return newData;
    });
  };

  // Handle account distribution changes
  const handleDistributionChange = (index, field, value) => {
    console.log('PaydayWorkflow - Distribution changed:', { index, field, value, type: typeof value });

    setPaycheckData(prev => {
      const updatedDistribution = [...prev.accountDistribution];

      if (field === 'accountId') {
        updatedDistribution[index] = { ...updatedDistribution[index], accountId: value };
      } else if (field === 'amount') {
        // Convert string to number for CurrencyField compatibility
        const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        const validatedAmount = validateAmount(numericValue);
        updatedDistribution[index] = { ...updatedDistribution[index], amount: validatedAmount };
      }

      return { ...prev, accountDistribution: updatedDistribution };
    });
  };

  // Add new account to distribution
  const handleAddAccountDistribution = () => {
    const usedAccountIds = paycheckData.accountDistribution.map(dist => dist.accountId);
    const availableAccount = accounts.find(acc => !usedAccountIds.includes(acc.id));

    if (availableAccount) {
      setPaycheckData(prev => ({
        ...prev,
        accountDistribution: [
          ...prev.accountDistribution,
          { accountId: availableAccount.id, amount: 0 }
        ]
      }));
    }
  };

  // Remove account from distribution
  const handleRemoveAccountDistribution = (index) => {
    if (paycheckData.accountDistribution.length <= 1) return;

    setPaycheckData(prev => ({
      ...prev,
      accountDistribution: prev.accountDistribution.filter((_, i) => i !== index)
    }));
  };

  // Record the paycheck transaction and move to allocation step
  const handleRecordPaycheck = () => {
    // Debug logging
    console.log('PaydayWorkflow - handleRecordPaycheck called');
    console.log('PaydayWorkflow - paycheckData:', paycheckData);

    // Validate the data
    if (!paycheckData.date) {
      console.log('PaydayWorkflow - Date validation failed:', paycheckData.date);
      alert('Please enter a valid date.');
      return;
    }

    // Convert amount to number and validate
    const numericAmount = typeof paycheckData.amount === 'string' ?
      parseFloat(paycheckData.amount) || 0 : paycheckData.amount;

    console.log('PaydayWorkflow - Amount validation:', {
      original: paycheckData.amount,
      converted: numericAmount,
      type: typeof paycheckData.amount
    });

    if (numericAmount <= 0) {
      console.log('PaydayWorkflow - Amount validation failed:', numericAmount);
      alert('Please enter a valid amount greater than zero.');
      return;
    }

    if (paycheckData.accountDistribution.length === 0) {
      console.log('PaydayWorkflow - No account distribution');
      alert('Please select at least one account.');
      return;
    }

    // Check that distribution amounts add up to total (convert strings to numbers)
    const totalDistribution = paycheckData.accountDistribution.reduce((sum, dist) => {
      const distAmount = typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount;
      return sum + distAmount;
    }, 0);

    console.log('PaydayWorkflow - Distribution validation:', {
      totalDistribution,
      paycheckAmount: numericAmount,
      difference: Math.abs(totalDistribution - numericAmount)
    });

    if (Math.abs(totalDistribution - numericAmount) > 0.01) {
      alert('Account distribution amounts must add up to the total paycheck amount.');
      return;
    }

    console.log('PaydayWorkflow - All validations passed, creating transactions...');

    try {
      // Find or create "Income" category for transaction categorization (hidden from budget)
      let incomeCategoryId = null;

      if (ensureIncomeCategory) {
        // Use the provided function to ensure income category exists
        incomeCategoryId = ensureIncomeCategory();
      } else {
        // Fallback: look for existing income-related category
        let incomeCategory = categories.find(cat =>
          (cat.name === 'Income' || cat.name === 'Paycheck' || cat.name === 'To Be Allocated') &&
          cat.type === 'income'
        );

        // If no income category exists, create a hidden one
        if (!incomeCategory) {
          // Note: This would need to be handled by the parent component
          // For now, we'll use null and let it be uncategorized
          console.log('No income category found - transaction will be uncategorized');
        }

        incomeCategoryId = incomeCategory?.id || null;
      }

      // Create transactions for each account in the distribution
      paycheckData.accountDistribution.forEach(dist => {
        const distAmount = typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount;
        if (distAmount > 0) {
          console.log('PaydayWorkflow - Creating transaction:', {
            date: paycheckData.date,
            payee: paycheckData.payee,
            amount: distAmount,
            accountId: dist.accountId,
            categoryId: incomeCategoryId
          });

          addTransaction({
            date: paycheckData.date,
            payee: paycheckData.payee,
            amount: distAmount, // Positive amount for income
            accountId: dist.accountId,
            categoryId: incomeCategoryId || null, // Use Income category if available
            notes: paycheckData.notes || 'Paycheck deposit',
            type: 'income'
          });
        }
      });

      console.log('PaydayWorkflow - Transactions created successfully, moving to allocation step');
      // Move to allocation step
      setStep('allocate');
    } catch (error) {
      console.error('Error recording paycheck:', error);
      alert('Error recording paycheck. Please try again.');
    }
  };

  // Handle allocation to a specific category
  const handleAllocateToCategory = useCallback((categoryId, amount) => {
    const validatedAmount = validateAmount(amount);
    setAllocations(prev => ({
      ...prev,
      [categoryId]: validatedAmount
    }));
  }, []);

  // Handle auto-allocation using proper frequency conversion from constants
  const handleAutoAllocate = useCallback(() => {
    if (!planningItems || !categories) return;

    const amountToAllocate = (paycheckData.amount * autoAllocationPercent) / 100;

    // Get active planning items that need allocation
    const activeItems = planningItems.filter(item =>
      item.isActive && !item.allocationPaused && item.priorityState === 'active' && item.categoryId
    );

    // Import the frequency options from constants (passed as prop or fallback)
    const availableFrequencyOptions = frequencyOptions || [
      { value: 'weekly', label: 'Weekly', weeksPerYear: 52 },
      { value: 'bi-weekly', label: 'Bi-weekly', weeksPerYear: 26 },
      { value: 'every-3-weeks', label: 'Every 3 weeks', weeksPerYear: 17.33 },
      { value: 'monthly', label: 'Monthly', weeksPerYear: 12 },
      { value: 'every-5-weeks', label: 'Every 5 weeks', weeksPerYear: 10.4 },
      { value: 'every-6-weeks', label: 'Every 6 weeks', weeksPerYear: 8.67 },
      { value: 'every-7-weeks', label: 'Every 7 weeks', weeksPerYear: 7.43 },
      { value: 'bi-monthly', label: 'Every other month', weeksPerYear: 6 },
      { value: 'quarterly', label: 'Quarterly', weeksPerYear: 4 },
      { value: 'semi-annually', label: 'Every 6 months', weeksPerYear: 2 },
      { value: 'annually', label: 'Annually', weeksPerYear: 1 },
      { value: 'per-paycheck', label: 'Per Paycheck (Direct)', weeksPerYear: 26 }
    ];

    // Calculate per-paycheck amounts for each category using your frequency system
    const categoryAmounts = {};
    activeItems.forEach(item => {
      const categoryId = parseInt(item.categoryId, 10);
      if (!categoryAmounts[categoryId]) {
        categoryAmounts[categoryId] = 0;
      }

      let perPaycheckAmount = 0;
      if (item.type === 'savings-goal') {
        // For goals, use monthly contribution converted to per-paycheck (biweekly)
        const monthlyContribution = item.monthlyContribution || 0;
        perPaycheckAmount = (monthlyContribution * 12) / 26; // Convert monthly to biweekly
      } else {
        // For expenses, use your frequency conversion system
        const itemAmount = item.amount || 0;

        if (item.frequency === 'per-paycheck') {
          // Direct per-paycheck amount - use exactly as specified
          perPaycheckAmount = itemAmount;
        } else {
          // Convert other frequencies to per-paycheck using your frequency data
          const freqData = availableFrequencyOptions.find(f => f.value === item.frequency);
          if (freqData && freqData.weeksPerYear) {
            // Convert to yearly amount, then to biweekly (26 paychecks per year)
            const yearlyAmount = itemAmount * freqData.weeksPerYear;
            perPaycheckAmount = yearlyAmount / 26;
          } else {
            // Fallback to monthly conversion if frequency not found
            console.warn(`Unknown frequency: ${item.frequency}, defaulting to monthly conversion`);
            perPaycheckAmount = (itemAmount * 12) / 26;
          }
        }
      }

      categoryAmounts[categoryId] += validateAmount(perPaycheckAmount);
    });

    // Calculate total needed per paycheck
    const totalNeeded = Object.values(categoryAmounts).reduce((sum, amount) => sum + amount, 0);

    // If not enough to fund everything, scale proportionally
    const scaleFactor = amountToAllocate < totalNeeded ? amountToAllocate / totalNeeded : 1;

    // Create allocations
    const newAllocations = {};
    Object.entries(categoryAmounts).forEach(([categoryId, amount]) => {
      const scaledAmount = validateAmount(amount * scaleFactor);
      if (scaledAmount > 0) {
        newAllocations[categoryId] = scaledAmount;
      }
    });

    setAllocations(newAllocations);
  }, [planningItems, categories, paycheckData.amount, autoAllocationPercent]);

  // Handle completing the workflow
  const handleComplete = useCallback(() => {
    if (!fundCategory) return;

    // Apply all allocations
    Object.entries(allocations).forEach(([categoryId, amount]) => {
      if (amount > 0) {
        fundCategory(parseInt(categoryId), amount);
      }
    });

    setStep('complete');

    if (onComplete) {
      onComplete({
        completed: true,
        paycheck: paycheckData,
        allocations: allocations,
        totalAllocated: totalAllocated
      });
    }
  }, [allocations, fundCategory, onComplete, paycheckData, totalAllocated]);

  // Reset workflow
  const handleRestart = () => {
    setStep('record-paycheck');
    setAllocations({});
    setTotalAllocated(0);
    setRemaining(0);
  };

  // Render different steps
  if (step === 'record-paycheck') {
    return (
      <div className="payday-workflow p-6 bg-theme-primary rounded-lg border border-theme-border">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-theme-text">Record Paycheck</h2>
          <p className="text-theme-secondary">Enter the details of your received paycheck to add it to your accounts.</p>
        </div>

        <div className="space-y-4">
          {/* Basic Information - Condensed Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text">Date Received</label>
              <input
                type="date"
                value={paycheckData.date}
                onChange={(e) => setPaycheckData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2 border border-theme-border rounded bg-theme-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text">Payee/Description</label>
              <input
                type="text"
                value={paycheckData.payee}
                onChange={(e) => setPaycheckData(prev => ({ ...prev, payee: e.target.value }))}
                placeholder="e.g., Main Job, Side Gig"
                className="w-full p-2 border border-theme-border rounded bg-theme-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text">Total Amount</label>
              <CurrencyField
                value={paycheckData.amount}
                onChange={handlePaycheckAmountChange}
                placeholder="0.00"
                className="w-full"
                darkMode={darkMode}
              />
            </div>
          </div>

          {/* Split Account Option */}
          <div className="flex items-center gap-3 p-3 bg-theme-secondary bg-opacity-30 rounded">
            <input
              type="checkbox"
              id="splitAccount"
              checked={paycheckData.accountDistribution.length > 1}
              onChange={(e) => {
                if (e.target.checked) {
                  // Enable splitting - add a second account if available
                  handleAddAccountDistribution();
                } else {
                  // Disable splitting - keep only first account with full amount
                  setPaycheckData(prev => ({
                    ...prev,
                    accountDistribution: [{
                      ...prev.accountDistribution[0],
                      amount: prev.amount
                    }]
                  }));
                }
              }}
              className="rounded border-theme-border"
            />
            <label htmlFor="splitAccount" className="text-sm text-theme-text">
              Split paycheck across multiple accounts
            </label>
          </div>

          {/* Account Distribution - Conditional */}
          {paycheckData.accountDistribution.length === 1 ? (
            /* Single Account - Simple */
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text">Deposit to Account</label>
              <select
                value={paycheckData.accountDistribution[0]?.accountId || ''}
                onChange={(e) => handleDistributionChange(0, 'accountId', parseInt(e.target.value))}
                className="w-full p-2 border border-theme-border rounded bg-theme-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary text-sm"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Multiple Accounts - Advanced */
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-theme-text">Account Distribution</label>
                {paycheckData.accountDistribution.length < accounts.length && (
                  <button
                    onClick={handleAddAccountDistribution}
                    className="text-xs text-theme-primary hover:text-theme-primary-dark"
                  >
                    + Add Account
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {paycheckData.accountDistribution.map((dist, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-theme-secondary bg-opacity-30 rounded text-sm">
                    <div className="flex-1">
                      <select
                        value={dist.accountId}
                        onChange={(e) => handleDistributionChange(index, 'accountId', parseInt(e.target.value))}
                        className="w-full p-1.5 border border-theme-border rounded bg-theme-primary text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-primary text-sm"
                      >
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <CurrencyField
                        value={dist.amount}
                        onChange={(value) => handleDistributionChange(index, 'amount', value)}
                        placeholder="0.00"
                        darkMode={darkMode}
                      />
                    </div>

                    {paycheckData.accountDistribution.length > 1 && (
                      <button
                        onClick={() => handleRemoveAccountDistribution(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                        title="Remove account"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Distribution Summary - Compact */}
              <div className="mt-2 p-2 bg-theme-secondary bg-opacity-20 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Total Distribution:</span>
                  <span className="font-medium text-theme-text">
                    ${paycheckData.accountDistribution.reduce((sum, dist) => sum + (typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Paycheck Amount:</span>
                  <span className="font-medium text-theme-text">${paycheckData.amount.toFixed(2)}</span>
                </div>
                {Math.abs(paycheckData.accountDistribution.reduce((sum, dist) => sum + (typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount || 0), 0) - paycheckData.amount) > 0.01 && (
                  <div className="flex justify-between text-red-500">
                    <span>Difference:</span>
                    <span>
                      ${Math.abs(paycheckData.accountDistribution.reduce((sum, dist) => sum + (typeof dist.amount === 'string' ? parseFloat(dist.amount) || 0 : dist.amount || 0), 0) - paycheckData.amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes - Compact */}
          <div>
            <label className="block text-xs font-medium mb-1 text-theme-text">Notes (Optional)</label>
            <textarea
              value={paycheckData.notes}
              onChange={(e) => setPaycheckData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this paycheck..."
              rows={2}
              className="w-full p-2 border border-theme-border rounded bg-theme-secondary text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Action Buttons - Using correct theme classes */}
          <div className="flex justify-center gap-3 pt-4 border-t border-theme-border mt-4">
            <button
              onClick={() => onComplete && onComplete({ completed: false })}
              className="px-4 py-2 border border-theme-border text-theme-text rounded bg-theme-primary hover:bg-theme-hover transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPaycheck}
              className="px-4 py-2 border border-theme-border text-theme-text rounded bg-theme-primary hover:bg-theme-active transition-colors text-sm"
            >
              Record & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'allocate') {
    return (
      <div className="payday-workflow p-6 bg-theme-primary rounded-lg border border-theme-border">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-theme-text">Allocate Paycheck</h2>
          <div className="bg-theme-secondary bg-opacity-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-theme-secondary">Paycheck Amount:</span>
              <span className="font-semibold text-lg text-theme-text">
                ${paycheckData.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-theme-secondary">Total Allocated:</span>
              <span className="font-semibold text-theme-text">${totalAllocated.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-theme-secondary">Remaining to Allocate:</span>
              <span className={`font-semibold ${remaining < 0 ? 'text-red-500' : remaining > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                ${remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-allocation Option */}
        <div className="mb-6 p-4 bg-theme-secondary bg-opacity-30 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="auto-allocation"
              checked={useAutoAllocation}
              onChange={(e) => setUseAutoAllocation(e.target.checked)}
              className="rounded border-theme-border"
            />
            <label htmlFor="auto-allocation" className="text-theme-text">
              Use automatic allocation
            </label>
          </div>

          {useAutoAllocation && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-theme-secondary">Allocate:</span>
              <input
                type="number"
                value={autoAllocationPercent}
                onChange={(e) => setAutoAllocationPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-20 p-2 border border-theme-border rounded bg-theme-tertiary text-theme-text text-center"
                min="0"
                max="100"
              />
              <span className="text-sm text-theme-secondary">% of paycheck</span>
              <button
                onClick={handleAutoAllocate}
                className="px-4 py-2 btn-success text-white text-sm rounded hover:bg-theme-hover transition-colors"
              >
                Auto-Allocate
              </button>
            </div>
          )}
        </div>

        {/* Category Allocation */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-theme-text">Allocate to Categories</h3>

          {categories && categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map(category => (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-theme-secondary bg-opacity-30 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-theme-text">{category.name}</span>
                    {category.allocated > 0 && (
                      <div className="text-sm text-theme-secondary">
                        Current: ${category.allocated.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="w-32">
                    <CurrencyField
                      value={allocations[category.id] || 0}
                      onChange={(value) => handleAllocateToCategory(category.id, value)}
                      placeholder="0.00"
                      darkMode={darkMode}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-secondary">
              <p>No categories available for allocation.</p>
              <p className="text-sm mt-2">Create some budget categories first to allocate your paycheck.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 pt-4 border-t border-theme-border mt-4">
          <button
            onClick={() => setStep('record-paycheck')}
            className="px-6 py-2 border border-theme-border text-theme-text rounded-lg hover:bg-theme-active hover:bg-opacity-50 transition-colors"
          >
            ← Back
          </button>


          <button
            onClick={() => onComplete && onComplete({ completed: false })}
            className="px-6 py-2 border border-theme-border text-theme-text rounded-lg hover:bg-theme-active hover:bg-opacity-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleComplete}
            className="px-6 py-2 btn-success text-white rounded-lg hover:bg-hover-active transition-colors"
            disabled={categories.length === 0}
          >
            Done
          </button>

        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="payday-workflow p-6 bg-theme-primary rounded-lg border border-theme-border">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Payday Complete!</h2>
          <div className="mb-6 space-y-2">
            <p className="text-theme-secondary">
              Recorded paycheck of <span className="font-semibold text-theme-text">${paycheckData.amount.toFixed(2)}</span>
            </p>
            <p className="text-theme-secondary">
              Allocated <span className="font-semibold text-theme-text">${totalAllocated.toFixed(2)}</span> to budget categories
            </p>
            {remaining > 0 && (
              <p className="text-orange-600">
                ${remaining.toFixed(2)} remaining unallocated
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-6 py-2 border border-theme-border text-theme-text rounded-lg hover:bg-theme-active hover:bg-opacity-50 transition-colors"
            >
              Record Another Paycheck
            </button>
            <button
              onClick={() => onComplete && onComplete({ completed: true })}
              className="px-6 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary-dark transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaydayWorkflow;