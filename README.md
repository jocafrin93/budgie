# README - The Road So Far 🦜


**✅Complete✅**
 - [x] Calendar view
 - [x] Adding income transactions
 - [x] Split checks
 - [x] Timeline view
 - [x] Spending from categories
 - [x] Priority-based expense classification
 - [x] Dark/light mode toggle
 - [x] What-if analysis mode
 - [x] Support for various expense frequencies (weekly, bi-weekly, monthly, quarterly, etc.)
 - [x] Expense and savings goal tracking with progress indicators
 - [x] Calendar view for paycheck and deadline visualization
 - [x] Categories with collapsible organization
 - [x] Priority-based expense classification
 - [x] Funding status tracking with progress bars
 - [x] Data persistence on localStorage
 - [x] Drag and drop reordering

**🚧Missing Core Features:🚧**

 - [ ] Urgency indicators and catch-up timeline calculations (see below)
 - [ ] Tab Structure
	 - [ ] Transactions
	 - [ ] Reporting (?)
	 - [ ] Config
	 - [ ] Payee management
 - [ ]  Add recurring expenses to transactions
 - [ ] Cross-device sync
	 - [ ] JSON with cloud sync?
 - [ ] Funding bars on item view
 - [ ] Three-paycheck month identification

<details>
<summary>**Catch-up timeline**</summary>

> How should you handle things you've already got money for? For
> example, for one of your yearly expenses, you've already got a few
> months' worth squirreled away.

**Option 1: "Amount Already Saved" Field**
*Add a field to expenses/goals where you can specify how much you've already set aside. The calculator would then:*
-   Show your remaining needed allocation
-   Calculate a "catch-up timeline"
-   Optionally reduce your bi-weekly allocation until you're back on track

**Option 2: "Funding Status" Tracking**
*Add a progress indicator that shows:*
-   Total needed for the expense
-   Amount already saved
-   Remaining to save
-   Whether you can reduce/pause this allocation

**Option 3: "Smart Allocation Adjustment"**
*The calculator could automatically:*
-   Detect when you're ahead on an expense
-   Suggest reducing the bi-weekly amount
- Show you how the extra money could be reallocated
</details>

	 

**👩🏼‍🔧Fixes:👩🏼‍🔧**

 - [ ] Consistent formatting for currency
	 - what do you call it when you start typing a number and as you type, it moves past the decimal? Whatever that is.
 - [ ] Fix margins/padding around split check and config cards
 - [ ] Require due dates for recurring expenses
 - [ ] Consolidate to remove scroll on forms
 - [ ] Slim down categories and items when collapsed
 - [ ] Fix "next few months" verbiage on calendar view
 - [ ] Redo notes export
 - [ ] Dark mode hover on goals, expenses

## **Stretch Goals:**

 - [ ] New themes (see below)
 - [ ] Reporting and Analytics
 - [ ] Add cleaner sample data
 - [ ] Inline calculator
 - [ ] Change split deposit functionality into multiple checks - for shared accounts, couples, etc. 

<details>
<summary>🎨 **Different Color Schemes for Categories**</summary>

 **Seasonal themes**: Spring pastels, autumn warmth, winter blues, summer brights

✨  **Seasonal Theme Features:** ✨ 

- **🌸 Spring**: Soft pastels - pinks, greens, purples, yellows  
- **☀️ Summer**: Vibrant warmth - oranges, yellows, reds, bright pinks  
- **🍂 Autumn**: Rich earth tones - ambers, deep oranges, warm reds
- **❄️ Winter**: Cool elegance - blues, slates, indigos, cyans

🎮 **How to Use:**🎮 

- Theme selector in the top-right header with a gradient button showing current theme
- Hover to see options - dropdown appears with all four seasonal themes
- One-click switching - instantly updates all category colors
- Auto-updates existing categories when you change themes

🎨 **Smart Features:** 🎨

- Each theme has 8 coordinated colors for variety
- Gradient accent colors that match each season's vibe
- Existing categories automatically get new colors when switching
- New categories will use the current theme's palette
</details>