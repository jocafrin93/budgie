// src/hooks/useDataModel.js
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  convertToUnifiedModel,
  getExpensesFromPlanningItems,
  getSavingsGoalsFromPlanningItems,
  updatePlanningItem,
  addPlanningItem,
  removePlanningItem,
  createActiveBudgetAllocations,
  calculatePerPaycheckAmounts,
  togglePlanningItemActive
} from '../utils/dataModelUtils';

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
  }, [expenses, savingsGoals, planningItems.length, setPlanningItems, setActiveBudgetAllocations]);
  
  // Sync legacy state with unified model when planning items change
  useEffect(() => {
    if (planningItems.length > 0) {
      const derivedExpenses = getExpensesFromPlanningItems(planningItems);
      const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(planningItems);
      
      // Only update if there are actual differences to avoid infinite loops
      if (JSON.stringify(derivedExpenses) !== JSON.stringify(expenses)) {
        setExpenses(derivedExpenses);
      }
      
      if (JSON.stringify(derivedSavingsGoals) !== JSON.stringify(savingsGoals)) {
        setSavingsGoals(derivedSavingsGoals);
      }
    }
  }, [planningItems, setExpenses, setSavingsGoals]);
  
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
    setPlanningItems(prev => {
      const updatedItems = addPlanningItem(prev, newItem);
      
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
      
      return updatedItems;
    });
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions]);
  
  // Update an existing planning item
  const updateItem = useCallback((updatedItem) => {
    setPlanningItems(prev => {
      const updatedItems = updatePlanningItem(prev, updatedItem);
      
      // Update or create budget allocation if active
      if (updatedItem.isActive || (!updatedItem.allocationPaused && updatedItem.priorityState === 'active')) {
        setActiveBudgetAllocations(prev => {
          const existingAllocation = prev.find(a => a.planningItemId === updatedItem.id);
          
          if (existingAllocation) {
            // Update existing allocation
            const updatedAllocations = prev.map(a => {
              if (a.planningItemId === updatedItem.id) {
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
              id: Math.max(...prev.map(a => a.id), 0) + 1,
              planningItemId: updatedItem.id,
              categoryId: updatedItem.categoryId,
              monthlyAllocation: updatedItem.type === 'savings-goal' 
                ? updatedItem.monthlyContribution 
                : updatedItem.amount,
              perPaycheckAmount: 0, // Will be calculated later
              sourceAccountId: updatedItem.accountId || accounts[0]?.id || 1,
              isPaused: false,
              createdAt: new Date().toISOString()
            };
            
            const newAllocations = [...prev, newAllocation];
            return calculatePerPaycheckAmounts(newAllocations, payFrequency, payFrequencyOptions);
          }
        });
      } else {
        // Remove allocation if item is not active
        setActiveBudgetAllocations(prev => 
          prev.filter(a => a.planningItemId !== updatedItem.id)
        );
      }
      
      return updatedItems;
    });
  }, [setPlanningItems, setActiveBudgetAllocations, accounts, payFrequency, payFrequencyOptions]);
  
  // Remove a planning item
  const removeItem = useCallback((itemId) => {
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