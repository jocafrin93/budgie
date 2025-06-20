# Budgie 🦜 - YNAB-style Envelope Budgeting App

## Project Overview
A React-based envelope budgeting application inspired by YNAB, with enhanced calculation features to help users determine optimal budget allocations. The app uses a three-layer architecture: Planning → Active Allocations → Category Envelopes.

## Current Architecture

### Core Components (ACTIVE - DO NOT REMOVE)
- **App.js** - Main application with unified tab system
- **UnifiedItemForm.js** - Combined form for expenses and savings goals
- **PlanningMode.js** - Budget planning interface with drag-and-drop
- **ImprovedFundingMode.js** - Smart funding recommendations
- **SimplifiedSummaryCards.js** - Dashboard with budget buddy pet
- **EnhancedCategoryCard.js** - Category management with funding controls
- **TransactionsTab.js** - Transaction management interface
- **CalendarView.js** - Timeline and calendar visualization

### Supporting Components (ACTIVE)
- **AddCategoryForm.js**, **AddAccountForm.js**, **AddTransactionForm.js** - Form components
- **AccountsSection.js** - Account management
- **ConfigurationPanel.js** - App settings and pay schedule
- **CurrencyInput.js**, **ConfirmDialog.js**, **ThemeSelector.js** - Utilities

### Data Layer
- **useBudgetCalculations.js** - Core budget math and allocations
- **usePaycheckTimeline.js** - Timeline calculations and urgency scoring
- **useLocalStorage.js** - Data persistence
- **paycheckTimelineUtils.js** - Timeline utility functions

## Files Ready for Cleanup

### ARCHIVE (keep for potential reuse)
- `BudgiePet.js` - Standalone pet component (replaced by integrated version)
- `SummaryPanel.js` - Old summary component (might reimplement)
- `dataMigration.js` - Data migration utility (may need again)

### DELETE (completely replaced)
- `CategoriesSection.js` - Replaced by PlanningMode/ImprovedFundingMode
- `FundingMode.js` - Replaced by ImprovedFundingMode.js
- `SummaryCards.js` - Replaced by SimplifiedSummaryCards.js
- `TabNavigation.js` - Replaced by inline navigation in App.js
- `TransactionsSection.js` - Replaced by TransactionsTab.js
- `AddExpenseForm.js` - Replaced by UnifiedItemForm.js
- `AddGoalForm.js` - Replaced by UnifiedItemForm.js

## Key Features

### Budget Modes
1. **Planning Mode** - Organize expenses/goals by category, toggle active/inactive
2. **Funding Mode** - Smart recommendations for category funding
3. **Transactions** - Full transaction management with filtering
4. **Calendar** - Visual timeline of paychecks, due dates, goals

### Smart Calculations
- Automatic per-paycheck allocation calculations
- Urgency scoring based on deadlines and available paychecks
- Timeline analysis for funding readiness
- Buffer calculations and remaining income tracking

### Data Structure
```
Categories (envelopes)
├── allocated: real money allocated
├── spent: real money spent
└── Planning Items
    ├── Expenses (recurring bills, etc.)
    └── Savings Goals (targets with dates)
```

## Current Focus: Code Cleanup

### Immediate Tasks
1. **Archive Setup** - Move 3 files to archive/ folder outside searches
2. **Delete Unused** - Remove 7 completely replaced components
3. **Import Cleanup** - Remove unused imports from remaining files
4. **Test** - Ensure app functionality after cleanup

### Technical Debt
- Consolidate overlapping functionality between components
- Optimize bundle size after cleanup
- Improve TypeScript adoption
- Enhanced error handling and validation

## Development Patterns

### State Management
- Uses custom useLocalStorage hook for persistence
- React state for UI interactions
- No external state management library

### Styling
- Tailwind CSS with custom theme system
- CSS custom properties for theme switching
- 10 themes (5 light, 5 dark seasonal themes)

### Data Flow
```
User Input → UnifiedItemForm → App State → Calculations Hook → UI Updates
```

## API Integration Notes
- No external APIs currently
- localStorage for all data persistence
- Future: potential bank API integration
- Export functionality for YNAB compatibility

## Performance Considerations
- Bundle size optimization needed after cleanup
- Large calculation hooks need optimization
- Calendar view performance with many events

## Browser Support
- Modern browsers (ES6+)
- No IE support required
- Mobile responsive design

---

## Instructions for AI Assistant

When working on this project:
1. **Always preserve** the core components listed above
2. **Be cautious** with data hooks - they contain complex financial calculations
3. **Test calculations** after any changes to hooks or utilities
4. **Maintain** the three-layer architecture concept
5. **Consider** mobile responsiveness in any UI changes
6. **Preserve** localStorage data structure for user data safety