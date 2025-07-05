// src/hooks/useUrgencyScoring.js
import { useMemo } from 'react';
import { getUrgencyIndicator } from '../utils/progressUtils';

/**
 * Hook for categorizing timeline items by urgency
 * 
 * @param {Object} params - Parameters
 * @param {Array} params.timelineItems - Timeline items
 * @returns {Object} Categorized timeline items and helper functions
 */
export const useUrgencyScoring = ({
  timelineItems = []
}) => {
  const categorizedItems = useMemo(() => {
    // Initialize timeline categories
    const categories = {
      critical: [],
      upcoming: [],
      onTrack: [],
      noDeadline: []
    };
    
    // Categorize items by urgency score
    timelineItems.forEach(item => {
      if (!item.timeline) {
        categories.noDeadline.push(item);
      } else if (item.urgencyScore >= 80) {
        categories.critical.push(item);
      } else if (item.urgencyScore >= 50) {
        categories.upcoming.push(item);
      } else {
        categories.onTrack.push(item);
      }
    });
    
    // Sort each category by urgency score (descending)
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => b.urgencyScore - a.urgencyScore);
    });
    
    return categories;
  }, [timelineItems]);
  
  /**
   * Get timeline for a specific item
   * 
   * @param {string} itemId - Item ID
   * @param {string} itemType - Item type ('expense' or 'savings-goal')
   * @returns {Object|null} Timeline item or null if not found
   */
  const getTimelineForItem = (itemId, itemType) => {
    // Check all categories
    for (const category of Object.values(categorizedItems)) {
      const item = category.find(item => item.id === itemId && item.type === itemType);
      if (item) return item;
    }
    return null;
  };
  
  /**
   * Get the next critical deadline
   * 
   * @returns {string|null} Next critical deadline or null if none
   */
  const getNextCriticalDeadline = () => {
    if (categorizedItems.critical.length === 0) return null;
    
    // Find the earliest due date among critical items
    return categorizedItems.critical.reduce((earliest, item) => {
      const itemDate = item.type === 'expense' ? item.dueDate : item.targetDate;
      if (!earliest || new Date(itemDate) < new Date(earliest)) {
        return itemDate;
      }
      return earliest;
    }, null);
  };
  
  /**
   * Get allocation suggestions
   * 
   * @param {number} limit - Maximum number of suggestions to return
   * @returns {Array} Allocation suggestions
   */
  const getAllocationSuggestions = (limit = 5) => {
    // Combine critical and upcoming items
    const priorityItems = [...categorizedItems.critical, ...categorizedItems.upcoming];
    
    // Sort by urgency score
    priorityItems.sort((a, b) => b.urgencyScore - a.urgencyScore);
    
    // Return top N items
    return priorityItems.slice(0, limit);
  };
  
  /**
   * Calculate category urgency
   * 
   * @param {string} categoryId - Category ID
   * @returns {Object} Category urgency score and indicator
   */
  const getCategoryUrgency = (categoryId) => {
    // Find all items in this category
    const categoryItems = [];
    
    Object.values(categorizedItems).forEach(category => {
      category.forEach(item => {
        if (item.categoryId === categoryId) {
          categoryItems.push(item);
        }
      });
    });
    
    if (categoryItems.length === 0) return { score: 0, indicator: 'none' };
    
    // Calculate average urgency score
    const totalScore = categoryItems.reduce((sum, item) => sum + item.urgencyScore, 0);
    const avgScore = totalScore / categoryItems.length;
    
    return {
      score: avgScore,
      indicator: getUrgencyIndicator(avgScore)
    };
  };
  
  return {
    categorizedItems,
    getTimelineForItem,
    getNextCriticalDeadline,
    getAllocationSuggestions,
    getCategoryUrgency
  };
};