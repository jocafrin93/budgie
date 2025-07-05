// src/hooks/useCategoryManagement.js - UPDATED
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing categories with Enhanced Category Structure
 * Now supports 'single' and 'multiple' category types
 */
export const useCategoryManagement = () => {
  // Categories state - UPDATED with type field
  const [categories, setCategories] = useLocalStorage('budgetCalc_categories', [
    {
      id: 1,
      name: 'Personal Care',
      type: 'multiple', // NEW: Added type field
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
      type: 'multiple', // NEW: Added type field
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
      type: 'multiple', // NEW: Added type field
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
   * Add a new category - UPDATED to require type
   */
  const addCategory = useCallback((categoryData) => {
    // Validate required fields
    if (!categoryData.name?.trim()) {
      throw new Error('Category name is required');
    }

    if (!categoryData.type || !['single', 'multiple'].includes(categoryData.type)) {
      throw new Error('Category type must be either "single" or "multiple"');
    }

    const newCategory = {
      name: categoryData.name.trim(),
      type: categoryData.type, // NEW: Required type field
      color: categoryData.color || 'bg-gradient-to-r from-blue-500 to-purple-500',
      collapsed: false,
      allocated: 0,
      spent: 0,
      available: 0, // NEW: Available balance for envelope budgeting
      lastFunded: null,
      targetBalance: categoryData.targetBalance || 0,
      autoFunding: {
        enabled: categoryData.autoFunding?.enabled || false,
        maxAmount: categoryData.autoFunding?.maxAmount || 500,
        priority: categoryData.autoFunding?.priority || 'medium'
      },
      // NEW: Category type specific settings
      settings: {
        // For single categories - the main expense details
        ...(categoryData.type === 'single' && {
          amount: categoryData.amount || 0,
          frequency: categoryData.frequency || 'monthly',
          dueDate: categoryData.dueDate || null
        }),
        // For multiple categories - organization settings
        ...(categoryData.type === 'multiple' && {
          allowInactiveItems: true,
          autoDistribution: false // Whether to auto-distribute funds among items
        })
      },
      id: generateNextCategoryId()
    };

    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, [generateNextCategoryId, setCategories]);

  /**
   * Update an existing category - ENHANCED to handle type changes
   */
  const updateCategory = useCallback((categoryId, categoryData) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        // If changing type, preserve important fields but update structure
        if (categoryData.type && categoryData.type !== cat.type) {
          const updatedCategory = {
            ...cat,
            ...categoryData,
            // Reset type-specific settings when changing type
            settings: {
              ...(categoryData.type === 'single' && {
                amount: categoryData.amount || 0,
                frequency: categoryData.frequency || 'monthly',
                dueDate: categoryData.dueDate || null
              }),
              ...(categoryData.type === 'multiple' && {
                allowInactiveItems: true,
                autoDistribution: false
              })
            }
          };
          return updatedCategory;
        }

        // Normal update
        return { ...cat, ...categoryData };
      }
      return cat;
    }));
  }, [setCategories]);

  /**
   * Delete a category - ENHANCED with type-aware cleanup
   */
  const deleteCategory = useCallback((categoryId, planningItems = []) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    if (!categoryToDelete) return { success: false, error: 'Category not found' };

    // Check for associated items
    const associatedItems = planningItems.filter(item => item.categoryId === categoryId);

    if (associatedItems.length > 0) {
      return {
        success: false,
        error: `Cannot delete category "${categoryToDelete.name}" because it has ${associatedItems.length} item(s). Please move or delete the items first.`,
        itemCount: associatedItems.length
      };
    }

    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    return { success: true };
  }, [setCategories, categories]);

  /**
   * Convert a category type - NEW FEATURE
   * Safely converts between single and multiple types
   */
  const convertCategoryType = useCallback((categoryId, newType, planningItems = []) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return { success: false, error: 'Category not found' };

    if (category.type === newType) return { success: true }; // Already correct type

    const associatedItems = planningItems.filter(item => item.categoryId === categoryId);

    // Validate conversion rules
    if (newType === 'single' && associatedItems.length > 1) {
      return {
        success: false,
        error: `Cannot convert to single expense because this category has ${associatedItems.length} items. Single categories can only have one item.`
      };
    }

    // Perform the conversion
    updateCategory(categoryId, {
      type: newType,
      // Clear settings that don't apply to new type
      settings: newType === 'single'
        ? {
          amount: associatedItems[0]?.amount || 0,
          frequency: associatedItems[0]?.frequency || 'monthly',
          dueDate: associatedItems[0]?.dueDate || null
        }
        : {
          allowInactiveItems: true,
          autoDistribution: false
        }
    });

    return { success: true };
  }, [categories, updateCategory]);

  /**
   * Get category type info - NEW HELPER
   */
  const getCategoryTypeInfo = useCallback((categoryId, planningItems = []) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    const associatedItems = planningItems.filter(item => item.categoryId === categoryId);
    const activeItems = associatedItems.filter(item => item.isActive);

    return {
      type: category.type,
      totalItems: associatedItems.length,
      activeItems: activeItems.length,
      canConvertToSingle: associatedItems.length <= 1,
      canConvertToMultiple: true, // Always possible
      settings: category.settings || {}
    };
  }, [categories]);

  /**
   * Auto-detect and suggest category type - NEW HELPER
   * Analyzes items and suggests appropriate type
   */
  const suggestCategoryType = useCallback((planningItems = []) => {
    return (categoryId) => {
      const associatedItems = planningItems.filter(item => item.categoryId === categoryId);

      if (associatedItems.length === 0) {
        return 'single'; // Default for empty categories
      } else if (associatedItems.length === 1) {
        return 'single'; // Perfect for single item
      } else {
        return 'multiple'; // Multiple items need multiple type
      }
    };
  }, []);

  /**
   * Fund a category with a specific amount - ENHANCED for types
   */
  const fundCategory = useCallback((categoryId, amount, planningItems = []) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return { success: false, error: 'Category not found' };

    // Update category balance
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? {
          ...cat,
          allocated: (cat.allocated || 0) + amount,
          available: (cat.available || 0) + amount,
          lastFunded: new Date().toISOString()
        }
        : cat
    ));

    // For single categories, mark the single item as funded
    if (category.type === 'single') {
      const singleItem = planningItems.find(item => item.categoryId === categoryId);
      if (singleItem) {
        // This would be handled by the planning item update logic
        return {
          success: true,
          type: 'single',
          fundedItem: singleItem.id
        };
      }
    }

    // For multiple categories, funds go to category pool for distribution
    return {
      success: true,
      type: 'multiple',
      categoryId
    };
  }, [setCategories, categories]);

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
   * Migrate existing categories to include type field - MIGRATION HELPER
   * Call this once during app initialization
   */
  const migrateCategoriesWithTypes = useCallback((planningItems = []) => {
    const needsMigration = categories.some(cat => !cat.type);

    if (!needsMigration) return { migrated: 0 };

    let migratedCount = 0;

    setCategories(prev => prev.map(category => {
      if (!category.type) {
        const associatedItems = planningItems.filter(item => item.categoryId === category.id);
        const suggestedType = associatedItems.length <= 1 ? 'single' : 'multiple';

        migratedCount++;

        return {
          ...category,
          type: suggestedType,
          available: category.allocated || 0, // Initialize available balance
          settings: suggestedType === 'single'
            ? {
              amount: associatedItems[0]?.amount || 0,
              frequency: associatedItems[0]?.frequency || 'monthly',
              dueDate: associatedItems[0]?.dueDate || null
            }
            : {
              allowInactiveItems: true,
              autoDistribution: false
            }
        };
      }
      return category;
    }));

    return { migrated: migratedCount };
  }, [categories, setCategories]);

  return {
    // Existing functions
    categories,
    setCategories,
    generateNextCategoryId,
    addCategory, // ENHANCED
    updateCategory, // ENHANCED
    deleteCategory, // ENHANCED
    fundCategory, // ENHANCED
    toggleCategoryCollapse,
    calculateToBeAllocated,

    // NEW functions for Enhanced Category Structure
    convertCategoryType,
    getCategoryTypeInfo,
    suggestCategoryType,
    migrateCategoriesWithTypes
  };
};