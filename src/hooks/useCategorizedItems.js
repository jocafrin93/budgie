// src/hooks/useCategorizedItems.js
import { useMemo } from 'react';
import { calculatePercentage } from '../utils/moneyUtils';

/**
 * Hook for categorizing expenses and goals by category
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.expenseAllocations - Expense allocations
 * @param {Array} params.goalAllocations - Goal allocations
 * @param {number} params.currentPay - Current pay amount
 * @returns {Object} Categorized expenses and goals
 */
export const useCategorizedItems = ({
  expenseAllocations = [],
  goalAllocations = [],
  currentPay = 0,
}) => {
  return useMemo(() => {
    // Validate inputs
    if (!Array.isArray(expenseAllocations) || !Array.isArray(goalAllocations)) {
      console.warn('Invalid input arrays to useCategorizedItems');
      return {};
    }

    // Initialize categorized expenses
    const categorizedExpenses = {};

    // Add expenses to categories
    expenseAllocations.forEach(expense => {
      const categoryId = expense.categoryId;
      if (!categoryId) return;

      if (!categorizedExpenses[categoryId]) {
        categorizedExpenses[categoryId] = {
          expenses: [],
          goals: [],
          total: 0,
          percentage: 0,
        };
      }

      categorizedExpenses[categoryId].expenses.push(expense);
      categorizedExpenses[categoryId].total += expense.biweeklyAmount || 0;
    });

    // Add goals to categories
    goalAllocations.forEach(goal => {
      const categoryId = goal.categoryId;
      if (!categoryId) return;

      if (!categorizedExpenses[categoryId]) {
        categorizedExpenses[categoryId] = {
          expenses: [],
          goals: [],
          total: 0,
          percentage: 0,
        };
      }

      categorizedExpenses[categoryId].goals.push(goal);
      categorizedExpenses[categoryId].total += goal.biweeklyAmount || 0;
    });

    // Calculate percentages for categories
    if (currentPay > 0) {
      Object.keys(categorizedExpenses).forEach(categoryId => {
        const category = categorizedExpenses[categoryId];
        category.percentage = calculatePercentage(category.total, currentPay);
      });
    }

    return categorizedExpenses;
  }, [expenseAllocations, goalAllocations, currentPay]);
};