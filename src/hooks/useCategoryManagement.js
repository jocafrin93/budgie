// src/hooks/useCategoryManagement.js
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing categories
 * Extracts category-related state and operations from App.js
 */
export const useCategoryManagement = () => {
  // Categories state
  const [categories, setCategories] = useLocalStorage('budgetCalc_categories', [
    {
      id: 1,
      name: 'Personal Care',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      collapsed: false,
      allocated: 0,
      spent: 0,
      lastFunded: null,
      targetBalance: 0,
      autoFunding: {
        enabled: false,
        maxAmount: 500,
        priority: 'medium'
      }
    },
    {
      id: 2,
      name: 'Pet Care',
      color: 'bg-gradient-to-r from-green-500 to-blue-500',
      collapsed: false,
      allocated: 0,
      spent: 0,
      lastFunded: null,
      targetBalance: 0,
      autoFunding: {
        enabled: false,
        maxAmount: 500,
        priority: 'medium'
      }
    },
    {
      id: 3,
      name: 'Savings Goals',
      color: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      collapsed: false,
      allocated: 0,
      spent: 0,
      lastFunded: null,
      targetBalance: 0,
      autoFunding: {
        enabled: false,
        maxAmount: 500,
        priority: 'medium'
      }
    },
  ]);

  /**
   * Generate the next category ID
   */
  const generateNextCategoryId = useCallback(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map(c => c.id)) + 1;
  }, [categories]);

  /**
   * Add a new category
   */
  const addCategory = useCallback((categoryData) => {
    const newCategory = {
      ...categoryData,
      id: generateNextCategoryId(),
      collapsed: false,
      allocated: 0,
      spent: 0,
      lastFunded: null,
      targetBalance: 0,
      autoFunding: {
        enabled: false,
        maxAmount: 500,
        priority: 'medium'
      }
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [generateNextCategoryId, setCategories]);

  /**
   * Update an existing category
   */
  const updateCategory = useCallback((categoryId, categoryData) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, ...categoryData } : cat
    ));
  }, [setCategories]);

  /**
   * Delete a category
   * Note: This doesn't handle moving items to another category - that should be done by the caller
   */
  const deleteCategory = useCallback((categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  }, [setCategories]);

  /**
   * Fund a category with a specific amount
   */
  const fundCategory = useCallback((categoryId, amount) => {
    setCategories(prev => prev.map(category =>
      category.id === categoryId
        ? {
          ...category,
          allocated: (category.allocated || 0) + amount,
          lastFunded: new Date().toISOString()
        }
        : category
    ));
  }, [setCategories]);

  /**
   * Toggle a category's collapsed state
   */
  const toggleCategoryCollapse = useCallback((categoryId) => {
    setCategories(prev => prev.map(category =>
      category.id === categoryId ? { ...category, collapsed: !category.collapsed } : category
    ));
  }, [setCategories]);

  /**
   * Calculate the total amount available to allocate
   */
  const calculateToBeAllocated = useCallback((accounts) => {
    // Total money in all accounts
    const totalAccountBalance = accounts.reduce((total, account) => {
      return total + (account.balance || 0);
    }, 0);

    // Total money already allocated to categories
    const totalAllocated = categories.reduce((total, category) => {
      return total + (category.allocated || 0);
    }, 0);

    // Money available to allocate = Account balances - Already allocated
    const toBeAllocated = totalAccountBalance - totalAllocated;

    return {
      totalAccountBalance,
      totalAllocated,
      toBeAllocated
    };
  }, [categories]);

  /**
   * Update category allocations based on active budget items
   */
  const calculateCorrectCategoryAllocations = useCallback(() => {
    try {
      const currentPlanningItems = JSON.parse(localStorage.getItem('budgetCalc_planningItems') || '[]');
      const currentAllocations = JSON.parse(localStorage.getItem('budgetCalc_activeBudgetAllocations') || '[]');

      // Calculate what each category SHOULD have allocated based on active items only
      const calculatedCategoryTotals = {};

      currentAllocations.forEach(allocation => {
        const planningItem = currentPlanningItems.find(item => item.id === allocation.planningItemId);

        // Only count allocations for items that exist and are active
        if (planningItem && planningItem.isActive) {
          if (!calculatedCategoryTotals[allocation.categoryId]) {
            calculatedCategoryTotals[allocation.categoryId] = 0;
          }
          // Convert monthly allocation to current balance (for now, using monthly amount)
          calculatedCategoryTotals[allocation.categoryId] += allocation.monthlyAllocation || 0;
        }
      });

      // Update categories to match calculated totals
      let totalReclaimed = 0;
      setCategories(prev => prev.map(category => {
        const shouldHaveAllocated = calculatedCategoryTotals[category.id] || 0;
        const currentlyAllocated = category.allocated || 0;

        // Only update if there's a meaningful discrepancy (more than 1 cent)
        if (Math.abs(currentlyAllocated - shouldHaveAllocated) > 0.01) {
          const difference = currentlyAllocated - shouldHaveAllocated;
          totalReclaimed += difference;

          console.log(`Correcting ${category.name}: was $${currentlyAllocated.toFixed(2)}, should be $${shouldHaveAllocated.toFixed(2)} (${difference > 0 ? 'reclaiming' : 'allocating'} $${Math.abs(difference).toFixed(2)})`);

          return {
            ...category,
            allocated: shouldHaveAllocated,
            lastFunded: shouldHaveAllocated > currentlyAllocated ? new Date().toISOString() : category.lastFunded
          };
        }

        return category;
      }));

      if (totalReclaimed > 0.01) {
        console.log(`Total money reclaimed: $${totalReclaimed.toFixed(2)}`);
      }

      return totalReclaimed;
    } catch (error) {
      console.error('Error calculating category allocations:', error);
      return 0;
    }
  }, [setCategories]);

  return {
    categories,
    setCategories,
    generateNextCategoryId,
    addCategory,
    updateCategory,
    deleteCategory,
    fundCategory,
    toggleCategoryCollapse,
    calculateToBeAllocated,
    calculateCorrectCategoryAllocations
  };
};