// src/hooks/useDataModel.js
import { useCallback, useEffect, useRef } from 'react';
import {
  addPlanningItem,
  calculatePerPaycheckAmounts,
  convertToUnifiedModel,
  createActiveBudgetAllocations,
  getExpensesFromPlanningItems,
  getSavingsGoalsFromPlanningItems,
  removePlanningItem,
  togglePlanningItemActive,
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

    setPlanningItems(prev => {
      const updatedItems = addPlanningItem(prev, newItem);
      console.log('Updated planning items:', updatedItems);

      return updatedItems;
    });

    // If the item is active, create a budget allocation for it
    if (newItem.isActive || (!newItem.allocationPaused && newItem.priorityState === 'active')) {
      const itemWithIsActive = {
        ...newItem,
        isActive: true
      };

      setActiveBudgetAllocations(prev => {
        const newAllocation = {
          id: Math.max(...prev.map(a => a.id), 0) + 1,
          planningItemId: itemWithIsActive.id,
          categoryId: itemWithIsActive.categoryId,
          monthlyAllocation: itemWithIsActive.type === 'savings-goal'
            ? itemWithIsActive.monthlyContribution
            : itemWithIsActive.amount,
          perPaycheckAmount: 0, // Will be calculated later
          sourceAccountId: itemWithIsActive.accountId || accounts[0]?.id || 1,
          isPaused: false,
          createdAt: new Date().toISOString()
        };

        const newAllocations = [...prev, newAllocation];
        return calculatePerPaycheckAmounts(newAllocations, payFrequency, payFrequencyOptions);
      });
    }
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions]);

  // Update an existing planning item
  const updateItem = useCallback((itemId, updatedItem) => {
    console.log('Updating item:', itemId, updatedItem);

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

  // Remove a planning item
  const removeItem = useCallback((itemId) => {
    console.log('Removing item:', itemId);

    setPlanningItems(prev => removePlanningItem(prev, itemId));

    // Remove any allocations for this item
    setActiveBudgetAllocations(prev =>
      prev.filter(a => a.planningItemId !== itemId)
    );
  }, [setPlanningItems, setActiveBudgetAllocations]);

  // Toggle a planning item's active status
  const toggleItemActive = useCallback((itemId, isActive) => {
    const result = togglePlanningItemActive(
      planningItems,
      itemId,
      isActive,
      activeBudgetAllocations,
      accounts
    );

    setPlanningItems(result.planningItems);

    // Calculate per-paycheck amounts for the updated allocations
    const calculatedAllocations = calculatePerPaycheckAmounts(
      result.allocations,
      payFrequency,
      payFrequencyOptions
    );

    setActiveBudgetAllocations(calculatedAllocations);
  }, [
    planningItems,
    activeBudgetAllocations,
    accounts,
    setPlanningItems,
    setActiveBudgetAllocations,
    payFrequency,
    payFrequencyOptions
  ]);

  // Move an item to a different category
  const moveItem = useCallback((itemId, newCategoryId) => {
    setPlanningItems(prev => {
      const item = prev.find(i => i.id === itemId);

      if (!item) return prev;

      const updatedItem = {
        ...item,
        categoryId: newCategoryId
      };

      const updatedItems = updatePlanningItem(prev, updatedItem);

      // Update allocation if it exists
      if (item.isActive) {
        setActiveBudgetAllocations(prev => {
          const updatedAllocations = prev.map(a => {
            if (a.planningItemId === itemId) {
              return {
                ...a,
                categoryId: newCategoryId
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