// src/hooks/useDataModel.js
import { useCallback, useEffect, useRef } from 'react';
import {
  calculatePerPaycheckAmounts,
  convertToUnifiedModel,
  createActiveBudgetAllocations,
  getExpensesFromPlanningItems,
  getSavingsGoalsFromPlanningItems,
  removePlanningItem,
  updatePlanningItem
} from '../utils/dataModelUtils';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing the unified data model
 * @param {Object} options - Configuration options
 * @returns {Object} Data model state and functions
 */
export const useDataModel = ({
  initialExpenses = [],
  initialSavingsGoals = [],
  initialCategories = [],
  initialAccounts = [],
  payFrequency = 'bi-weekly',
  payFrequencyOptions = []
} = {}) => {
  // Legacy state (for backward compatibility)
  const [expenses, setExpenses] = useLocalStorage('budgetCalc_expenses', initialExpenses);
  const [savingsGoals, setSavingsGoals] = useLocalStorage('budgetCalc_savingsGoals', initialSavingsGoals);

  // Unified data model state
  const [planningItems, setPlanningItems] = useLocalStorage('budgetCalc_planningItems', []);
  const [activeBudgetAllocations, setActiveBudgetAllocations] = useLocalStorage('budgetCalc_activeBudgetAllocations', []);

  // Categories and accounts
  const [categories, setCategories] = useLocalStorage('budgetCalc_categories', initialCategories);
  const [accounts, setAccounts] = useLocalStorage('budgetCalc_accounts', initialAccounts);

  // Use refs to track if we're in a sync operation to prevent infinite loops
  const isSyncing = useRef(false);
  const cleanupRef = useRef(false);

  // Initialize planning items from expenses and savings goals if needed
  useEffect(() => {
    if (planningItems.length === 0 && (expenses.length > 0 || savingsGoals.length > 0)) {
      const unifiedItems = convertToUnifiedModel(expenses, savingsGoals);
      setPlanningItems(unifiedItems);

      // Create active budget allocations for active items
      const activeAllocations = createActiveBudgetAllocations(unifiedItems);
      const calculatedAllocations = calculatePerPaycheckAmounts(
        activeAllocations,
        payFrequency,
        payFrequencyOptions
      );
      setActiveBudgetAllocations(calculatedAllocations);
    }
  }, [expenses, savingsGoals, planningItems.length, setPlanningItems, setActiveBudgetAllocations, payFrequency, payFrequencyOptions]);

  // Sync legacy state with unified model when planning items change
  // Use a more careful approach to prevent infinite loops
  useEffect(() => {
    if (planningItems.length > 0 && !isSyncing.current) {
      isSyncing.current = true;

      try {
        const derivedExpenses = getExpensesFromPlanningItems(planningItems);
        const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(planningItems);

        // Create a deep comparison function that's more reliable than JSON.stringify
        const arraysAreEqual = (arr1, arr2) => {
          if (arr1.length !== arr2.length) return false;

          return arr1.every((item1, index) => {
            const item2 = arr2[index];
            if (!item2) return false;

            // Compare key properties
            const keys = ['id', 'name', 'amount', 'targetAmount', 'frequency', 'categoryId', 'priorityState', 'alreadySaved'];
            return keys.every(key => item1[key] === item2[key]);
          });
        };

        // Only update if there are actual differences to avoid infinite loops
        if (!arraysAreEqual(derivedExpenses, expenses)) {
          console.log('Syncing expenses from planning items');
          setExpenses(derivedExpenses);
        }

        if (!arraysAreEqual(derivedSavingsGoals, savingsGoals)) {
          console.log('Syncing savings goals from planning items');
          setSavingsGoals(derivedSavingsGoals);
        }
      } catch (error) {
        console.error('Error syncing legacy state:', error);
      } finally {
        // Use setTimeout to reset the flag after the current execution cycle
        setTimeout(() => {
          isSyncing.current = false;
        }, 0);
      }
    }
  }, [planningItems]); // Remove setExpenses and setSavingsGoals from dependencies

  // Recalculate per-paycheck amounts when pay frequency changes
  useEffect(() => {
    if (activeBudgetAllocations.length > 0) {
      const calculatedAllocations = calculatePerPaycheckAmounts(
        activeBudgetAllocations,
        payFrequency,
        payFrequencyOptions
      );
      setActiveBudgetAllocations(calculatedAllocations);
    }
  }, [payFrequency, payFrequencyOptions, setActiveBudgetAllocations]);

  // Add a new planning item
  const addItem = useCallback((newItem) => {
    console.log('Adding new item:', newItem);

    // Validate category exists and ensure categoryId is a number
    const categoryId = parseInt(newItem.categoryId, 10);
    if (isNaN(categoryId) || !categories.some(cat => cat.id === categoryId)) {
      console.error('Invalid category ID for new item:', newItem);
      return;
    }

    // Ensure the item uses the parsed categoryId
    newItem = {
      ...newItem,
      categoryId
    };

    // Generate ID first to ensure consistency between planning item and budget allocation
    const newItemId = Math.max(...planningItems.map(item => parseInt(item.id || 0, 10)), 0) + 1;

    // Create a copy of the item with the generated ID
    const itemWithId = {
      ...newItem,
      id: newItemId,
      isActive: newItem.isActive || (!newItem.allocationPaused && newItem.priorityState === 'active')
    };

    console.log('Generated ID for new item:', newItemId);

    // Update planning items
    setPlanningItems(prev => {
      const updatedItems = [...prev, itemWithId];
      console.log('Updated planning items:', updatedItems);
      return updatedItems;
    });

    // Mark item as needing allocation if it's active
    if (itemWithId.isActive) {
      itemWithId.needsAllocation = true;
    }
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions]);

  // Update an existing planning item
  const updateItem = useCallback((itemId, updatedItem) => {
    console.log('Updating item:', itemId, updatedItem);

    // Validate category if it's being updated
    if (updatedItem.categoryId) {
      const categoryId = parseInt(updatedItem.categoryId, 10);
      if (isNaN(categoryId) || !categories.some(cat => cat.id === categoryId)) {
        console.error('Invalid category ID for updated item:', updatedItem);
        return;
      }
      updatedItem = {
        ...updatedItem,
        categoryId
      };
    }

    setPlanningItems(prev => {
      const updatedItems = prev.map(item =>
        item.id === itemId ? { ...item, ...updatedItem } : item
      );

      // Update or create budget allocation if active
      if (updatedItem.isActive || (!updatedItem.allocationPaused && updatedItem.priorityState === 'active')) {
        setActiveBudgetAllocations(prevAllocations => {
          const existingAllocation = prevAllocations.find(a => a.planningItemId === itemId);

          if (existingAllocation) {
            // Update existing allocation
            const updatedAllocations = prevAllocations.map(a => {
              if (a.planningItemId === itemId) {
                return {
                  ...a,
                  categoryId: updatedItem.categoryId,
                  monthlyAllocation: updatedItem.type === 'savings-goal'
                    ? updatedItem.monthlyContribution
                    : updatedItem.amount,
                  sourceAccountId: updatedItem.accountId || accounts[0]?.id || 1,
                  isPaused: false
                };
              }
              return a;
            });

            return calculatePerPaycheckAmounts(updatedAllocations, payFrequency, payFrequencyOptions);
          } else {
            // Create new allocation
            const newAllocation = {
              id: Math.max(...prevAllocations.map(a => a.id), 0) + 1,
              planningItemId: itemId,
              categoryId: updatedItem.categoryId,
              monthlyAllocation: updatedItem.type === 'savings-goal'
                ? updatedItem.monthlyContribution
                : updatedItem.amount,
              perPaycheckAmount: 0, // Will be calculated later
              sourceAccountId: updatedItem.accountId || accounts[0]?.id || 1,
              isPaused: false,
              createdAt: new Date().toISOString()
            };

            const newAllocations = [...prevAllocations, newAllocation];
            return calculatePerPaycheckAmounts(newAllocations, payFrequency, payFrequencyOptions);
          }
        });
      } else {
        // Remove allocation if item is not active
        setActiveBudgetAllocations(prev =>
          prev.filter(a => a.planningItemId !== itemId)
        );
      }

      return updatedItems;
    });
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions]);

  // Remove a planning item and return allocated funds
  const removeItem = useCallback((itemId) => {
    console.log('Removing item:', itemId);

    // Get the item's allocation before removing it
    const allocation = activeBudgetAllocations.find(a => a.planningItemId === parseInt(itemId, 10));

    setPlanningItems(prev => {
      const updatedItems = removePlanningItem(prev, parseInt(itemId, 10));

      // Return allocated funds if item was active
      if (allocation) {
        const category = categories.find(c => c.id === parseInt(allocation.categoryId, 10));
        if (category) {
          category.available = (category.available || 0) + (allocation.monthlyAllocation || 0);
        }
      }

      // Remove allocation
      setActiveBudgetAllocations(prev =>
        prev.filter(a => a.planningItemId !== parseInt(itemId, 10))
      );

      // Force immediate sync to prevent reappearance
      if (!isSyncing.current) {
        isSyncing.current = true;
        try {
          const derivedExpenses = getExpensesFromPlanningItems(updatedItems);
          const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(updatedItems);
          setExpenses(derivedExpenses);
          setSavingsGoals(derivedSavingsGoals);
        } finally {
          setTimeout(() => {
            isSyncing.current = false;
          }, 0);
        }
      }

      return updatedItems;
    });
  }, [setPlanningItems, setActiveBudgetAllocations, activeBudgetAllocations, categories, setExpenses, setSavingsGoals]);

  // Toggle a planning item's active status
  const toggleItemActive = useCallback((itemId, isActive) => {
    setPlanningItems(prev => {
      const updatedItems = prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            isActive,
            needsAllocation: isActive, // Set needsAllocation when activating
            allocated: isActive ? 0 : item.allocated // Reset allocation when activating
          };
        }
        return item;
      });

      // Force immediate sync to prevent reappearance
      if (!isSyncing.current) {
        const derivedExpenses = getExpensesFromPlanningItems(updatedItems);
        const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(updatedItems);
        setExpenses(derivedExpenses);
        setSavingsGoals(derivedSavingsGoals);
      }

      return updatedItems;
    });
  }, [setPlanningItems, setExpenses, setSavingsGoals]);

  // Move an item to a different category
  const moveItem = useCallback((itemId, newCategoryId) => {
    // Parse and validate new category ID
    const categoryId = parseInt(newCategoryId, 10);
    if (isNaN(categoryId) || !categories.some(cat => cat.id === categoryId)) {
      console.error('Invalid target category ID for move:', newCategoryId);
      return;
    }

    setPlanningItems(prev => {
      const item = prev.find(i => i.id === itemId);

      if (!item) return prev;

      const updatedItem = {
        ...item,
        categoryId
      };

      const updatedItems = updatePlanningItem(prev, updatedItem);

      // Update allocation if it exists
      if (item.isActive) {
        setActiveBudgetAllocations(prev => {
          const updatedAllocations = prev.map(a => {
            if (a.planningItemId === itemId) {
              return {
                ...a,
                categoryId
              };
            }
            return a;
          });

          return updatedAllocations;
        });
      }

      return updatedItems;
    });
  }, [setPlanningItems, setActiveBudgetAllocations]);

  // Clean up invalid items only when categories change
  useEffect(() => {
    if (cleanupRef.current) return;

    const cleanup = () => {
      cleanupRef.current = true;
      try {
        const validItems = planningItems.filter(item => {
          const isValid = item.categoryId && categories.some(cat => cat.id === parseInt(item.categoryId, 10));
          if (!isValid) {
            // Return any allocated funds before removing invalid item
            const allocation = activeBudgetAllocations.find(a => a.planningItemId === item.id);
            if (allocation) {
              const category = categories.find(c => c.id === parseInt(allocation.categoryId, 10));
              if (category) {
                category.available = (category.available || 0) + (allocation.monthlyAllocation || 0);
              }
            }
          }
          return isValid;
        });

        if (validItems.length !== planningItems.length) {
          console.log(`Cleaning up ${planningItems.length - validItems.length} invalid items`);
          setPlanningItems(validItems);
          setActiveBudgetAllocations(prev =>
            prev.filter(a => validItems.some(item => item.id === a.planningItemId))
          );

          // Force immediate sync
          if (!isSyncing.current) {
            const derivedExpenses = getExpensesFromPlanningItems(validItems);
            const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(validItems);
            setExpenses(derivedExpenses);
            setSavingsGoals(derivedSavingsGoals);
          }
        }
      } finally {
        cleanupRef.current = false;
      }
    };

    cleanup();
  }, [categories]);

  return {
    // Unified data model
    planningItems,
    setPlanningItems,
    activeBudgetAllocations,
    setActiveBudgetAllocations,

    // Legacy state (for backward compatibility)
    expenses,
    setExpenses,
    savingsGoals,
    setSavingsGoals,

    // Categories and accounts
    categories,
    setCategories,
    accounts,
    setAccounts,

    // Actions
    addItem,
    updateItem,
    removeItem,
    toggleItemActive,
    moveItem
  };
};