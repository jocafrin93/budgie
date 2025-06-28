// src/components/PaydayWorkflow.js
import { useCallback, useEffect, useState } from 'react';
import { CurrencyField } from './form'; // Changed from CurrencyInput

/**
 * PaydayWorkflow component
 * 
 * This component provides a workflow for allocating money to categories
 * when a paycheck is received. It supports both automatic and manual allocation.
 */
const PaydayWorkflow = ({
  // Paycheck information
  paycheck,
  accounts,
  payFrequency,
  payFrequencyOptions,

  // Category data
  categories,
  toBeAllocated,
  planningItems,
  onEditItem,

  // Envelope budgeting functions
  fundCategory,
  autoFundCategories,
  getFundingSuggestions,

  // Optional callback when workflow completes
  onComplete
}) => {
  // Track the workflow step
  const [step, setStep] = useState('start'); // start, allocate, complete

  // Track allocation amounts for each category
  const [allocations, setAllocations] = useState({});

  // Track total allocated and remaining
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [remaining, setRemaining] = useState(paycheck ? paycheck.amount : 0);

  // Track auto-allocation settings
  const [useAutoAllocation, setUseAutoAllocation] = useState(false);
  const [autoAllocationPercent, setAutoAllocationPercent] = useState(100);

  // Get funding suggestions based on active planning items
  const [suggestions, setSuggestions] = useState([]);

  // Helper function to validate amounts
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    // Cap at reasonable maximum (e.g., $100,000) and minimum (-$100,000)
    return Math.min(Math.max(amount, -100000), 100000);
  };

  // Helper function to validate paycheck data
  const validatePaycheckData = (paycheck) => {
    if (!paycheck) return null;
    return {
      ...paycheck,
      amount: validateAmount(paycheck.amount),
      accountId: paycheck.accountId || (accounts.length > 0 ? accounts[0].id : null)
    };
  };

  // Helper function to get account name
  const getAccountName = (accountId) => {
    if (!accountId || !accounts) return 'Unknown Account';
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Initialize paycheck data when paycheck prop changes
  useEffect(() => {
    const validatedPaycheck = validatePaycheckData(paycheck);
    if (validatedPaycheck) {
      setRemaining(validatedPaycheck.amount);
    }
  }, [paycheck]);

  // Update total allocated and remaining when allocations change
  useEffect(() => {
    const total = Object.values(allocations).reduce((sum, amount) => {
      return sum + validateAmount(amount);
    }, 0);
    setTotalAllocated(total);

    const paycheckAmount = validatePaycheckData(paycheck)?.amount || 0;
    setRemaining(paycheckAmount - total);
  }, [allocations, paycheck]);

  // Get funding suggestions when component mounts or dependencies change
  useEffect(() => {
    if (getFundingSuggestions && categories && planningItems) {
      const fundingSuggestions = getFundingSuggestions();
      setSuggestions(fundingSuggestions);
    }
  }, [getFundingSuggestions, categories, planningItems]);

  // Handle allocation to a specific category
  const handleAllocateToCategory = useCallback((categoryId, amount) => {
    const validatedAmount = validateAmount(amount);
    setAllocations(prev => ({
      ...prev,
      [categoryId]: validatedAmount
    }));
  }, []);

  // Handle auto-allocation
  const handleAutoAllocate = useCallback(() => {
    if (!autoFundCategories || !paycheck) return;

    const paycheckAmount = validatePaycheckData(paycheck)?.amount || 0;
    const amountToAllocate = (paycheckAmount * autoAllocationPercent) / 100;

    const autoAllocations = autoFundCategories(amountToAllocate);
    setAllocations(autoAllocations);
  }, [autoFundCategories, paycheck, autoAllocationPercent]);

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
      onComplete();
    }
  }, [allocations, fundCategory, onComplete]);

  const validatedPaycheck = validatePaycheckData(paycheck);

  if (!validatedPaycheck) {
    return (
      <div className="payday-workflow p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Payday Workflow</h2>
          <p className="text-theme-secondary">No valid paycheck information available.</p>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="payday-workflow p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Allocation Complete!</h2>
          <p className="text-theme-secondary mb-4">
            Successfully allocated ${totalAllocated.toFixed(2)} from your paycheck.
          </p>
          <button
            onClick={() => setStep('start')}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            Start New Allocation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payday-workflow p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Payday Workflow</h2>
        <div className="bg-theme-secondary p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-theme-secondary">Paycheck Amount:</span>
            <span className="font-semibold text-lg">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validatedPaycheck.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-theme-secondary">Account:</span>
            <span>{getAccountName(validatedPaycheck.accountId)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-theme-secondary">Remaining to Allocate:</span>
            <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Auto-allocation options */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useAutoAllocation}
              onChange={(e) => setUseAutoAllocation(e.target.checked)}
              className="mr-2"
            />
            <span>Use auto-allocation</span>
          </label>
          {useAutoAllocation && (
            <div className="flex items-center gap-2">
              <span>Allocate</span>
              <input
                type="number"
                min="1"
                max="100"
                value={autoAllocationPercent}
                onChange={(e) => setAutoAllocationPercent(parseInt(e.target.value) || 100)}
                className="w-16 p-1 border rounded text-center"
              />
              <span>% of paycheck</span>
              <button
                onClick={handleAutoAllocate}
                className="btn-secondary px-3 py-1 rounded"
              >
                Auto-Allocate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category allocation table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Allocate to Categories</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-theme-secondary">
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Current Balance</th>
                <th className="text-right p-2">Suggested</th>
                <th className="text-right p-2">Allocate</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => {
                const suggestion = suggestions.find(s => s.categoryId === category.id);
                const neededAmount = suggestion ? suggestion.suggestedFunding : 0;

                return (
                  <tr key={category.id} className="border-b border-theme-secondary border-opacity-10">
                    <td className="p-2">
                      <div className="flex items-center">
                        <div
                          className={`w-4 h-4 rounded-full mr-2 ${category.color || 'bg-gray-400'}`}
                        ></div>
                        {category.name}
                      </div>
                    </td>
                    <td className="text-right p-2">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(category.available || 0)}
                    </td>
                    <td className="text-right p-2">
                      {neededAmount > 0 ?
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(neededAmount) :
                        '-'}
                    </td>
                    <td className="text-right p-2">
                      <CurrencyField
                        name={`allocation-${category.id}`}
                        value={allocations[category.id] || 0}
                        onChange={(e) => handleAllocateToCategory(category.id, e.target.value)}
                        className="w-24 text-right"
                        hideLabel={true}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Items Needing Allocation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Items Needing Allocation:</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            {categories.map(category => {
              const itemsNeedingAllocation = planningItems
                .filter(item => item.categoryId === category.id && item.needsAllocation);

              if (itemsNeedingAllocation.length === 0) return null;

              return (
                <div key={category.id} className="mb-4 last:mb-0">
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${category.color || 'bg-gray-400'}`} />
                    <h4 className="font-medium">{category.name}</h4>
                  </div>
                  <ul className="ml-5 space-y-2">
                    {itemsNeedingAllocation.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium">
                          {item.type === 'savings-goal'
                            ? `Goal: $${(item.targetAmount || 0).toFixed(2)}`
                            : `$${(item.amount || 0).toFixed(2)} ${item.frequency || 'monthly'}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep('start')}
          className="btn-secondary px-4 py-2 rounded-lg"
        >
          Reset
        </button>
        <button
          onClick={handleComplete}
          disabled={totalAllocated <= 0}
          className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Allocation
        </button>
      </div>
    </div>
  );
};

export default PaydayWorkflow;