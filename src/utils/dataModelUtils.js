// src/utils/dataModelUtils.js
/**
 * Utility functions for standardizing the data model using planningItems and activeBudgetAllocations
 * as the single source of truth.
 */

/**
 * Convert an expense to a planning item
 * @param {Object} expense - Expense object
 * @returns {Object} Planning item
 */
export const expenseToPlanningItem = (expense) => {
  return {
    id: expense.id,
    name: expense.name,
    type: 'expense',
    amount: expense.amount,
    frequency: expense.frequency,
    categoryId: expense.categoryId,
    priority: expense.priority,
    alreadySaved: expense.alreadySaved || 0,
    dueDate: expense.dueDate || '',
    allocationPaused: expense.allocationPaused || false,
    isRecurringExpense: expense.isRecurringExpense || false,
    priorityState: expense.priorityState || 'active',
    accountId: expense.accountId || 1,
    isActive: !expense.allocationPaused && expense.priorityState !== 'paused',
    collapsed: expense.collapsed || true,
  };
};

/**
 * Convert a savings goal to a planning item
 * @param {Object} goal - Savings goal object
 * @returns {Object} Planning item
 */
export const goalToPlanningItem = (goal) => {
  return {
    id: goal.id,
    name: goal.name,
    type: 'savings-goal',
    targetAmount: goal.targetAmount,
    monthlyContribution: goal.monthlyContribution,
    targetDate: goal.targetDate || '',
    categoryId: goal.categoryId,
    alreadySaved: goal.alreadySaved || 0,
    allocationPaused: goal.allocationPaused || false,
    priorityState: goal.priorityState || 'active',
    accountId: goal.accountId || 1,
    isActive: !goal.allocationPaused && goal.priorityState !== 'paused',
    collapsed: goal.collapsed || true,
  };
};

/**
 * Convert a planning item to an expense or savings goal
 * @param {Object} planningItem - Planning item
 * @returns {Object} Expense or savings goal
 */
export const planningItemToOriginal = (planningItem) => {
  if (planningItem.type === 'savings-goal') {
    return {
      id: planningItem.id,
      name: planningItem.name,
      targetAmount: planningItem.targetAmount,
      monthlyContribution: planningItem.monthlyContribution,
      targetDate: planningItem.targetDate,
      categoryId: planningItem.categoryId,
      alreadySaved: planningItem.alreadySaved || 0,
      allocationPaused: !planningItem.isActive,
      collapsed: planningItem.collapsed,
      priorityState: planningItem.priorityState,
      accountId: planningItem.accountId,
    };
  } else {
    return {
      id: planningItem.id,
      name: planningItem.name,
      amount: planningItem.amount,
      frequency: planningItem.frequency,
      categoryId: planningItem.categoryId,
      priority: planningItem.priority,
      alreadySaved: planningItem.alreadySaved || 0,
      dueDate: planningItem.dueDate,
      allocationPaused: !planningItem.isActive,
      collapsed: planningItem.collapsed,
      isRecurringExpense: planningItem.isRecurringExpense,
      priorityState: planningItem.priorityState,
      accountId: planningItem.accountId,
    };
  }
};

/**
 * Create a budget allocation for a planning item
 * @param {Object} planningItem - Planning item
 * @param {Array} existingAllocations - Existing allocations
 * @returns {Object} Budget allocation
 */
export const createBudgetAllocation = (planningItem, existingAllocations = []) => {
  const monthlyAmount = planningItem.type === 'savings-goal'
    ? planningItem.monthlyContribution
    : planningItem.amount;

  return {
    id: Math.max(...existingAllocations.map(a => a.id), 0) + 1,
    planningItemId: planningItem.id,
    categoryId: planningItem.categoryId,
    monthlyAllocation: monthlyAmount,
    perPaycheckAmount: 0, // This will be calculated later
    sourceAccountId: planningItem.accountId,
    isPaused: false,
    createdAt: new Date().toISOString()
  };
};

/**
 * Convert expenses and savings goals to planning items
 * @param {Array} expenses - Expenses array
 * @param {Array} savingsGoals - Savings goals array
 * @returns {Array} Planning items
 */
export const convertToUnifiedModel = (expenses = [], savingsGoals = []) => {
  const expenseItems = expenses.map(expenseToPlanningItem);
  const goalItems = savingsGoals.map(goalToPlanningItem);
  return [...expenseItems, ...goalItems];
};

/**
 * Create active budget allocations from planning items
 * @param {Array} planningItems - Planning items
 * @returns {Array} Active budget allocations
 */
export const createActiveBudgetAllocations = (planningItems = []) => {
  // Only create allocations for items that don't need allocation
  const readyItems = planningItems.filter(item =>
    item.isActive && !item.needsAllocation && item.allocated > 0
  );

  return readyItems.map((item, index) => {
    const monthlyAmount = item.type === 'savings-goal'
      ? item.monthlyContribution
      : item.amount;

    return {
      id: index + 1,
      planningItemId: item.id,
      categoryId: item.categoryId,
      monthlyAllocation: item.allocated || monthlyAmount,
      perPaycheckAmount: 0, // This will be calculated later
      sourceAccountId: item.accountId || 1,
      isPaused: false,
      createdAt: new Date().toISOString()
    };
  });
};

/**
 * Filter planning items to get expenses
 * @param {Array} planningItems - Planning items
 * @returns {Array} Expenses
 */
export const getExpensesFromPlanningItems = (planningItems = []) => {
  return planningItems
    .filter(item => item.type === 'expense')
    .map(planningItemToOriginal);
};

/**
 * Filter planning items to get savings goals
 * @param {Array} planningItems - Planning items
 * @returns {Array} Savings goals
 */
export const getSavingsGoalsFromPlanningItems = (planningItems = []) => {
  return planningItems
    .filter(item => item.type === 'savings-goal')
    .map(planningItemToOriginal);
};

/**
 * Update a planning item in the array
 * @param {Array} planningItems - Planning items array
 * @param {Object} updatedItem - Updated planning item
 * @returns {Array} Updated planning items array
 */
export const updatePlanningItem = (planningItems = [], updatedItem) => {
  return planningItems.map(item =>
    item.id === updatedItem.id ? { ...item, ...updatedItem } : item
  );
};

/**
 * Add a new planning item to the array
 * @param {Array} planningItems - Planning items array
 * @param {Object} newItem - New planning item
 * @returns {Array} Updated planning items array
 */
export const addPlanningItem = (planningItems = [], newItem) => {
  // Generate a new ID if not provided
  const itemWithId = {
    ...newItem,
    id: newItem.id || Math.max(...planningItems.map(item => item.id), 0) + 1
  };
  return [...planningItems, itemWithId];
};

/**
 * Remove a planning item from the array
 * @param {Array} planningItems - Planning items array
 * @param {number} itemId - ID of the item to remove
 * @returns {Array} Updated planning items array
 */
export const removePlanningItem = (planningItems = [], itemId) => {
  return planningItems.filter(item => item.id !== itemId);
};

/**
 * Update a budget allocation in the array
 * @param {Array} allocations - Budget allocations array
 * @param {Object} updatedAllocation - Updated budget allocation
 * @returns {Array} Updated budget allocations array
 */
export const updateBudgetAllocation = (allocations = [], updatedAllocation) => {
  return allocations.map(allocation =>
    allocation.id === updatedAllocation.id ? { ...allocation, ...updatedAllocation } : allocation
  );
};

/**
 * Add a new budget allocation to the array
 * @param {Array} allocations - Budget allocations array
 * @param {Object} newAllocation - New budget allocation
 * @returns {Array} Updated budget allocations array
 */
export const addBudgetAllocation = (allocations = [], newAllocation) => {
  // Generate a new ID if not provided
  const allocationWithId = {
    ...newAllocation,
    id: newAllocation.id || Math.max(...allocations.map(a => a.id), 0) + 1
  };
  return [...allocations, allocationWithId];
};

/**
 * Remove a budget allocation from the array
 * @param {Array} allocations - Budget allocations array
 * @param {number} allocationId - ID of the allocation to remove
 * @returns {Array} Updated budget allocations array
 */
export const removeBudgetAllocation = (allocations = [], allocationId) => {
  return allocations.filter(allocation => allocation.id !== allocationId);
};

/**
 * Remove budget allocations for a planning item
 * @param {Array} allocations - Budget allocations array
 * @param {number} planningItemId - ID of the planning item
 * @returns {Array} Updated budget allocations array
 */
export const removeBudgetAllocationsForItem = (allocations = [], planningItemId) => {
  return allocations.filter(allocation => allocation.planningItemId !== planningItemId);
};

/**
 * Calculate per-paycheck amounts for budget allocations
 * @param {Array} allocations - Budget allocations array
 * @param {string} payFrequency - Pay frequency (e.g., 'bi-weekly', 'monthly')
 * @param {Array} payFrequencyOptions - Pay frequency options
 * @returns {Array} Updated budget allocations array with calculated per-paycheck amounts
 */
export const calculatePerPaycheckAmounts = (allocations = [], payFrequency, payFrequencyOptions = []) => {
  const payFreqOption = payFrequencyOptions.find(opt => opt.value === payFrequency);
  const paychecksPerMonth = payFreqOption?.paychecksPerMonth || 2.17; // Default to bi-weekly

  return allocations.map(allocation => {
    const perPaycheckAmount = (allocation.monthlyAllocation || 0) / paychecksPerMonth;
    return {
      ...allocation,
      perPaycheckAmount
    };
  });
};

/**
 * Toggle a planning item's active status
 * @param {Array} planningItems - Planning items array
 * @param {number} itemId - ID of the item to toggle
 * @param {boolean} isActive - New active status
 * @param {Array} allocations - Budget allocations array
 * @param {Array} accounts - Accounts array
 * @returns {Object} Updated planning items and allocations
 */
export const togglePlanningItemActive = (planningItems = [], itemId, isActive) => {
  // Only update the planning item's active state
  const updatedItems = planningItems.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        isActive,
        allocationPaused: !isActive,
        priorityState: isActive ? 'active' : 'paused',
        needsAllocation: isActive // Track items that need allocation
      };
    }
    return item;
  });

  return {
    planningItems: updatedItems,
    allocations: [] // Return empty array to maintain interface
  };
};