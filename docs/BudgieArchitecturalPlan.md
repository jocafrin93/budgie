# Budgie Architectural Plan: YNAB-Style Workflow Implementation

This document outlines the architectural changes needed to transform Budgie into a YNAB-style budgeting application with proper paycheck management, category-based envelope budgeting, and intuitive user workflows.

## Core Vision

The transformed application will:
1. Support multiple independent paycheck schedules with variable amounts and configurable frequencies
2. Use category-based envelope budgeting as the primary mechanism
3. Provide a dedicated payday workflow for allocation
4. Integrate planning items, categories, and transactions through a unified modal system
5. Show all planned items and paychecks in a calendar view with consistent date handling
6. Support transaction splitting across multiple categories
7. Enable future month allocation ("aging money")
8. Handle scheduled transactions linked to budget items
9. Provide consistent styling with gradient-based category colors

## 1. Multi-Paycheck System

### Current State
- Single paycheck schedule with optional splitting
- No support for independent schedules
- Limited integration with budget calculations

### Proposed Changes

#### Paycheck Frequency Configuration
```javascript
// Paycheck frequency options
const payFrequencyOptions = [
  { 
    value: 'weekly',
    label: 'Weekly',
    paychecksPerMonth: 4.33,
    daysPerPaycheck: 7
  },
  {
    value: 'bi-weekly',
    label: 'Every Two Weeks',
    paychecksPerMonth: 2.17,
    daysPerPaycheck: 14
  },
  {
    value: 'semi-monthly',
    label: 'Twice a Month',
    paychecksPerMonth: 2,
    daysPerPaycheck: 15
  },
  {
    value: 'monthly',
    label: 'Monthly',
    paychecksPerMonth: 1,
    daysPerPaycheck: 30
  }
];

// Enhanced paychecks data model
const paychecks = [
  {
    id: 1,
    name: "Main Job",
    frequency: "bi-weekly", 
    startDate: "2023-01-06",
    baseAmount: 2000,          // Expected/average amount
    variableAmount: true,      // Indicates amount may vary
    accountDistribution: [
      { 
        accountId: 1, 
        amount: 1500,
        distributionType: "percentage", // "fixed" or "percentage"
        distributionValue: 75 // 75% of the total
      },
      { 
        accountId: 2, 
        amount: 500,
        distributionType: "percentage", 
        distributionValue: 25 // 25% of the total
      }
    ],
    historyEntries: [          // Track actual received amounts
      {
        date: "2023-01-06",
        actualAmount: 2050,    // May differ from baseAmount
        notes: "Overtime pay"
      }
    ],
    isActive: true
  },
  {
    id: 2,
    name: "Side Gig",
    frequency: "monthly",
    startDate: "2023-01-15",
    baseAmount: 500,
    variableAmount: true,
    accountDistribution: [
      { 
        accountId: 1, 
        amount: 500,
        distributionType: "fixed",
        distributionValue: 500
      }
    ],
    historyEntries: [],
    isActive: true
  }
]
```

#### New Hooks/Components
- Create `usePaycheckManagement` hook with frequency configuration
- Update `usePaycheckDates` to handle multiple schedules and frequencies
- Develop paycheck setup UI with variable amount handling
- Add paycheck timeline visualization with proper date formatting
- Create paycheck history tracking
- Add unified modal system for forms (ModalFormManager)

#### User Flows
- Paycheck setup during onboarding
- Recording actual received paychecks (potentially different amounts)
- Viewing upcoming paychecks in calendar
- Paycheck management in settings

## 2. Category-Based Envelope Budgeting

### Current State
- Categories track allocated and spent amounts
- No true envelope system enforcement
- Focus on individual planning items
- Basic modal system for forms
- Inconsistent date handling

### Proposed Changes

#### Data Model Updates
```javascript
// Enhanced category model with gradients
const categories = [
  {
    id: 1,
    name: "Groceries",
    color: "bg-gradient-to-r from-green-500 to-yellow-400",
    allocated: 500,           // Total allocated
    available: 350,           // Current available (allocated - spent)
    spent: 150,               // Total spent
    plannedItems: [...],      // References to planning items
    monthlyTarget: 500,       // Target monthly allocation
    autoFund: true,           // Auto-fund on payday
    priority: "high",         // Funding priority
    rollover: true,           // Whether to roll over remaining funds
    hidden: false,            // Can be hidden but not deleted if has transactions
    // New fields for future month allocation
    futureMonthAllocations: [
      { month: "2023-02", amount: 300 },
      { month: "2023-03", amount: 100 }
    ],
    transactions: [...]       // Reference to transactions in this category
  }
]
```

#### New Hooks/Components
- Enhance `useCategoryManagement` for envelope budgeting
- Create unified form system with ModalFormManager
- Add overspending warnings and tracking
- Implement category transfer UI with proper validation
- Develop future month allocation interface
- Add consistent date handling across components

#### User Flows
- Moving money between categories
- Handling overspending
- Setting funding priorities
- Viewing category spending trends
- Allocating to future months ("aging money")
- Category hiding/archiving instead of deletion

## 3. Payday Workflow

### Current State
- No dedicated payday workflow
- No connection between paychecks and funding
- Inconsistent form handling
- Basic date handling

### Proposed Changes

#### Core Logic Updates
- Track expected vs. received paychecks with variable amounts
- Handle configurable paycheck frequencies
- Calculate suggested allocations based on:
  - Category priorities and targets
  - Planning item due dates
  - Previous overspending
  - Funding goals
  - Future month funding targets

#### New Components
- Payday workflow wizard with frequency support
- Quick-budget options based on paycheck schedule
- Funding priority visualization
- Underfunded categories warning
- Future month allocation tool
- Unified modal system for all forms

#### User Flows
- Recording received paychecks with actual amounts
- Auto-allocating funds based on frequency
- Manual adjustments to suggested allocations
- Handling unexpected income amounts (higher or lower)
- Allocating excess to future months
- Consistent form interaction through modal system

## 4. Planning Items and Goals Integration

### Current State
- Planning items are primary budgeting focus
- Limited integration with categories
- Goal calculations don't account for paycheck schedules

### Proposed Changes

#### Data Model Updates
- Reposition planning items as forecasting tools
- Link items more explicitly to categories
- Enhance goal calculations to use paycheck schedules

```javascript
// Updated planning item model
const planningItem = {
  id: 1,
  name: "Rent",
  type: "expense",
  amount: 1200,
  frequency: "monthly",
  dueDate: "2023-02-01",
  categoryId: 5,
  accountId: 1,
  isActive: true,
  priorityState: "active",
  // New fields
  paycheckInterval: 2,         // Allocate over 2 paychecks
  autoAllocate: true,          // Include in auto-allocation
  fundingPriority: "high",
  // Link to scheduled transactions
  createScheduledTransaction: true,  // Auto-create transaction
  scheduledTransactionId: 123,       // Reference to scheduled transaction
  notes: "Apartment 4B"              // Additional details
}
```

#### New Logic
- Calculate per-paycheck allocation needs
- Update goal timeline calculations
- Forecast category balances over time
- Link planning items to scheduled transactions

#### User Flows
- Setting up recurring expenses
- Creating savings goals with target dates
- Viewing expense timing relative to paychecks
- Converting planning items to scheduled transactions

## 5. Transaction System Updates

### Current State
- Transactions update account and category balances
- No enforcement of category available amounts
- No integration with planning items

### Proposed Changes

#### Core Logic Updates
- Warn on category overspending
- Allow correcting overspending from other categories
- Match transactions to planning items when possible
- Support transaction splitting across multiple categories

#### New Components
- Enhanced transaction entry with warnings
- Split transaction interface
- Transaction-to-planning item matching
- Category reassignment tool for handling deleted categories

#### User Flows
- Recording transactions with category assignment
- Handling overspending scenarios
- Splitting transactions across multiple categories
- Recurring transaction management
- Handling transactions when categories are deleted/hidden

#### Data Model Updates
```javascript
// Enhanced transaction model
const transaction = {
  id: 1,
  date: "2023-01-15",
  amount: -120.50,
  description: "Target",
  accountId: 1,
  // For split transactions
  isParent: true,
  childTransactions: [
    {
      id: 101,
      parentId: 1,
      amount: -75.50,
      categoryId: 3,  // Groceries
      notes: "Food items"
    },
    {
      id: 102,
      parentId: 1,
      amount: -45.00,
      categoryId: 8,  // Household
      notes: "Cleaning supplies"
    }
  ],
  // For scheduled transactions
  isScheduled: false,
  planningItemId: null,  // Link to planning item if relevant
  recurrence: null,      // Recurrence pattern if scheduled
}
```

## 6. Calendar and Visualization

### Current State
- Basic calendar view exists
- Limited integration with other components
- No paycheck visualization

### Proposed Changes

#### Core Enhancements
- Show paychecks, expenses, and transactions on calendar
- Add timeline view for cash flow projection
- Visualize category funding over time
- Display future month allocations

#### New Views/Components
- Enhanced calendar with multi-entity support
- Cash flow timeline visualization
- Category funding projection charts
- Future month allocation view (for "aging money")

#### User Flows
- Viewing upcoming financial events
- Planning for irregular expenses
- Visualizing long-term savings progress
- Monitoring progress toward being "a month ahead"

## 7. Category Deletion and Data Integrity

### Current State
- Categories can be deleted without handling existing transactions
- No safeguards for data integrity when removing categories

### Proposed Changes

#### Core Logic Updates
- Prevent category deletion if it contains transactions
- Provide options to:
  - Move all transactions to another category
  - Hide the category instead of deleting
  - Batch reassign transactions

#### New Components
- Category archive/hide functionality
- Transaction reassignment interface
- Data integrity verification tools

#### User Flows
- Attempting to delete a category with transactions
- Reassigning transactions to new categories
- Hiding unused categories
- Managing archived categories

## Implementation Roadmap

### Phase 1: Data Model Foundations
- Update paycheck model for multiple schedules with variable amounts
- Enhance category model for envelope budgeting and future allocation
- Revise planning item model to inform categories and link to transactions
- Update transaction model for category enforcement and splitting

### Phase 2: Core Logic Implementation
- Implement multi-paycheck date generation
- Develop category funding logic
- Create auto-allocation algorithms
- Build overspending tracking and correction
- Implement transaction splitting functionality

### Phase 3: UI Workflows
- Develop paycheck setup interface
- Create payday workflow component
- Enhance category management interface
- Update transaction entry with warnings and splitting
- Build future month allocation tools

### Phase 4: Integration and Refinement
- Integrate calendar with all components
- Enhance goal calculations with pay schedule data
- Implement reporting and insights
- Add import/export functionality

## Backward Compatibility Considerations

The architectural changes should maintain compatibility with existing data while enabling new capabilities. During migration:

1. Existing planning items will be preserved
2. Categories will be enhanced with new properties
3. The single paycheck schedule will be converted to the first entry in the new multi-paycheck system
4. Existing transactions will be maintained with enhanced capabilities
5. Transaction splitting will be available for new transactions

## UI/UX Implications

These architectural changes will require significant UI updates, including:

1. New onboarding flow focusing on accounts and paychecks
2. Enhanced category view emphasizing available balances
3. New payday workflow interface
4. Updated calendar and timeline views
5. Transaction entry with category warnings and splitting
6. Future month allocation interface
7. Category archiving and transaction reassignment tools

## Conclusion

This architectural plan transforms Budgie into a comprehensive YNAB-style budgeting application with proper paycheck management, category-based envelope budgeting, and intuitive user workflows. The plan includes support for variable paycheck amounts, transaction splitting, future month allocation ("aging money"), and proper category deletion handling. The phased implementation approach ensures that each component can be developed and integrated systematically.