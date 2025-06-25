// src/utils/categoryMigration.js - NEW FILE
/**
 * Migration utilities for Enhanced Category Structure
 * Helps transition existing categories to the new type-based system
 */

/**
 * Migrate existing categories to include type field
 * @param {Array} categories - Existing categories
 * @param {Array} planningItems - Planning items to analyze
 * @returns {Object} Migration result
 */
export const migrateCategoriesWithTypes = (categories, planningItems = []) => {
    let migratedCount = 0;
    const migrationLog = [];

    const migratedCategories = categories.map(category => {
        // Skip if already has type
        if (category.type) return category;

        // Analyze associated items to determine type
        const associatedItems = planningItems.filter(item => item.categoryId === category.id);
        const activeItems = associatedItems.filter(item => item.isActive);

        let suggestedType;
        let reasoning;

        if (associatedItems.length === 0) {
            suggestedType = 'single';
            reasoning = 'Empty category - defaulting to single expense';
        } else if (associatedItems.length === 1) {
            suggestedType = 'single';
            reasoning = 'One item - perfect for single expense category';
        } else {
            suggestedType = 'multiple';
            reasoning = `${associatedItems.length} items - requires multiple expense category`;
        }

        migratedCount++;
        migrationLog.push({
            categoryId: category.id,
            categoryName: category.name,
            suggestedType,
            reasoning,
            itemCount: associatedItems.length,
            activeItemCount: activeItems.length
        });

        // Create migrated category
        const migratedCategory = {
            ...category,
            type: suggestedType,
            available: category.allocated || 0, // Initialize available balance
            settings: suggestedType === 'single'
                ? {
                    // For single categories, use first item's details
                    amount: associatedItems[0]?.amount || 0,
                    frequency: associatedItems[0]?.frequency || 'monthly',
                    dueDate: associatedItems[0]?.dueDate || null
                }
                : {
                    // For multiple categories, set organization settings
                    allowInactiveItems: true,
                    autoDistribution: false
                }
        };

        return migratedCategory;
    });

    return {
        categories: migratedCategories,
        migrated: migratedCount,
        migrationLog,
        success: true
    };
};

/**
 * Validate category types against their items
 * @param {Array} categories - Categories to validate
 * @param {Array} planningItems - Planning items
 * @returns {Object} Validation result with issues
 */
export const validateCategoryTypes = (categories, planningItems = []) => {
    const issues = [];
    const warnings = [];

    categories.forEach(category => {
        const associatedItems = planningItems.filter(item => item.categoryId === category.id);

        // Check single category rules
        if (category.type === 'single') {
            if (associatedItems.length > 1) {
                issues.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    type: 'error',
                    message: `Single expense category has ${associatedItems.length} items. Single categories should have exactly one item.`,
                    suggestion: 'Convert to multiple expense category or remove extra items'
                });
            } else if (associatedItems.length === 0) {
                warnings.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    type: 'warning',
                    message: 'Single expense category has no items.',
                    suggestion: 'Add an expense item or consider deleting this category'
                });
            }
        }

        // Check multiple category efficiency
        if (category.type === 'multiple' && associatedItems.length <= 1) {
            warnings.push({
                categoryId: category.id,
                categoryName: category.name,
                type: 'suggestion',
                message: `Multiple expense category only has ${associatedItems.length} item(s).`,
                suggestion: 'Consider converting to single expense category for simpler management'
            });
        }

        // Check for missing type (shouldn't happen after migration)
        if (!category.type) {
            issues.push({
                categoryId: category.id,
                categoryName: category.name,
                type: 'error',
                message: 'Category missing type field.',
                suggestion: 'Run category migration to fix this issue'
            });
        }
    });

    return {
        isValid: issues.length === 0,
        issues,
        warnings,
        totalCategories: categories.length,
        singleCategories: categories.filter(c => c.type === 'single').length,
        multipleCategories: categories.filter(c => c.type === 'multiple').length
    };
};

/**
 * Suggest category type conversions for optimization
 * @param {Array} categories - Categories to analyze
 * @param {Array} planningItems - Planning items
 * @returns {Array} Conversion suggestions
 */
export const suggestCategoryConversions = (categories, planningItems = []) => {
    const suggestions = [];

    categories.forEach(category => {
        const associatedItems = planningItems.filter(item => item.categoryId === category.id);
        const activeItems = associatedItems.filter(item => item.isActive);

        // Suggest single -> multiple conversion
        if (category.type === 'single' && associatedItems.length > 1) {
            suggestions.push({
                categoryId: category.id,
                categoryName: category.name,
                currentType: 'single',
                suggestedType: 'multiple',
                reason: `Has ${associatedItems.length} items but configured as single expense`,
                priority: 'high',
                benefits: [
                    'Better organization of multiple expenses',
                    'Individual item tracking',
                    'Active/planning state management'
                ]
            });
        }

        // Suggest multiple -> single conversion
        if (category.type === 'multiple' && associatedItems.length === 1 && activeItems.length === 1) {
            suggestions.push({
                categoryId: category.id,
                categoryName: category.name,
                currentType: 'multiple',
                suggestedType: 'single',
                reason: 'Only has one active item',
                priority: 'low',
                benefits: [
                    'Simpler YNAB-style management',
                    'Cleaner interface',
                    'Easier budgeting workflow'
                ]
            });
        }

        // Suggest cleanup for empty categories
        if (associatedItems.length === 0) {
            suggestions.push({
                categoryId: category.id,
                categoryName: category.name,
                currentType: category.type,
                suggestedType: 'delete',
                reason: 'Category has no items',
                priority: 'medium',
                benefits: [
                    'Cleaner category list',
                    'Less confusion during budgeting'
                ]
            });
        }
    });

    return suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
};

/**
 * Auto-fix category issues
 * @param {Array} categories - Categories to fix
 * @param {Array} planningItems - Planning items
 * @param {Object} options - Fix options
 * @returns {Object} Fix result
 */
export const autoFixCategoryIssues = (categories, planningItems = [], options = {}) => {
    const {
        convertSingleWithMultipleItems = true,
        cleanupEmptyCategories = false,
        addMissingTypes = true
    } = options;

    let fixedCategories = [...categories];
    const fixes = [];

    fixedCategories = fixedCategories.map(category => {
        const associatedItems = planningItems.filter(item => item.categoryId === category.id);

        // Fix missing type
        if (addMissingTypes && !category.type) {
            const suggestedType = associatedItems.length <= 1 ? 'single' : 'multiple';
            fixes.push({
                categoryId: category.id,
                fix: 'Added missing type',
                from: 'undefined',
                to: suggestedType
            });

            return {
                ...category,
                type: suggestedType,
                available: category.allocated || 0,
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

        // Fix single categories with multiple items
        if (convertSingleWithMultipleItems && category.type === 'single' && associatedItems.length > 1) {
            fixes.push({
                categoryId: category.id,
                fix: 'Converted single to multiple',
                from: 'single',
                to: 'multiple',
                reason: `Had ${associatedItems.length} items`
            });

            return {
                ...category,
                type: 'multiple',
                settings: {
                    allowInactiveItems: true,
                    autoDistribution: false
                }
            };
        }

        return category;
    });

    // Remove empty categories if requested
    if (cleanupEmptyCategories) {
        const originalCount = fixedCategories.length;
        fixedCategories = fixedCategories.filter(category => {
            const associatedItems = planningItems.filter(item => item.categoryId === category.id);
            const shouldKeep = associatedItems.length > 0;

            if (!shouldKeep) {
                fixes.push({
                    categoryId: category.id,
                    fix: 'Removed empty category',
                    categoryName: category.name
                });
            }

            return shouldKeep;
        });
    }

    return {
        categories: fixedCategories,
        fixes,
        fixCount: fixes.length,
        success: true
    };
};

/**
 * Generate migration report
 * @param {Array} categories - Categories
 * @param {Array} planningItems - Planning items
 * @returns {Object} Comprehensive migration report
 */
export const generateMigrationReport = (categories, planningItems = []) => {
    const validation = validateCategoryTypes(categories, planningItems);
    const suggestions = suggestCategoryConversions(categories, planningItems);

    const stats = {
        totalCategories: categories.length,
        singleCategories: categories.filter(c => c.type === 'single').length,
        multipleCategories: categories.filter(c => c.type === 'multiple').length,
        categoriesWithoutType: categories.filter(c => !c.type).length,
        emptyCategories: categories.filter(c => {
            const items = planningItems.filter(item => item.categoryId === c.id);
            return items.length === 0;
        }).length,
        categoriesWithItems: categories.filter(c => {
            const items = planningItems.filter(item => item.categoryId === c.id);
            return items.length > 0;
        }).length
    };

    return {
        stats,
        validation,
        suggestions,
        needsMigration: stats.categoriesWithoutType > 0,
        hasIssues: validation.issues.length > 0,
        hasOptimizations: suggestions.length > 0
    };
};