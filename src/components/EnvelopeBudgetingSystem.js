// src/components/EnvelopeBudgetingSystem.js
import { useEffect, useState } from 'react';
import { useEnvelopeBudgeting } from '../hooks/useEnvelopeBudgeting';
import { getExpensesFromPlanningItems, getSavingsGoalsFromPlanningItems } from '../utils/dataModelUtils';
import EnvelopeBudgetView from './EnvelopeBudgetView';
import ModalFormManager from './ModalFormManager';
import PaycheckManager from './PaycheckManager';
import PaydayWorkflow from './PaydayWorkflow';

/**
 * EnvelopeBudgetingSystem component
 * 
 * This component integrates all the pieces of our YNAB-style envelope budgeting system:
 * 1. The useEnvelopeBudgeting hook for data management
 * 2. The EnvelopeBudgetView for the main budgeting interface
 * 3. The PaydayWorkflow for guided paycheck allocation
 * 
 * It connects these to the existing data model while providing a cohesive user experience.
 */
const EnvelopeBudgetingSystem = ({
  // Data from existing model
  categories,
  setCategories,
  planningItems,
  transactions,
  accounts,
  paychecks,
  payFrequency,
  payFrequencyOptions,
  setExpenses,
  setSavingsGoals,

  // Actions for existing items
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItemActive,
  recordPaycheckReceived
}) => {
  // Initialize our envelope budgeting system
  const {
    calculateToBeAllocated,
    fundCategory,
    moveMoney,
    transferFunds,
    handleTransactionForCategory,
    autoFundCategories,
    getFundingSuggestions
  } = useEnvelopeBudgeting({
    categories,
    setCategories,
    planningItems,
    transactions,
    accounts
  });

  // Current amount available to allocate
  const [toBeAllocated, setToBeAllocated] = useState(0);

  // Track view and workflow states
  const [currentView, setCurrentView] = useState('budget'); // budget, payday, paychecks
  const [activePaycheck, setActivePaycheck] = useState(null);

  // Handle tab switching
  const handleTabChange = (tab) => {
    if (tab === 'paychecks' && activePaycheck) {
      setActivePaycheck(null);
    }
    setCurrentView(tab);
  };

  // Unified modal state for forms
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    itemToEdit: null
  });

  // Get the most recent paycheck
  const [recentPaycheck, setRecentPaycheck] = useState(null);

  // Update to-be-allocated amount when relevant data changes
  useEffect(() => {
    const available = calculateToBeAllocated();
    setToBeAllocated(available);
  }, [categories, accounts, calculateToBeAllocated]);

  // Update recent paycheck when paychecks change
  useEffect(() => {
    if (paychecks && paychecks.length > 0) {
      // Find the most recent paycheck that hasn't been fully allocated
      const recent = [...paychecks]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .find(p => !p.fullyAllocated);

      setRecentPaycheck(recent);
    } else {
      setRecentPaycheck(null);
    }
  }, [paychecks]);

  // Update existing data model when transactions change
  useEffect(() => {
    // For each transaction, ensure category available amounts are updated
    transactions.forEach(transaction => {
      handleTransactionForCategory(transaction);
    });
  }, [transactions, handleTransactionForCategory]);

  // Handle showing the payday workflow
  const handleShowPaydayWorkflow = (paycheck = recentPaycheck) => {
    if (paycheck) {
      setActivePaycheck(paycheck);
      setCurrentView('payday');
    }
  };

  // Handle completing the payday workflow
  const handlePaydayComplete = (result) => {
    // Mark the paycheck as allocated if needed
    if (result.completed && result.paycheck) {
      // Record that this paycheck was received and allocated
      recordPaycheckReceived(result.paycheck.id, {
        ...result.paycheck,
        fullyAllocated: true,
        dateAllocated: new Date().toISOString(),
        allocations: result.allocations
      });
    }

    // Return to budget view
    setCurrentView('budget');
    setActivePaycheck(null);
  };

  // Handle paycheck received
  const handlePaycheckReceived = (paycheck) => {
    setActivePaycheck(paycheck);
    setCurrentView('payday');
  };

  // Handle item deletion with proper sync
  const handleDeleteItem = (itemId) => {
    const parsedId = parseInt(itemId, 10);
    if (isNaN(parsedId)) {
      console.error('Invalid item ID for deletion:', itemId);
      return;
    }

    // Call onDeleteItem with the parsed ID
    onDeleteItem(parsedId);

    // Force immediate sync
    const updatedItems = planningItems.filter(item => item.id !== parsedId);
    const derivedExpenses = getExpensesFromPlanningItems(updatedItems);
    const derivedSavingsGoals = getSavingsGoalsFromPlanningItems(updatedItems);
    setExpenses(derivedExpenses);
    setSavingsGoals(derivedSavingsGoals);
  };

  // Render content based on current view
  const renderContent = () => {
    if (currentView === 'payday' && activePaycheck) {
      return (
        <PaydayWorkflow
          paycheck={activePaycheck}
          accounts={accounts}
          payFrequency={payFrequency}
          payFrequencyOptions={payFrequencyOptions}
          categories={categories}
          toBeAllocated={toBeAllocated}
          planningItems={planningItems}
          onEditItem={onEditItem}
          fundCategory={fundCategory}
          autoFundCategories={autoFundCategories}
          getFundingSuggestions={getFundingSuggestions}
          onComplete={handlePaydayComplete}
        />
      );
    }

    if (currentView === 'paychecks') {
      return (
        <PaycheckManager
          accounts={accounts}
          onPaycheckReceived={handlePaycheckReceived}
        />
      );
    }

    return (
      <EnvelopeBudgetView
        categories={categories}
        planningItems={planningItems}
        onEditItem={handleEditItem}
        onEditCategory={handleEditCategory}
        toBeAllocated={toBeAllocated}
        fundCategory={fundCategory}
        moveMoney={moveMoney}
        transferFunds={transferFunds}
        onAddCategory={handleAddCategory}
        onDeleteCategory={onDeleteCategory}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onToggleItemActive={onToggleItemActive}
        onShowPaydayWorkflow={handleShowPaydayWorkflow}
        recentPaycheck={recentPaycheck}
        payFrequency={payFrequency}
        payFrequencyOptions={payFrequencyOptions}
      />
    );
  };

  // Unified modal handlers
  const handleEditItem = (itemId) => {
    const parsedId = parseInt(itemId, 10);
    if (isNaN(parsedId)) {
      console.error('Invalid item ID for editing:', itemId);
      return;
    }

    const item = planningItems.find(i => i.id === parsedId);
    if (item) {
      setModalState({
        isOpen: true,
        type: 'edit-item',
        itemToEdit: item
      });
    }
  };

  const handleEditCategory = (categoryId) => {
    const parsedId = parseInt(categoryId, 10);
    if (isNaN(parsedId)) {
      console.error('Invalid category ID for editing:', categoryId);
      return;
    }

    const category = categories.find(c => c.id === parsedId);
    if (category) {
      setModalState({
        isOpen: true,
        type: 'edit-category',
        itemToEdit: category
      });
    }
  };

  const handleAddItem = ({ preselectedCategory }) => {
    setModalState({
      isOpen: true,
      type: 'add-item',
      itemToEdit: null,
      preselectedCategory
    });
  };

  const handleAddCategory = () => {
    setModalState({
      isOpen: true,
      type: 'add-category',
      itemToEdit: null
    });
  };

  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      type: null,
      itemToEdit: null,
      preselectedCategory: null
    });
  };

  const handleModalSave = (formData) => {
    switch (modalState.type) {
      case 'add-item': {
        // Parse and validate categoryId
        const categoryId = parseInt(modalState.preselectedCategory?.id || formData.categoryId, 10);
        if (isNaN(categoryId)) {
          console.error('Invalid category ID for new item:', formData.categoryId);
          return;
        }
        onAddItem({
          ...formData,
          categoryId,
          needsAllocation: true // Mark new items as needing allocation
        });
        break;
      }
      case 'edit-item': {
        // Parse and validate item ID
        const itemId = parseInt(modalState.itemToEdit.id, 10);
        if (isNaN(itemId)) {
          console.error('Invalid item ID for editing:', modalState.itemToEdit.id);
          return;
        }
        // Parse categoryId if it's being updated
        const categoryId = formData.categoryId ? parseInt(formData.categoryId, 10) : undefined;
        if (formData.categoryId && isNaN(categoryId)) {
          console.error('Invalid category ID for item update:', formData.categoryId);
          return;
        }
        onEditItem(itemId, {
          ...formData,
          categoryId: categoryId || formData.categoryId
        });
        break;
      }
      case 'add-category': {
        // Ensure we don't pass an ID for new categories
        const { id, ...categoryData } = formData;
        onAddCategory(categoryData);
        break;
      }
      case 'edit-category': {
        // Parse and validate category ID
        const categoryId = parseInt(modalState.itemToEdit.id, 10);
        if (isNaN(categoryId)) {
          console.error('Invalid category ID for editing:', modalState.itemToEdit.id);
          return;
        }
        onEditCategory(categoryId, {
          ...formData,
          id: categoryId
        });
        break;
      }
    }
    handleModalClose();
  };

  return (
    <div className="envelope-budgeting-system">
      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => handleTabChange('budget')}
          className={`px-4 py-2 ${currentView === 'budget' ? 'border-b-2 border-theme-primary text-theme-primary' : 'text-theme-secondary'}`}
        >
          Budget
        </button>
        <button
          onClick={() => handleTabChange('paychecks')}
          className={`px-4 py-2 ${currentView === 'paychecks' ? 'border-b-2 border-theme-primary text-theme-primary' : 'text-theme-secondary'}`}
        >
          Paychecks
        </button>
      </div>

      {/* Content Area */}
      {renderContent()}

      {/* Unified Modal System */}
      <ModalFormManager
        isOpen={modalState.isOpen}
        modalType={modalState.type}
        itemToEdit={modalState.itemToEdit}
        preselectedCategory={modalState.preselectedCategory}
        onClose={handleModalClose}
        onSave={handleModalSave}
        categories={categories}
        accounts={accounts}
        darkMode={false}
      />

    </div>
  );
};

export default EnvelopeBudgetingSystem;