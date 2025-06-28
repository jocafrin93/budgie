// src/components/PaydayWorkflow.js
import { useCallback, useEffect, useState } from 'react';
import { CurrencyField } from './form';

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

  // Helper function to calculate remaining paychecks until due date
  const calculatePaychecksUntilDue = (dueDate) => {
    if (!dueDate) return null;

    // Get paycheck frequency info
    const payFreqOption = payFrequencyOptions?.find(opt => opt.value === payFrequency);
    const daysPerPaycheck = Math.ceil(30 / (payFreqOption?.paychecksPerMonth || 2.17));

    // Convert dates to UTC
    const today = new Date();
    const due = new Date(dueDate);
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const dueUTC = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));

    // Calculate days between dates
    const daysUntilDue = Math.ceil((dueUTC - todayUTC) / (24 * 60 * 60 * 1000));

    // Calculate remaining paychecks
    return Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));
  };

  // Helper function to format dates consistently
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  // Initialize on mount or when paycheck changes
  useEffect(() => {
    const validatedPaycheck = validatePaycheckData(paycheck);
    if (validatedPaycheck) {
      setRemaining(validatedPaycheck.amount);

      // Get funding suggestions and prioritize items needing allocation
      const fundingSuggestions = getFundingSuggestions().map(suggestion => {
        const itemsInCategory = planningItems.filter(item => item.categoryId === suggestion.categoryId);
        const hasItemsNeedingAllocation = itemsInCategory.some(item => item.needsAllocation);
        const nextDueDate = itemsInCategory
          .map(item => item.dueDate)
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b))[0];

        return {
          ...suggestion,
          priority: hasItemsNeedingAllocation ? 2 : nextDueDate ? 1 : 0,
          paychecksUntilDue: nextDueDate ? calculatePaychecksUntilDue(nextDueDate) : null
        };
      }).sort((a, b) => {
        // Sort by priority first, then by paychecks until due
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.paychecksUntilDue !== null && b.paychecksUntilDue !== null) {
          return a.paychecksUntilDue - b.paychecksUntilDue;
        }
        return 0;
      });

      setSuggestions(fundingSuggestions);

      // Initialize allocations object
      const initialAllocations = {};
      categories.forEach(category => {
        initialAllocations[category.id] = 0;
      });
      setAllocations(initialAllocations);

      setTotalAllocated(0);
    }
  }, [paycheck, categories, getFundingSuggestions, planningItems]);

  // Handle manual allocation to a category
  const handleAllocateToCategory = (categoryId, amount) => {
    const validatedAmount = validateAmount(amount);

    // Update allocations
    setAllocations(prev => ({
      ...prev,
      [categoryId]: validatedAmount
    }));

    // Recalculate totals with validation
    const newTotal = validateAmount(Object.entries(allocations)
      .reduce((sum, [id, value]) => {
        return sum + validateAmount(id === categoryId.toString() ? validatedAmount : value);
      }, 0));

    setTotalAllocated(newTotal);
    setRemaining(validateAmount(validateAmount(paycheck.amount) - newTotal));
  };

  // Handle running auto-allocation - wrapped in useCallback to handle dependency properly
  const handleAutoAllocate = useCallback(() => {
    const validatedPaycheckAmount = validateAmount(paycheck.amount);
    const amountToAutoAllocate = validateAmount((validatedPaycheckAmount * autoAllocationPercent) / 100);

    const result = autoFundCategories(amountToAutoAllocate, paycheck.id);

    // Update UI state based on auto-allocation results with validation
    const validatedTotalFunded = validateAmount(result.totalFunded);
    const validatedRemaining = validateAmount(result.remainingToAllocate);
    setTotalAllocated(validatedTotalFunded);
    setRemaining(validatedRemaining);

    // Update allocations state to reflect what was funded
    const newAllocations = { ...allocations };
    result.fundingResults.forEach(item => {
      if (item.success) {
        newAllocations[item.categoryId] = validateAmount(item.amount);
      }
    });
    setAllocations(newAllocations);
  }, [paycheck, autoAllocationPercent, autoFundCategories, allocations, setAllocations, setTotalAllocated, setRemaining]);

  // Handle completing the workflow and actually funding categories
  const handleCompleteAllocation = () => {
    const validatedPaycheck = validatePaycheckData(paycheck);
    if (!validatedPaycheck) return;

    // Fund each category with the allocated amount
    Object.entries(allocations).forEach(([categoryId, amount]) => {
      const validatedAmount = validateAmount(amount);
      if (validatedAmount > 0) {
        fundCategory(parseInt(categoryId, 10), validatedAmount, validatedPaycheck.id);

        // Clear needsAllocation flag for items in funded categories
        const itemsToUpdate = planningItems.filter(item =>
          item.categoryId === parseInt(categoryId, 10) && item.needsAllocation
        );

        itemsToUpdate.forEach(item => {
          onEditItem(item.id, {
            ...item,
            needsAllocation: false
          });
        });
      }
    });

    // Move to complete step
    setStep('complete');

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete({
        paycheck: validatedPaycheck,
        totalAllocated: validateAmount(totalAllocated),
        remaining: validateAmount(remaining),
        allocations: Object.fromEntries(
          Object.entries(allocations).map(([id, amount]) => [id, validateAmount(amount)])
        ),
        completed: true
      });
    }
  };

  // Reset the workflow
  const handleReset = () => {
    setStep('start');
    setAllocations({});
    setTotalAllocated(0);
    setRemaining(paycheck ? validateAmount(paycheck.amount) : 0);
    setUseAutoAllocation(false);
    setAutoAllocationPercent(100);
  };

  // Auto-allocation effect - MOVED TO TOP LEVEL before any conditional returns
  useEffect(() => {
    if (step === 'allocate' && useAutoAllocation) {
      handleAutoAllocate();
    }
  }, [step, useAutoAllocation, handleAutoAllocate]);

  // If no paycheck, don't render
  if (!paycheck) {
    return null;
  }

  // Start step - welcome and options
  if (step === 'start') {
    return (
      <div className="payday-workflow bg-theme-primary rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🎉 Payday!</h2>

        <div className="mb-6">
          <p className="mb-2">You've received a paycheck of:</p>
          <div className="text-3xl font-bold text-theme-accent">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validateAmount(paycheck?.amount || 0))}
          </div>
          <p className="text-sm text-theme-secondary mt-1">
            Deposited to: {getAccountName(paycheck?.accountId)}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">How would you like to allocate this money?</h3>

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="useAutoAllocation"
              checked={useAutoAllocation}
              onChange={e => setUseAutoAllocation(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useAutoAllocation">Use auto-allocation based on monthly budget</label>
          </div>

          {useAutoAllocation && (
            <div className="ml-6 mb-4">
              <label className="block mb-1">Percentage to auto-allocate:</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={autoAllocationPercent}
                  onChange={e => setAutoAllocationPercent(parseInt(e.target.value, 10))}
                  className="mr-2"
                />
                <span>{autoAllocationPercent}%</span>
              </div>
              <p className="text-sm text-theme-secondary mt-1">
                {autoAllocationPercent < 100 ?
                  `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validateAmount((paycheck?.amount || 0) * autoAllocationPercent / 100))} will be auto-allocated` :
                  'All money will be auto-allocated'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setStep('allocate')}
            className="btn-primary px-4 py-2 rounded"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Allocate step - distribute money to categories
  if (step === 'allocate') {

    return (
      <div className="payday-workflow bg-theme-primary rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Allocate Your Money</h2>

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-sm">Total to Allocate:</p>
            <div className="text-xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validateAmount(paycheck?.amount || 0))}</div>
          </div>
          <div>
            <p className="text-sm">Allocated:</p>
            <div className="text-xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAllocated)}</div>
          </div>
          <div>
            <p className="text-sm">Remaining:</p>
            <div className={`text-xl font-bold ${remaining < 0 ? 'text-red-500' : ''}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remaining)}
            </div>
          </div>
        </div>

        {/* Category allocation table */}
        <div className="mb-6 overflow-y-auto max-h-96">
          <table className="w-full">
            <thead className="bg-theme-secondary bg-opacity-10">
              <tr>
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Current</th>
                <th className="text-right p-2">Needed</th>
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

        {/* Quick allocation buttons */}
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
                            ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.monthlyContribution)}/month`
                            : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}/${item.frequency}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Quick Allocate:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const validatedRemaining = validateAmount(remaining);
                const newAllocations = { ...allocations };

                // Sort categories by priority (based on suggestions)
                const sortedCategories = [...categories]
                  .map(category => {
                    const suggestion = suggestions.find(s => s.categoryId === category.id);
                    return {
                      ...category,
                      needed: validateAmount(suggestion ? suggestion.suggestedFunding : 0)
                    };
                  })
                  .sort((a, b) => b.needed - a.needed);

                // Allocate remaining money to categories with highest need
                let allocated = 0;
                for (const category of sortedCategories) {
                  if (category.needed > 0 && allocated < validatedRemaining) {
                    const toAllocate = validateAmount(
                      Math.min(category.needed, validatedRemaining - allocated)
                    );
                    const currentAllocation = validateAmount(newAllocations[category.id] || 0);
                    newAllocations[category.id] = validateAmount(currentAllocation + toAllocate);
                    allocated = validateAmount(allocated + toAllocate);

                    if (allocated >= validatedRemaining) break;
                  }
                }

                setAllocations(newAllocations);
                setTotalAllocated(validateAmount(totalAllocated + allocated));
                setRemaining(validateAmount(validatedRemaining - allocated));
              }}
              className="btn-secondary px-3 py-1 text-sm rounded"
            >
              Allocate to Needs
            </button>

            <button
              onClick={() => {
                // Divide remaining equally between all categories
                const validatedRemaining = validateAmount(remaining);
                const perCategory = validateAmount(validatedRemaining / categories.length);
                const newAllocations = { ...allocations };

                categories.forEach(category => {
                  const currentAllocation = validateAmount(newAllocations[category.id] || 0);
                  newAllocations[category.id] = validateAmount(currentAllocation + perCategory);
                });

                setAllocations(newAllocations);
                setTotalAllocated(validateAmount(paycheck.amount));
                setRemaining(0);
              }}
              className="btn-secondary px-3 py-1 text-sm rounded"
            >
              Divide Evenly
            </button>

            <button
              onClick={() => {
                // Reset all allocations
                const validatedPaycheck = validatePaycheckData(paycheck);
                const newAllocations = {};
                categories.forEach(category => {
                  newAllocations[category.id] = 0;
                });

                setAllocations(newAllocations);
                setTotalAllocated(0);
                setRemaining(validatedPaycheck ? validateAmount(validatedPaycheck.amount) : 0);
              }}
              className="btn-secondary px-3 py-1 text-sm rounded"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setStep('start')}
            className="btn-secondary px-4 py-2 rounded"
          >
            Back
          </button>

          <button
            onClick={handleCompleteAllocation}
            className="btn-primary px-4 py-2 rounded"
            disabled={totalAllocated <= 0}
          >
            {remaining > 0
              ? `Complete & Leave ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remaining)} Unallocated`
              : 'Complete Allocation'}
          </button>
        </div>
      </div>
    );
  }

  // Complete step - summary and finish
  if (step === 'complete') {
    return (
      <div className="payday-workflow bg-theme-primary rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Allocation Complete!</h2>

        <div className="mb-6">
          <p className="mb-2">You've allocated:</p>
          <div className="text-3xl font-bold text-theme-accent">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAllocated)}
          </div>

          {remaining > 0 && (
            <p className="mt-2">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remaining)} remains unallocated and is available for future budgeting.
            </p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Summary:</h3>
          <ul className="max-h-48 overflow-y-auto">
            {Object.entries(allocations)
              .filter(([_, amount]) => validateAmount(amount) > 0)
              .map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === parseInt(categoryId, 10));
                const validatedAmount = validateAmount(amount);
                return (
                  <li key={categoryId} className="flex justify-between py-1">
                    <span>{category ? category.name : `Category ${categoryId}`}</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(validatedAmount)}</span>
                  </li>
                );
              })}
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="btn-secondary px-4 py-2 rounded mr-2"
          >
            Start Over
          </button>

          <button
            onClick={() => {
              if (onComplete) {
                const validatedPaycheck = validatePaycheckData(paycheck);
                onComplete({
                  paycheck: validatedPaycheck,
                  totalAllocated: validateAmount(totalAllocated),
                  remaining: validateAmount(remaining),
                  allocations: Object.fromEntries(
                    Object.entries(allocations).map(([id, amount]) => [id, validateAmount(amount)])
                  ),
                  completed: true
                });
              }
            }}
            className="btn-primary px-4 py-2 rounded"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PaydayWorkflow;