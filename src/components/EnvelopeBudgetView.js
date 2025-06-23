// src/components/EnvelopeBudgetView.js
import { AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { frequencyOptions } from '../utils/constants';
import CurrencyInput from './CurrencyInput';


/**
 * EnvelopeBudgetView component
 * 
 * This component provides a YNAB-style envelope budgeting interface
 * where categories are the primary budgeting units, not individual expenses.
 */
const EnvelopeBudgetView = ({
  // Data
  categories = [],
  planningItems = [],
  toBeAllocated = 0,

  // Functions from useEnvelopeBudgeting
  fundCategory,
  moveMoney,

  // Actions
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItemActive,

  // Optional
  onShowPaydayWorkflow,
  recentPaycheck = null,

  // Paycheck configuration
  payFrequency,
  payFrequencyOptions
}) => {
  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // State for moving money between categories (now includes Ready to Assign)
  const [movingMoney, setMovingMoney] = useState(false);
  const [moveFromCategory, setMoveFromCategory] = useState(null);
  const [moveToCategoryId, setMoveToCategoryId] = useState(null);
  const [moveAmount, setMoveAmount] = useState(0);
  const [moveNote, setMoveNote] = useState('');

  // Special ID for Ready to Assign
  const READY_TO_ASSIGN_ID = 'ready-to-assign';

  // Toggle category expansion
  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get active items for a category with validation
  // Amount display calculation helper
  const getAmountDisplayInfo = (item, payFrequency, payFrequencyOptions) => {
    const isGoal = item.type === 'savings-goal';
    const dueDate = item.dueDate ? new Date(item.dueDate) : null;
    const today = new Date();

    // Conservative paycheck info
    const getConservativePaycheckInfo = (payFreq) => {
      switch (payFreq) {
        case 'weekly': return { conservative: 4, average: 4.33, bonusPerYear: 4 };
        case 'biweekly': case 'bi-weekly': return { conservative: 2, average: 2.17, bonusPerYear: 2 };
        case 'semimonthly': return { conservative: 2, average: 2, bonusPerYear: 0 };
        case 'monthly': return { conservative: 1, average: 1, bonusPerYear: 0 };
        default: return { conservative: 2, average: 2.17, bonusPerYear: 2 };
      }
    };

    const paycheckInfo = getConservativePaycheckInfo(payFrequency);
    const daysPerPaycheck = Math.ceil(30 / paycheckInfo.average);

    let monthlyAmount = 0;
    let perPaycheckAmount = 0;

    const freqOption = frequencyOptions.find(opt => opt.value === item.frequency);

    if (isGoal) {
      // For savings goals, always use conservative approach
      monthlyAmount = item.monthlyContribution || 0;
      perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
    } else {
      // For expenses, use your perfect hybrid approach from constants
      const itemAmount = item.amount || 0;
      const freqOption = frequencyOptions.find(opt => opt.value === item.frequency);

      if (freqOption) {
        // Convert item amount to monthly equivalent
        monthlyAmount = itemAmount * (freqOption.weeksPerYear / 12);

        // Use your isRegular flag for hybrid strategy!
        if (freqOption.isRegular) {
          // CONSERVATIVE: Use minimum paycheck count for regular expenses
          perPaycheckAmount = monthlyAmount / paycheckInfo.conservative;
        } else {
          // TRUE AVERAGE: Use accurate average for irregular expenses  
          perPaycheckAmount = monthlyAmount / paycheckInfo.average;
        }
      } else {
        // Fallback for unknown frequencies
        monthlyAmount = itemAmount;
        perPaycheckAmount = itemAmount / paycheckInfo.conservative;
      }
    }

    // Handle due dates
    let paychecksUntilDue = null;
    if (dueDate) {
      const dueTime = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
      const todayTime = new Date(today.getTime() + today.getTimezoneOffset() * 60000);
      const daysUntilDue = Math.ceil((dueTime - todayTime) / (24 * 60 * 60 * 1000));

      paychecksUntilDue = Math.max(0, Math.ceil(daysUntilDue / daysPerPaycheck));

      if (paychecksUntilDue > 0) {
        const allocated = item.allocated || 0;
        const targetAmount = isGoal ? item.targetAmount : monthlyAmount;
        const remaining = Math.max(0, targetAmount - allocated);
        perPaycheckAmount = remaining / paychecksUntilDue;
      }
    }

    return {
      monthlyAmount,
      perPaycheckAmount,
      paychecksUntilDue,
      usingConservative: !freqOption || freqOption.isRegular,
      paycheckInfo
    };
  };

  const getFrequencyDisplay = (item) => {
    if (item.type === 'savings-goal') {
      return `Target: $${(item.targetAmount || 0).toFixed(2)}`;
    }
    const freqOption = frequencyOptions.find(opt => opt.value === item.frequency);
    const freqLabel = freqOption ? freqOption.label.toLowerCase() : (item.frequency || 'monthly');

    return `$${(item.amount || 0).toFixed(2)} ${freqLabel}`;
  };

  const getCategoryItems = (categoryId) => {
    return planningItems.filter(item => {
      // Skip items without valid category
      if (!item.categoryId || !categories.find(c => c.id === item.categoryId)) {
        return false;
      }
      return item.categoryId === categoryId &&
        (item.isActive || (!item.allocationPaused && item.priorityState === 'active'));
    });
  };

  // Get inactive items for a category with validation
  const getInactiveItems = (categoryId) => {
    return planningItems.filter(item => {
      // Skip items without valid category
      if (!item.categoryId || !categories.find(c => c.id === item.categoryId)) {
        return false;
      }
      return item.categoryId === categoryId &&
        (!item.isActive || (item.allocationPaused || item.priorityState !== 'active'));
    });
  };

  // Check if a category is overspent
  const isOverspent = (category) => {
    return (category.available || 0) < 0;
  };

  // Handle starting to move money
  const handleStartMoveMoney = (category) => {
    console.log("Opening move money dialog for category:", category.name);
    setMovingMoney(true);
    setMoveFromCategory(category);
    setMoveToCategoryId(null);
    setMoveAmount(0);
    setMoveNote('');
  };

  // Handle cancel of moving money
  const handleCancelMoveMoney = () => {
    console.log("Canceling move money dialog");
    setMovingMoney(false);
    setMoveFromCategory(null);
    setMoveToCategoryId(null);
    setMoveAmount(0);
    setMoveNote('');
  };

  // Handle submit of moving money
  const handleSubmitMoveMoney = () => {
    // Convert ID to number if it's not the special READY_TO_ASSIGN_ID
    const categoryId = moveToCategoryId === READY_TO_ASSIGN_ID ?
      READY_TO_ASSIGN_ID :
      parseInt(moveToCategoryId, 10);

    // Find category by numeric ID for proper name display
    const targetCategory = categoryId === READY_TO_ASSIGN_ID ?
      { name: 'Ready to Assign' } :
      categories.find(c => c.id === parseInt(categoryId, 10));

    console.log(`Moving $${moveAmount} from ${moveFromCategory?.name} to ${targetCategory?.name || 'Unknown category'}`);

    if (!moveFromCategory || !categoryId || moveAmount <= 0) {
      console.error("Invalid move parameters");
      return;
    }

    // Handle moving to Ready to Assign (special case)
    if (categoryId === READY_TO_ASSIGN_ID) {
      const success = fundCategory(moveFromCategory.id, -moveAmount);
      if (success) {
        console.log(`Successfully moved ${moveAmount} from ${moveFromCategory.name} to Ready to Assign`);
      } else {
        console.error("Failed to move money to Ready to Assign");
      }
    }
    // Handle moving from Ready to Assign (special case)
    else if (moveFromCategory.id === READY_TO_ASSIGN_ID) {
      const success = fundCategory(categoryId, moveAmount);
      if (success) {
        console.log(`Successfully moved ${moveAmount} from Ready to Assign to ${targetCategory?.name || 'category ' + categoryId}`);
      } else {
        console.error("Failed to move money from Ready to Assign");
      }
    }
    // Normal category-to-category move
    else {
      moveMoney(moveFromCategory.id, moveToCategoryId, moveAmount, moveNote);
    }

    // Reset state regardless of outcome
    setMovingMoney(false);
    setMoveFromCategory(null);
    setMoveToCategoryId(null);
    setMoveAmount(0);
    setMoveNote('');
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="envelope-budget p-4">
      {/* To Be Allocated section */}
      <div className="to-be-allocated mb-6 p-4 bg-theme-primary rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Ready to Assign</h2>
            <div className={`text-2xl font-bold ${toBeAllocated < 0 ? 'text-red-500' : 'text-theme-accent'}`}>
              {formatCurrency(toBeAllocated)}
            </div>

            <button
              onClick={() => {
                // Create a virtual "Ready to Assign" category for the move money dialog
                setMovingMoney(true);
                setMoveFromCategory({
                  id: READY_TO_ASSIGN_ID,
                  name: "Ready to Assign",
                  available: toBeAllocated
                });
                setMoveToCategoryId(null);
                setMoveAmount(0);
                setMoveNote('');
              }}
              className="text-sm text-theme-accent hover:underline mt-1"
              disabled={toBeAllocated <= 0}
            >
              Assign to Categories
            </button>
          </div>

          <div className="flex">
            {recentPaycheck && (
              <div className="mr-4 text-right">
                <p className="text-sm">Recent Paycheck:</p>
                <p>{formatCurrency(recentPaycheck.amount)}</p>
                <button
                  onClick={onShowPaydayWorkflow}
                  className="text-sm text-theme-accent hover:underline"
                >
                  Allocate this paycheck
                </button>
              </div>
            )}

            {/* <button
              onClick={openAddCategoryModal}
              className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Unified Money Moving dialog */}
      {movingMoney && moveFromCategory && (
        <div className="move-money-dialog mb-6 p-4 bg-theme-primary rounded-lg shadow border-2 border-theme-accent">
          <h3 className="text-lg font-semibold mb-2">Move Money</h3>

          <div className="flex items-center mb-4">
            <div className="flex-1">
              <p className="text-sm">From:</p>
              <p className="font-semibold">{moveFromCategory.name}</p>
              <p className="text-sm">Available: {formatCurrency(moveFromCategory.available)}</p>
            </div>

            <ArrowRight size={24} className="mx-4 text-theme-secondary" />

            <div className="flex-1">
              <p className="text-sm">To:</p>
              <select
                value={moveToCategoryId || ''}
                onChange={e => setMoveToCategoryId(e.target.value)}
                className="w-full p-2 border rounded bg-theme-primary"
              >
                <option value="">Select a destination</option>

                {/* Include Ready to Assign as an option if not already the source */}
                {moveFromCategory.id !== READY_TO_ASSIGN_ID && (
                  <option value={READY_TO_ASSIGN_ID}>Ready to Assign</option>
                )}

                {/* List all categories except the source category */}
                {categories
                  .filter(c => c.id !== moveFromCategory.id)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm mb-1">Amount:</p>
            <CurrencyInput
              value={moveAmount}
              onChange={(e) => {
                console.log("Setting move amount to:", e.target.value);
                setMoveAmount(e.target.value);
              }}
              className="w-full p-2 border rounded bg-theme-primary"
              max={moveFromCategory.available}
            />

            {/* Show available to assign if moving from Ready to Assign */}
            {moveFromCategory.id === READY_TO_ASSIGN_ID && (
              <p className="text-xs text-theme-secondary mt-1">
                {toBeAllocated > 0
                  ? `You have ${formatCurrency(toBeAllocated)} available to assign`
                  : "You don't have any money to assign"}
              </p>
            )}
          </div>

          {/* Only show note field for category-to-category moves */}
          {moveFromCategory.id !== READY_TO_ASSIGN_ID && moveToCategoryId !== READY_TO_ASSIGN_ID && (
            <div className="mb-4">
              <p className="text-sm mb-1">Note (optional):</p>
              <input
                type="text"
                value={moveNote}
                onChange={e => setMoveNote(e.target.value)}
                className="w-full p-2 border rounded bg-theme-primary"
                placeholder="Why are you moving this money?"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleCancelMoveMoney}
              className="btn-secondary px-3 py-1 rounded mr-2"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmitMoveMoney}
              className="btn-primary px-3 py-1 rounded"
              disabled={!moveToCategoryId || moveAmount <= 0 || moveAmount > moveFromCategory.available}
            >
              Move Money
            </button>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="categories">
        {categories.map(category => {
          const isExpanded = expandedCategories[category.id];
          const categoryItems = getCategoryItems(category.id);
          const inactiveItems = getInactiveItems(category.id);
          const overspent = isOverspent(category);

          return (
            <div
              key={category.id}
              className={`category mb-4 rounded-lg shadow overflow-hidden ${overspent ? 'border-red-500 border-2' : ''}`}
            >
              {/* Category header */}
              <div className="category-header p-3 bg-theme-primary flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCategoryExpanded(category.id)}
                    className="mr-2 focus:outline-none"
                  >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <div
                    className={`w-4 h-4 rounded-full mr-2 ${category.color || 'bg-gray-400'}`}
                  ></div>

                  <h3 className="font-semibold">{category.name}</h3>

                  {overspent && (
                    <div className="ml-2 text-red-500 flex items-center">
                      <AlertTriangle size={16} className="mr-1" />
                      Overspent
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="text-sm text-theme-secondary">Available</div>
                    <div className={`font-semibold ${overspent ? 'text-red-500' : ''}`}>
                      {formatCurrency(category.available)}
                    </div>
                  </div>

                  <div className="flex">
                    {/* Single unified "Move Money" button */}
                    <button
                      onClick={() => handleStartMoveMoney(category)}
                      className="btn-outline px-2 py-1 rounded mr-1 text-sm"
                    >
                      Move Money
                    </button>

                    <button
                      onClick={() => onEditCategory(category.id)}
                      className="btn-icon p-1 rounded"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Category details when expanded */}
              {isExpanded && (
                <div className="category-details bg-theme-primary bg-opacity-50 p-3">
                  {/* Active planning items */}
                  {categoryItems.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-2">Active Items</h4>
                      <div className="space-y-2">
                        {categoryItems.map(item => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 rounded bg-theme-primary bg-opacity-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-theme-primary truncate">{item.name}</h4>
                                {item.type === 'savings-goal' && (
                                  <svg className="w-3 h-3 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                                <span className="font-semibold text-theme-primary">
                                  ${getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).perPaycheckAmount.toFixed(0)}/check
                                </span>
                                <span>•</span>
                                <span>{getFrequencyDisplay(item)}</span>
                                {item.dueDate && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                      {new Date(item.dueDate).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: 'UTC'
                                      })}
                                    </span>
                                    {getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).paychecksUntilDue !== null && (
                                      <>
                                        <span>•</span>
                                        <span className="text-xs">
                                          {getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).paychecksUntilDue} paychecks remaining
                                        </span>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="text-right mr-2">
                                {item.type === 'savings-goal' ? (
                                  <div>
                                    <div className="text-xs text-theme-secondary">Target</div>
                                    <div>{formatCurrency(item.targetAmount)}</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs text-theme-secondary">Amount</div>
                                    <div>{formatCurrency(item.amount)}</div>
                                  </div>
                                )}
                              </div>

                              <div className="flex">
                                <button
                                  onClick={() => onToggleItemActive(item.id, false)}
                                  className="btn-icon p-1 rounded"
                                  title="Pause item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                </button>

                                <button
                                  onClick={() => onEditItem(item.id)}
                                  className="btn-icon p-1 rounded"
                                  title="Edit item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>

                                <button
                                  onClick={() => {
                                    // Return allocated funds for this item
                                    if (item.allocated > 0) {
                                      fundCategory(item.categoryId, -item.allocated);
                                    }
                                    onDeleteItem(item.id);
                                  }}
                                  className="btn-icon p-1 rounded text-red-500 hover:text-red-600"
                                  title="Delete item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inactive planning items */}
                  {inactiveItems.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-2">Inactive Items</h4>
                      <div className="space-y-2">
                        {inactiveItems.map(item => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 rounded bg-theme-primary bg-opacity-30"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-theme-secondary truncate">{item.name}</h4>
                                {item.type === 'savings-goal' && (
                                  <svg className="w-3 h-3 text-blue-500 flex-shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-theme-secondary">
                                <span className="font-semibold text-theme-secondary">
                                  ${getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).perPaycheckAmount.toFixed(0)}/check
                                </span>
                                <span>•</span>
                                <span>{getFrequencyDisplay(item)}</span>
                                {item.dueDate && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                      {new Date(item.dueDate).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        timeZone: 'UTC'
                                      })}
                                    </span>
                                    {getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).paychecksUntilDue !== null && (
                                      <>
                                        <span>•</span>
                                        <span className="text-xs">
                                          {getAmountDisplayInfo(item, payFrequency, payFrequencyOptions).paychecksUntilDue} paychecks remaining
                                        </span>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="text-right mr-2 text-theme-secondary">
                                {item.type === 'savings-goal' ? (
                                  <div>
                                    <div className="text-xs">Target</div>
                                    <div>{formatCurrency(item.targetAmount)}</div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-xs">Amount</div>
                                    <div>{formatCurrency(item.amount)}</div>
                                  </div>
                                )}
                              </div>

                              <div className="flex">
                                <button
                                  onClick={() => onToggleItemActive(item.id, true)}
                                  className="btn-icon p-1 rounded"
                                  title="Activate item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </button>

                                <button
                                  onClick={() => onEditItem(item.id)}
                                  className="btn-icon p-1 rounded"
                                  title="Edit item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>

                                <button
                                  onClick={() => {
                                    // Return allocated funds for this item
                                    if (item.allocated > 0) {
                                      fundCategory(item.categoryId, -item.allocated);
                                    }
                                    onDeleteItem(item.id);
                                  }}
                                  className="btn-icon p-1 rounded text-red-500 hover:text-red-600"
                                  title="Delete item"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add item button */}
                  <div className="mt-3">
                    <button
                      onClick={() => onAddItem({ type: 'add-item', preselectedCategory: category })}
                      className="btn-outline w-full py-1 px-3 rounded-lg flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Item
                    </button>
                  </div>
                </div>
              )
              }
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default EnvelopeBudgetView;