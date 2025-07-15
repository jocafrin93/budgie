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
import { useStorage } from './useStorage';

/**
 * Custom hook for managing the unified data model
 * @param {Object} options - Configuration options
 * @returns {Object} Data model state and functions
 */
export const useDataModel = ({
  initialExpenses = [],
  initialSavingsGoals = [],
  initialCategories = [],
  initialAccounts = []
} = {}) => {
  // Read pay frequency directly from storage to ensure it stays in sync
  const [payFrequency] = useStorage('budgetCalc_payFrequency', 'biweekly');

  // Pay frequency options
  const payFrequencyOptions = [
    { value: 'weekly', label: 'Weekly', paychecksPerMonth: 4.33 },
    { value: 'biweekly', label: 'Biweekly', paychecksPerMonth: 2.17 },
    { value: 'monthly', label: 'Monthly', paychecksPerMonth: 1 },
    { value: 'semimonthly', label: 'Twice a Month', paychecksPerMonth: 2 }
  ];
  // Legacy state (for backward compatibility)
  const [expenses, setExpenses] = useStorage('budgetCalc_expenses', initialExpenses);
  const [savingsGoals, setSavingsGoals] = useStorage('budgetCalc_savingsGoals', initialSavingsGoals);

  // Unified data model state
  const [planningItems, setPlanningItems] = useStorage('budgetCalc_planningItems', []);
  const [activeBudgetAllocations, setActiveBudgetAllocations] = useStorage('budgetCalc_activeBudgetAllocations', []);

  // Categories and accounts
  const [categories, setCategories] = useStorage('budgetCalc_categories', initialCategories);
  const [accounts, setAccounts] = useStorage('budgetCalc_accounts', initialAccounts);

  // Use refs to track if we're in a sync operation to prevent infinite loops
  const isSyncing = useRef(false);
  const cleanupRef = useRef(false);

  // Add debugging for planningItems changes
  useEffect(() => {
    console.log('🔥 DATAMODEL - planningItems changed:', {
      length: planningItems.length,
      items: planningItems.map(item => ({ id: item.id, name: item.name }))
    });
  }, [planningItems]);

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

  // Ensure all categories have IDs - MIGRATION FIX
  useEffect(() => {
    const categoriesNeedingIds = categories.filter(cat => !cat.id);

    if (categoriesNeedingIds.length > 0) {
      console.log('MIGRATION: Found categories without IDs:', categoriesNeedingIds);

      setCategories(prev => {
        let nextId = Math.max(...prev.filter(cat => cat.id).map(cat => cat.id), 0) + 1;

        return prev.map(cat => {
          if (!cat.id) {
            console.log('MIGRATION: Assigning ID', nextId, 'to category:', cat.name);
            return { ...cat, id: nextId++ };
          }
          return cat;
        });
      });
    }
  }, [categories, setCategories]);

  // DISABLED: Sync legacy state with unified model when planning items change
  // This was causing infinite loops - legacy sync is not critical for core functionality
  // useEffect(() => {
  //   // Sync logic disabled to prevent infinite loops
  // }, []);

  // Recalculate per-paycheck amounts when pay frequency changes
  useEffect(() => {
    if (activeBudgetAllocations.length > 0) {
      const calculatedAllocations = calculatePerPaycheckAmounts(
        activeBudgetAllocations,
        payFrequency,
        payFrequencyOptions
      );

      // Only update if the calculated allocations are actually different
      const hasChanges = calculatedAllocations.some((calc, index) => {
        const current = activeBudgetAllocations[index];
        return !current || calc.perPaycheckAmount !== current.perPaycheckAmount;
      });

      if (hasChanges) {
        setActiveBudgetAllocations(calculatedAllocations);
      }
    }
  }, [activeBudgetAllocations, payFrequency, payFrequencyOptions, setActiveBudgetAllocations]);

  // Add a new planning item
  const addItem = useCallback((newItem) => {
    // Validate category exists and ensure categoryId is a number
    const categoryId = parseInt(newItem.categoryId, 10);

    // Debug logging to see what we're working with
    console.log('🔥 DATAMODEL - Adding item with categoryId:', categoryId);
    console.log('🔥 DATAMODEL - Available categories:', categories.map(cat => ({ id: cat.id, name: cat.name, hasId: 'id' in cat })));
    console.log('🔥 DATAMODEL - Full item data:', newItem);

    // More flexible category validation - handle categories without ID field
    const categoryExists = categories.some((cat, index) => {
      // Check if category has an ID field
      if (cat.id !== undefined) {
        const catId = parseInt(cat.id, 10);
        return catId === categoryId || cat.id === categoryId || cat.id === String(categoryId);
      } else {
        // For categories without ID, use array index + 1 as ID (common pattern)
        return (index + 1) === categoryId;
      }
    });

    if (isNaN(categoryId) || !categoryExists) {
      console.error('🔥 DATAMODEL - Invalid category ID for new item:', newItem);
      console.error('🔥 DATAMODEL - Available categories with IDs:', categories.map((cat, index) => ({
        id: cat.id || (index + 1),
        name: cat.name,
        hasIdField: 'id' in cat
      })));
      return;
    }

    // Generate a more robust ID to prevent collisions
    const newItemId = newItem.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a copy of the item with the generated ID and parsed categoryId
    const itemWithId = {
      ...newItem,
      id: newItemId,
      categoryId,
      isActive: newItem.isActive !== false, // Default to true unless explicitly false
      createdAt: new Date().toISOString() // Add timestamp for debugging
    };

    console.log('🔥 DATAMODEL - Adding item with final data:', itemWithId);

    // Update planning items with error handling
    try {
      setPlanningItems(prev => {
        const updatedItems = [...prev, itemWithId];
        console.log('🔥 DATAMODEL - Updated planning items count:', updatedItems.length);
        console.log('🔥 DATAMODEL - New item in list:', updatedItems.find(item => item.id === newItemId));

        // Force immediate storage write by triggering a re-render
        setTimeout(() => {
          console.log('🔥 DATAMODEL - Verifying item persistence after timeout');
        }, 100);

        return updatedItems;
      });

      // Create budget allocation if item is active
      if (itemWithId.isActive) {
        setActiveBudgetAllocations(prev => {
          const newAllocation = {
            id: Math.max(...prev.map(a => a.id), 0) + 1,
            planningItemId: newItemId,
            categoryId,
            monthlyAllocation: itemWithId.type === 'savings-goal'
              ? itemWithId.monthlyContribution
              : itemWithId.amount,
            perPaycheckAmount: 0, // Will be calculated
            sourceAccountId: itemWithId.accountId || accounts[0]?.id || 1,
            isPaused: false,
            createdAt: new Date().toISOString()
          };

          const newAllocations = [...prev, newAllocation];
          console.log('🔥 DATAMODEL - Created budget allocation for item:', newAllocation);
          return calculatePerPaycheckAmounts(newAllocations, payFrequency, payFrequencyOptions);
        });
      }

      console.log('🔥 DATAMODEL - Item added successfully with ID:', newItemId);

      // Add additional verification
      setTimeout(() => {
        console.log('🔥 DATAMODEL - Post-add verification check:');
        console.log('🔥 DATAMODEL - Current planningItems length:', planningItems.length);
        console.log('🔥 DATAMODEL - All planning item IDs:', planningItems.map(item => item.id));
        console.log('🔥 DATAMODEL - Looking for newly added item:', newItemId);
        const foundItem = planningItems.find(item => item.id === newItemId);
        console.log('🔥 DATAMODEL - Found newly added item:', foundItem ? 'YES' : 'NO');
        if (foundItem) {
          console.log('🔥 DATAMODEL - Item details:', foundItem);
        }
      }, 1000);

      return newItemId; // Return the ID for verification
    } catch (error) {
      console.error('🔥 DATAMODEL - Error adding item:', error);
      throw error;
    }
  }, [setPlanningItems, setActiveBudgetAllocations, categories, accounts, payFrequency, payFrequencyOptions]);



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
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions, categories]);

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
            allocationPaused: !isActive
          };
        }
        return item;
      });
      return updatedItems;
    });

    // Update budget allocations based on active state
    setActiveBudgetAllocations(prev => {
      if (isActive) {
        // If activating and no allocation exists, create one
        const existingAllocation = prev.find(a => a.planningItemId === itemId);
        if (!existingAllocation) {
          const item = planningItems.find(i => i.id === itemId);
          if (item) {
            const newAllocation = {
              id: Math.max(...prev.map(a => a.id), 0) + 1,
              planningItemId: itemId,
              categoryId: item.categoryId,
              monthlyAllocation: item.type === 'savings-goal' ? item.monthlyContribution : item.amount,
              perPaycheckAmount: 0,
              sourceAccountId: item.accountId || accounts[0]?.id || 1,
              isPaused: false,
              createdAt: new Date().toISOString()
            };
            return calculatePerPaycheckAmounts([...prev, newAllocation], payFrequency, payFrequencyOptions);
          }
        }
        return prev;
      } else {
        // If deactivating, remove the allocation
        return prev.filter(a => a.planningItemId !== itemId);
      }
    });
  }, [setPlanningItems, setActiveBudgetAllocations, planningItems, accounts, payFrequency, payFrequencyOptions]);

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
  }, [setPlanningItems, setActiveBudgetAllocations, categories]);

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
  }, [categories, planningItems, activeBudgetAllocations, setPlanningItems, setActiveBudgetAllocations, setExpenses, setSavingsGoals]);

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
