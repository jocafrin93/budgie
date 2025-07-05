// src/hooks/useUIState.js
import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing UI state
 * Extracts UI-related state and operations from App.js
 */
export const useUIState = () => {
  // Tab and view mode state
  const [activeTab, setActiveTab] = useLocalStorage('budgetCalc_activeTab', 'budget');
  const [viewMode, setViewMode] = useLocalStorage('budgetCalc_viewMode', 'planning');
  
  // Modal state
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [preselectedCategory, setPreselectedCategory] = useState(null);
  
  // Confirm dialog state
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useLocalStorage('budgetCalc_collapsedCategories', {});
  
  /**
   * Switch to a specific tab
   */
  const switchToTab = useCallback((tabName) => {
    setActiveTab(tabName);
  }, [setActiveTab]);
  
  /**
   * Switch between planning and funding modes
   */
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'planning' ? 'funding' : 'planning');
  }, [setViewMode]);
  
  /**
   * Open the add item modal
   */
  const openAddItemModal = useCallback((categoryId = null) => {
    setPreselectedCategory(categoryId);
    setEditingItem(null);
    setShowAddItem(true);
  }, []);
  
  /**
   * Open the edit item modal
   */
  const openEditItemModal = useCallback((item) => {
    setEditingItem(item);
    setShowAddItem(true);
  }, []);
  
  /**
   * Open the add category modal
   */
  const openAddCategoryModal = useCallback(() => {
    setEditingCategory(null);
    setShowAddCategory(true);
  }, []);
  
  /**
   * Open the edit category modal
   */
  const openEditCategoryModal = useCallback((category) => {
    setEditingCategory(category);
    setShowAddCategory(true);
  }, []);
  
  /**
   * Open the add account modal
   */
  const openAddAccountModal = useCallback(() => {
    setEditingAccount(null);
    setShowAddAccount(true);
  }, []);
  
  /**
   * Open the edit account modal
   */
  const openEditAccountModal = useCallback((account) => {
    setEditingAccount(account);
    setShowAddAccount(true);
  }, []);
  
  /**
   * Open the add transaction modal
   */
  const openAddTransactionModal = useCallback(() => {
    setEditingTransaction(null);
    setShowAddTransaction(true);
  }, []);
  
  /**
   * Open the edit transaction modal
   */
  const openEditTransactionModal = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setShowAddTransaction(true);
  }, []);
  
  /**
   * Open the confirm delete dialog
   */
  const openConfirmDeleteDialog = useCallback((type, id, name, message) => {
    setConfirmDelete({ type, id, name, message });
  }, []);
  
  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setShowAddItem(false);
    setShowAddCategory(false);
    setShowAddAccount(false);
    setShowAddTransaction(false);
    setEditingItem(null);
    setEditingCategory(null);
    setEditingAccount(null);
    setEditingTransaction(null);
    setPreselectedCategory(null);
    setConfirmDelete(null);
  }, []);
  
  /**
   * Toggle a category's collapsed state
   */
  const toggleCategoryCollapse = useCallback((categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, [setCollapsedCategories]);
  
  /**
   * Check if a category is collapsed
   */
  const isCategoryCollapsed = useCallback((categoryId) => {
    return !!collapsedCategories[categoryId];
  }, [collapsedCategories]);
  
  return {
    // Tab and view mode
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    switchToTab,
    toggleViewMode,
    
    // Modal state
    showAddItem,
    setShowAddItem,
    showAddCategory,
    setShowAddCategory,
    showAddAccount,
    setShowAddAccount,
    showAddTransaction,
    setShowAddTransaction,
    
    // Editing state
    editingItem,
    setEditingItem,
    editingCategory,
    setEditingCategory,
    editingAccount,
    setEditingAccount,
    editingTransaction,
    setEditingTransaction,
    preselectedCategory,
    setPreselectedCategory,
    
    // Confirm dialog state
    confirmDelete,
    setConfirmDelete,
    
    // Modal functions
    openAddItemModal,
    openEditItemModal,
    openAddCategoryModal,
    openEditCategoryModal,
    openAddAccountModal,
    openEditAccountModal,
    openAddTransactionModal,
    openEditTransactionModal,
    openConfirmDeleteDialog,
    closeAllModals,
    
    // Category collapse state
    collapsedCategories,
    toggleCategoryCollapse,
    isCategoryCollapsed
  };
};