# Budget Calculator Development Session Summary
# Changelog

## [Unreleased]
### Added
- Drag and drop reordering for categories, expenses, and goals
- Dark mode hover state fixes

### Changed
- Standardized data model using planningItems and activeBudgetAllocations
- Extracted utility functions for common calculations into specialized files
- Consolidated form components with a reusable form system
- Broke down calculation hooks into smaller, more focused hooks
- Simplified summary cards with a generic component approach
- Separated Budget Buddy pet into its own component

### Fixed
- Text readability in dark mode on hover
- Improved code maintainability and reduced duplication
- Enhanced separation of concerns across components

## [1.0.0] - 2025-06-07
### Added
- Initial release
- Bi-weekly budget calculator
- Expense tracking with multiple frequencies
- Savings goals with progress tracking
- Transaction management
- Calendar view for paychecks and due dates
- Dark/light mode toggle

Version 1.0 
### 1. **Recurring Expenses Feature** ✅
- Added checkbox to expense form: "This expense repeats on the calendar"
- Updated calendar to show multiple instances of recurring expenses
- Fixed icon logic: 🔄 for ALL recurring instances, ⏰ for single expenses
- Removed occurrence numbers (#2, #3, etc.) from titles

### 2. **Enhanced Calendar System** ✅
- Added calendar grid view with month navigation
- Toggle between grid and timeline views
- Made calendar modal much wider and responsive
- Added escape key functionality 
- Fixed light mode colors (added CSS overrides for proper Tailwind colors)
- Consistent icons and legends across both views

### 3. **Paycheck Scheduling** ✅
- Added "Next Paycheck Date" field to configuration
- Calendar now generates accurate paycheck dates based on user input

### 4. **Split Paycheck Feature** ✅
- Added split paycheck checkbox with account integration
- Only shows when user has 2+ accounts
- Helpful prompt to add second account if needed
- Shows primary/secondary bank amounts with account dropdowns
- Configurable early deposit timing (X days before main deposit)
- Calendar shows both deposits with correct timing

### 5. **UI/UX Improvements** ✅
- Fixed dollar sign positioning in all forms (now properly inside input fields)
- Made configuration responsive (stacks at tablet width)
- Enhanced form styling and layout
- Added account integration throughout

### 6. **Enhanced Priority System**
   - Replace simple pause checkbox with visual priority states:
     - 🟢 Active (allocating money)
     - ⏸️ Paused (tracking but not funding)
     - ✅ Complete (fully funded)