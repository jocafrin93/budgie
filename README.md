



# README - The Road So Far 🦜


## **✅Complete✅**
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
 - [X] Consistent formatting for currency (cash register)
  - [X] Form 0s and misalignment



## **🚧Missing Core Features:🚧**
 - [ ] Urgency indicators and catch-up timeline calculations<sup>1</sup>
 - [ ] Tab Structure
	 - [ ] Transactions
	 - [ ] Reporting (?)
	 - [ ] Config
	 - [ ] Payee management
 - [ ]  Add recurring expenses to transactions
        - Recur until X, number of occurrences 
 - [ ] Cross-device sync
	 - [ ] JSON with cloud sync?
 - [ ] Funding bars on item view
 - [ ] Three-paycheck month identification
 - [ ] Budget interfacing with calculator<sup>2</sup>
 


## **👩🏼‍🔧Fixes:👩🏼‍🔧**

 - [ ] Fix margins/padding around split check and config cards
 - [ ] Require due dates for recurring expenses
 - [ ] Consolidate to remove scroll on forms
 - [ ] Slim down categories and items when collapsed
 - [ ] Fix "next few months" verbiage on calendar view
 - [ ] Redo notes export
 - [ ] Dark mode hover on goals, expenses

## **Stretch Goals:**

 - [ ] New themes (see below)<sup>3</sup>
 - [ ] Reporting and Analytics
 - [ ] Add cleaner sample data
 - [ ] Inline calculator
 - [ ] Change split deposit functionality into multiple checks - for shared accounts, couples, etc.
 - [ ] Add more pay frequencies

##

**<details><summary> <sup>1</sup> 🏎️Catch-up timeline </summary>**

>How should you handle things you've already got money for? For example, for one of your yearly expenses, you've already got a few months' worth squirreled away.

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

**<details><summary> <sup>2</sup> 🔗Calc/Budget integration</summary>**
**1. Update the paySchedule state to use actual account IDs:**
```
const [paySchedule, setPaySchedule] = useState({ startDate: '2025-06-15', 
frequency: 'bi-weekly', 
splitPaycheck: false, 
primaryAmount: 2200, 
secondaryAmount: 600, 
secondaryDaysEarly: 2, 
primaryAccountId: 1, // Reference to actual account secondaryAccountId: 2 // Reference to actual account 
 });
```
**2. Update the split paycheck configuration to use account dropdowns**

```{paySchedule.splitPaycheck && (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Primary Bank Account</label>
        <select
          value={paySchedule.primaryAccountId}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, primaryAccountId: parseInt(e.target.value) }))}
          className={`w-full p-2 border rounded mb-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>{account.name} ({account.bankName})</option>
          ))}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={paySchedule.primaryAmount}
            onChange={(e) => setPaySchedule(prev => ({ ...prev, primaryAmount: parseFloat(e.target.value) || 0 }))}
            className={`w-full pl-8 p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">Main deposit</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Secondary Bank Account</label>
        <select
          value={paySchedule.secondaryAccountId}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryAccountId: parseInt(e.target.value) }))}
          className={`w-full p-2 border rounded mb-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          {accounts.filter(acc => acc.id !== paySchedule.primaryAccountId).map(account => (
            <option key={account.id} value={account.id}>{account.name} ({account.bankName})</option>
          ))}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={paySchedule.secondaryAmount}
            onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryAmount: parseFloat(e.target.value) || 0 }))}
            className={`w-full pl-8 p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">Early deposit</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Days Early for Secondary Bank</label>
        <input
          type="number"
          min="1"
          max="5"
          value={paySchedule.secondaryDaysEarly}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryDaysEarly: parseInt(e.target.value) || 2 }))}
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        />
        <div className="text-xs text-gray-500 mt-1">days before main deposit</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Total</label>
        <div className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'} text-center font-semibold`}>
          ${(paySchedule.primaryAmount + paySchedule.secondaryAmount).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">Combined</div>
      </div>
    </div>
  </div>
)}
```
**3. Update the calendar event generation to use actual account names:**
```
const generatePaycheckEventsWithSplit = (paySchedule, currentPay, accounts) => {
  const events = [];
  const primaryDates = generatePaycheckDates(paySchedule);

  primaryDates.forEach((date, index) => {
    const primaryAmount = paySchedule.splitPaycheck ? paySchedule.primaryAmount : currentPay;
    const primaryAccount = accounts.find(acc => acc.id === paySchedule.primaryAccountId);

    // Add primary paycheck
    events.push({
      date: new Date(date),
      type: 'paycheck',
      subtype: 'primary',
      title: paySchedule.splitPaycheck ? `${primaryAccount?.name || 'Primary Bank'}` : `Paycheck #${index + 1}`,
      amount: primaryAmount,
      description: `${paySchedule.splitPaycheck ? 'Main deposit' : 'Bi-weekly income'}: $${primaryAmount.toFixed(2)}${primaryAccount ? ` → ${primaryAccount.name}` : ''}`,
      accountId: paySchedule.splitPaycheck ? paySchedule.primaryAccountId : null
    });
```

Add secondary paycheck if split is enabled

   ```
    if (paySchedule.splitPaycheck && paySchedule.secondaryAmount > 0) {
      const secondaryDate = new Date(date);
      secondaryDate.setDate(date.getDate() - paySchedule.secondaryDaysEarly);
      const secondaryAccount = accounts.find(acc => acc.id === paySchedule.secondaryAccountId);

      events.push({
        date: secondaryDate,
        type: 'paycheck',
        subtype: 'secondary',
        title: `${secondaryAccount?.name || 'Secondary Bank'}`,
        amount: paySchedule.secondaryAmount,
        description: `Early deposit: $${paySchedule.secondaryAmount.toFixed(2)} (${paySchedule.secondaryDaysEarly} days early) → ${secondaryAccount?.name || 'Secondary Bank'}`,
        accountId: paySchedule.secondaryAccountId
      });
    }
  });

  return events.sort((a, b) => a.date - b.date);
};
```
**4. Update the calendar call to pass accounts:**

Update this in generateCalendarEvents:

```
const paycheckEvents = generatePaycheckEventsWithSplit(paySchedule, currentPay, accounts);
```

And update your CalendarView call to pass accounts:

```
<CalendarView
events={[]}
darkMode={darkMode}
currentPay={currentPay}
paySchedule={paySchedule}
savingsGoals={savingsGoals}
expenses={expenses}
categories={categories}
frequencyOptions={frequencyOptions}
accounts={accounts} // Add this
/>
```
</details>


**<details><summary> <sup>3</sup> 🎨Different Color Schemes for Categories</summary>**
**<details><summary> <sup>2</sup> 🔗Calc/Budget integration</summary>**
**1. Update the paySchedule state to use actual account IDs:**
```
const [paySchedule, setPaySchedule] = useState({ startDate: '2025-06-15', 
frequency: 'bi-weekly', 
splitPaycheck: false, 
primaryAmount: 2200, 
secondaryAmount: 600, 
secondaryDaysEarly: 2, 
primaryAccountId: 1, // Reference to actual account secondaryAccountId: 2 // Reference to actual account 
 });
```
**2. Update the split paycheck configuration to use account dropdowns**

```{paySchedule.splitPaycheck && (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Primary Bank Account</label>
        <select
          value={paySchedule.primaryAccountId}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, primaryAccountId: parseInt(e.target.value) }))}
          className={`w-full p-2 border rounded mb-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>{account.name} ({account.bankName})</option>
          ))}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={paySchedule.primaryAmount}
            onChange={(e) => setPaySchedule(prev => ({ ...prev, primaryAmount: parseFloat(e.target.value) || 0 }))}
            className={`w-full pl-8 p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">Main deposit</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Secondary Bank Account</label>
        <select
          value={paySchedule.secondaryAccountId}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryAccountId: parseInt(e.target.value) }))}
          className={`w-full p-2 border rounded mb-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          {accounts.filter(acc => acc.id !== paySchedule.primaryAccountId).map(account => (
            <option key={account.id} value={account.id}>{account.name} ({account.bankName})</option>
          ))}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={paySchedule.secondaryAmount}
            onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryAmount: parseFloat(e.target.value) || 0 }))}
            className={`w-full pl-8 p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">Early deposit</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Days Early for Secondary Bank</label>
        <input
          type="number"
          min="1"
          max="5"
          value={paySchedule.secondaryDaysEarly}
          onChange={(e) => setPaySchedule(prev => ({ ...prev, secondaryDaysEarly: parseInt(e.target.value) || 2 }))}
          className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        />
        <div className="text-xs text-gray-500 mt-1">days before main deposit</div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Total</label>
        <div className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'} text-center font-semibold`}>
          ${(paySchedule.primaryAmount + paySchedule.secondaryAmount).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">Combined</div>
      </div>
    </div>
  </div>
)}
```
**3. Update the calendar event generation to use actual account names:**
```
const generatePaycheckEventsWithSplit = (paySchedule, currentPay, accounts) => {
  const events = [];
  const primaryDates = generatePaycheckDates(paySchedule);

  primaryDates.forEach((date, index) => {
    const primaryAmount = paySchedule.splitPaycheck ? paySchedule.primaryAmount : currentPay;
    const primaryAccount = accounts.find(acc => acc.id === paySchedule.primaryAccountId);

    // Add primary paycheck
    events.push({
      date: new Date(date),
      type: 'paycheck',
      subtype: 'primary',
      title: paySchedule.splitPaycheck ? `${primaryAccount?.name || 'Primary Bank'}` : `Paycheck #${index + 1}`,
      amount: primaryAmount,
      description: `${paySchedule.splitPaycheck ? 'Main deposit' : 'Bi-weekly income'}: $${primaryAmount.toFixed(2)}${primaryAccount ? ` → ${primaryAccount.name}` : ''}`,
      accountId: paySchedule.splitPaycheck ? paySchedule.primaryAccountId : null
    });
```

Add secondary paycheck if split is enabled

   ```
    if (paySchedule.splitPaycheck && paySchedule.secondaryAmount > 0) {
      const secondaryDate = new Date(date);
      secondaryDate.setDate(date.getDate() - paySchedule.secondaryDaysEarly);
      const secondaryAccount = accounts.find(acc => acc.id === paySchedule.secondaryAccountId);

      events.push({
        date: secondaryDate,
        type: 'paycheck',
        subtype: 'secondary',
        title: `${secondaryAccount?.name || 'Secondary Bank'}`,
        amount: paySchedule.secondaryAmount,
        description: `Early deposit: $${paySchedule.secondaryAmount.toFixed(2)} (${paySchedule.secondaryDaysEarly} days early) → ${secondaryAccount?.name || 'Secondary Bank'}`,
        accountId: paySchedule.secondaryAccountId
      });
    }
  });

  return events.sort((a, b) => a.date - b.date);
};
```
**4. Update the calendar call to pass accounts:**

Update this in generateCalendarEvents:

```
const paycheckEvents = generatePaycheckEventsWithSplit(paySchedule, currentPay, accounts);
```

And update your CalendarView call to pass accounts:

```
<CalendarView
events={[]}
darkMode={darkMode}
currentPay={currentPay}
paySchedule={paySchedule}
savingsGoals={savingsGoals}
expenses={expenses}
categories={categories}
frequencyOptions={frequencyOptions}
accounts={accounts} // Add this
/>
```
</details>


**<details><summary> <sup>3</sup> 🎨Different Color Schemes for Categories</summary>**

 >Seasonal themes: Spring pastels, autumn warmth, winter blues, summer brights
 >Seasonal themes: Spring pastels, autumn warmth, winter blues, summer brights

**✨Seasonal Theme Features**:✨ 
**✨Seasonal Theme Features**:✨ 

- **🌸 Spring**: Soft pastels - pinks, greens, purples, yellows  
- **☀️ Summer**: Vibrant warmth - oranges, yellows, reds, bright pinks  
- **🍂 Autumn**: Rich earth tones - ambers, deep oranges, warm reds
- **❄️ Winter**: Cool elegance - blues, slates, indigos, cyans

**🎮 How to Use**:🎮 
**🎮 How to Use**:🎮 

- Theme selector in the top-right header with a gradient button showing current theme
- Hover to see options - dropdown appears with all four seasonal themes
- One-click switching - instantly updates all category colors
- Auto-updates existing categories when you change themes

**🎨 Smart Features**:🎨
**🎨 Smart Features**:🎨

- Each theme has 8 coordinated colors for variety
- Gradient accent colors that match each season's vibe
- Existing categories automatically get new colors when switching
- New categories will use the current theme's palette
</details>
