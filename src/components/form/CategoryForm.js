// Enhanced CategoryForm.js with full UnifiedItemForm functionality for single categories

import { DollarSign, Package, Target } from 'lucide-react';
import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { frequencyOptions } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import {
  BaseForm,
  CheckboxField,
  ColorPickerField,
  CurrencyField,
  DateField,
  GoalFieldGroup,
  PercentageField,
  SelectField,
  TextField
} from './';

const formFrequencyOptions = frequencyOptions.map(freq => ({
  value: freq.value,
  label: freq.label
}));

const CategoryForm = ({
  category = null,
  onSave,
  onCancel,
  darkMode = false,
  payFrequency = 'bi-weekly',
  accounts = [],
  currentPay = 0
}) => {
  // Determine initial category type
  const initialCategoryType = category?.type || 'single';
  const [categoryType, setCategoryType] = useState(initialCategoryType);

  // Single category item data (enhanced with all UnifiedItemForm fields)
  const [itemType, setItemType] = useState(category?.settings?.itemType || 'expense');
  const [usePercentage, setUsePercentage] = useState(category?.settings?.usePercentage || false);
  const [amount, setAmount] = useState(category?.settings?.amount || 0);
  const [percentageAmount, setPercentageAmount] = useState(category?.settings?.percentageAmount || 0);
  const [frequency, setFrequency] = useState(category?.settings?.frequency || 'monthly');
  const [dueDate, setDueDate] = useState(category?.settings?.dueDate || '');
  const [isRecurring, setIsRecurring] = useState(category?.settings?.isRecurring || false);
  const [accountId, setAccountId] = useState(category?.settings?.accountId || (accounts[0]?.id || ''));
  const [priorityState, setPriorityState] = useState(category?.settings?.priorityState || 'active');
  const [priority, setPriority] = useState(category?.settings?.priority || 'medium');

  // Goal-specific fields
  const [targetAmount, setTargetAmount] = useState(category?.settings?.targetAmount || 0);
  const [targetDate, setTargetDate] = useState(category?.settings?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)));
  const [monthlyContribution, setMonthlyContribution] = useState(category?.settings?.monthlyContribution || 0);
  const [monthlyPercentage, setMonthlyPercentage] = useState(category?.settings?.monthlyPercentage || 0);
  const [alreadySaved, setAlreadySaved] = useState(category?.settings?.alreadySaved || 0);

  // Auto-funding settings
  const [autoFundingEnabled, setAutoFundingEnabled] = useState(
    category?.autoFunding?.enabled || false
  );
  const [maxAutoFunding, setMaxAutoFunding] = useState(
    category?.autoFunding?.maxAmount || 500
  );

  // Initialize form with useForm hook for base fields
  const initialValues = {
    name: category?.name || '',
    color: category?.color || 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: category?.description || ''
  };

  const form = useForm({
    initialValues,
    onSubmit: (values) => {
      // Combine form values with category type and item data
      const formData = {
        ...values,
        type: categoryType,
        autoFunding: {
          enabled: autoFundingEnabled,
          maxAmount: parseFloat(maxAutoFunding) || 500,
          priority: 'medium'
        },
        // Include single category specific data with full item details
        ...(categoryType === 'single' && {
          settings: {
            // Item type and basic info
            itemType,
            usePercentage,
            accountId,
            priorityState,
            priority,

            // Expense-specific fields
            ...(itemType === 'expense' && {
              amount: usePercentage
                ? percentageToDollar(parseFloat(percentageAmount), currentPay)
                : parseFloat(amount) || 0,
              percentageAmount: parseFloat(percentageAmount) || 0,
              frequency: isRecurring ? frequency : 'monthly',
              dueDate: dueDate || null,
              isRecurring
            }),

            // Goal-specific fields  
            ...(itemType === 'goal' && {
              targetAmount: parseFloat(targetAmount) || 0,
              targetDate,
              monthlyContribution: parseFloat(monthlyContribution) || 0,
              monthlyPercentage: parseFloat(monthlyPercentage) || 0,
              alreadySaved: parseFloat(alreadySaved) || 0
            })
          }
        }),
        // Only include ID if we're editing an existing category
        ...(category ? { id: category.id } : {})
      };

      onSave(formData);
    },
    validate: (values) => {
      const errors = {};

      if (!values.name.trim()) {
        errors.name = 'Name is required';
      }

      if (!values.color) {
        errors.color = 'Color is required';
      }

      // Single category validation
      if (categoryType === 'single') {
        if (itemType === 'expense') {
          if (usePercentage) {
            if (!percentageAmount || parseFloat(percentageAmount) <= 0) {
              errors.percentageAmount = 'Percentage must be greater than 0';
            }
          } else {
            if (!amount || parseFloat(amount) <= 0) {
              errors.amount = 'Amount must be greater than 0';
            }
          }
          // Frequency required if recurring
          if (isRecurring && !frequency) {
            errors.frequency = 'Frequency is required when expense is recurring';
          }
        } else if (itemType === 'goal') {
          if (!targetAmount || parseFloat(targetAmount) <= 0) {
            errors.targetAmount = 'Target amount must be greater than 0';
          }
        }

        if (!accountId) {
          errors.accountId = 'Funding account is required';
        }
      }

      return errors;
    }
  });

  // Handle amount/percentage toggle for expenses
  const handleAmountModeToggle = (usePerc) => {
    if (usePerc && !usePercentage && amount && currentPay > 0) {
      // Convert dollar to percentage
      const convertedPercentage = dollarToPercentage(parseFloat(amount), currentPay);
      setPercentageAmount(convertedPercentage);
    } else if (!usePerc && usePercentage && percentageAmount && currentPay > 0) {
      // Convert percentage to dollar
      const convertedAmount = percentageToDollar(parseFloat(percentageAmount), currentPay);
      setAmount(convertedAmount);
    }
    setUsePercentage(usePerc);
  };

  // Handle goal field changes
  const handleGoalFieldChange = (fieldName, value) => {
    switch (fieldName) {
      case 'targetAmount':
        setTargetAmount(value);
        break;
      case 'targetDate':
        setTargetDate(value);
        break;
      case 'monthlyContribution':
        setMonthlyContribution(value);
        // Also update percentage if currentPay available
        if (currentPay > 0) {
          const percentage = dollarToPercentage(parseFloat(value) || 0, currentPay);
          setMonthlyPercentage(percentage);
        }
        break;
      case 'monthlyPercentage':
        setMonthlyPercentage(value);
        // Also update dollar amount if currentPay available
        if (currentPay > 0) {
          const dollarAmount = percentageToDollar(parseFloat(value) || 0, currentPay);
          setMonthlyContribution(dollarAmount);
        }
        break;
      case 'alreadySaved':
        setAlreadySaved(value);
        break;
      default:
        break;
    }
  };

  // Account options
  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.name
  }));

  // Priority state options
  const priorityStateOptions = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const handleSubmitAnother = () => {
    // Prepare the data manually (same as your form's onSubmit)
    const formData = {
      ...form.values,
      type: categoryType,
      autoFunding: {
        enabled: autoFundingEnabled,
        maxAmount: parseFloat(maxAutoFunding) || 500,
        priority: 'medium'
      },
      // Include single category specific data if applicable
      ...(categoryType === 'single' && {
        settings: {
          itemType,
          usePercentage,
          accountId,
          priorityState,
          priority,

          ...(itemType === 'expense' && {
            amount: usePercentage
              ? percentageToDollar(parseFloat(percentageAmount), currentPay)
              : parseFloat(amount) || 0,
            percentageAmount: parseFloat(percentageAmount) || 0,
            frequency: isRecurring ? frequency : 'monthly',
            dueDate: dueDate || null,
            isRecurring
          }),

          ...(itemType === 'goal' && {
            targetAmount: parseFloat(targetAmount) || 0,
            targetDate,
            monthlyContribution: parseFloat(monthlyContribution) || 0,
            monthlyPercentage: parseFloat(monthlyPercentage) || 0,
            alreadySaved: parseFloat(alreadySaved) || 0
          })
        }
      }),
      ...(category ? { id: category.id } : {})
    };

    // Call onSave with addAnother flag
    onSave(formData, true);

    // Reset form for next category
    setTimeout(() => {
      form.setFieldValue('name', '');
      form.setFieldValue('description', '');
      setAmount(0);
      setPercentageAmount(0);
      setDueDate('');
      setIsRecurring(false);
      setTargetAmount(0);
      setMonthlyContribution(0);
      setAlreadySaved(0);

      // Focus name field
      const nameInput = document.querySelector('input[name="name"]');
      if (nameInput) nameInput.focus();
    }, 100);
  };

  return (
    <BaseForm
      onSubmit={form.handleSubmit}
      onCancel={onCancel}
      onSubmitAnother={!category ? handleSubmitAnother : undefined}
      submitLabel={category ? 'Update Category' : 'Add Category'}
      showSubmitAnother={!category}
      isSubmitDisabled={!form.isValid}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
          <p className="text-sm text-theme-secondary">
            Categories organize your expenses and goals for easier budgeting
          </p>
        </div>

        {/* Category Name */}
        <TextField
          {...form.getFieldProps('name')}
          label="Category Name"
          placeholder="Enter category name"
          autoFocus
          required
          darkMode={darkMode}
        />

        {/* Category Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Category Type *
          </label>
          <div className="space-y-3">
            {/* Single Item Option */}
            <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${categoryType === 'single'
              ? 'selection-primary-active'
              : 'border-theme-secondary bg-theme-secondary hover:bg-theme-hover'
              }`}>
              <input
                type="radio"
                name="categoryType"
                value="single"
                checked={categoryType === 'single'}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Single Item Category
                </div>
                <p className="text-sm mt-1">
                  One specific expense or goal with detailed configuration options.
                </p>
              </div>
            </label>

            {/* Multiple Items Option */}
            <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${categoryType === 'multiple'
              ? 'selection-primary-active'
              : 'border-theme-secondary bg-theme-secondary hover:bg-theme-hover'
              }`}>
              <input
                type="radio"
                name="categoryType"
                value="multiple"
                checked={categoryType === 'multiple'}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Multiple Items Category
                </div>
                <p className="text-sm mt-1">
                  Detailed planning with individual item tracking and active/planning states.
                </p>
                {categoryType === 'multiple' && (
                  <div className="mt-3 p-3 callout-info rounded border">
                    <div className="text-xs font-medium ">
                      ✨ Add individual items after creating the category
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Single Category Enhanced Details */}
        {categoryType === 'single' && (
          <div className="space-y-4 p-4 slection-primary-active">
            {/* Item Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-theme-primary">What are you planning for?</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setItemType('expense')}
                  className={`flex-1 py-2 px-4 rounded flex items-center justify-center space-x-2 transition-colors ${itemType === 'expense'
                    ? 'btn-primary'
                    : 'btn-secondary'
                    }`}
                >
                  <span>💸</span>
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('goal')}
                  className={`flex-1 py-2 px-4 rounded flex items-center justify-center space-x-2 transition-colors ${itemType === 'goal'
                    ? 'btn-success'
                    : 'btn-secondary'
                    }`}
                >
                  <span>🎯</span>
                  <span>Goal</span>
                </button>
              </div>
            </div>

            {itemType === 'expense' ? (
              // Expense Fields
              <>
                {/* Amount Input Mode Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-theme-primary">
                    How do you want to set the amount?
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAmountModeToggle(false)}
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${!usePercentage
                        ? 'btn-primary'
                        : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                        }`}
                    >
                      <span className="mr-1">💰</span>
                      Dollar Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAmountModeToggle(true)}
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${usePercentage
                        ? 'btn-success'
                        : 'bg-theme-secondary text-theme-primary hover:bg-theme-hover'
                        }`}
                    >
                      <span className="mr-1">📊</span>
                      % of Paycheck
                    </button>
                  </div>
                </div>

                {/* Amount Field */}
                {usePercentage ? (
                  <PercentageField
                    name="percentageAmount"
                    label="Percentage of Income"
                    value={percentageAmount}
                    onChange={(e) => setPercentageAmount(e.target.value)}
                    placeholder="0.0"
                    required
                    darkMode={darkMode}
                    hint={currentPay > 0 ? `Approx. $${percentageToDollar(percentageAmount || 0, currentPay).toFixed(2)}` : ''}
                  />
                ) : (
                  <CurrencyField
                    name="amount"
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    darkMode={darkMode}
                    hint={currentPay > 0 ? `Approx. ${dollarToPercentage(amount || 0, currentPay).toFixed(1)}% of income` : ''}
                  />
                )}

                {/* Due Date */}
                <DateField
                  name="dueDate"
                  label="Due Date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required={false}
                  darkMode={darkMode}
                  hint="Optional - leave blank if no specific due date"
                />

                {/* Recurring Checkbox - Only if due date provided */}
                {dueDate && (
                  <CheckboxField
                    name="isRecurring"
                    label="This is a recurring expense"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    darkMode={darkMode}
                  />
                )}

                {/* Frequency - Only if due date provided AND recurring */}
                {dueDate && isRecurring && (
                  <SelectField
                    name="frequency"
                    label="Frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    options={formFrequencyOptions}
                    required={true}
                    darkMode={darkMode}
                    hint="How often does this expense repeat?"
                  />
                )}
              </>
            ) : (
              // Goal Fields
              <GoalFieldGroup
                formValues={{
                  targetAmount,
                  targetDate,
                  monthlyContribution,
                  monthlyPercentage,
                  alreadySaved
                }}
                onChange={(e) => handleGoalFieldChange(e.target.name, e.target.value)}
                errors={form.errors}
                currentPay={currentPay}
              />
            )}

            {/* Account Selection */}
            <SelectField
              name="accountId"
              label="Funding Account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={accountOptions}
              required
              darkMode={darkMode}
            />

            {/* Priority State */}
            <SelectField
              name="priorityState"
              label="Status"
              value={priorityState}
              onChange={(e) => setPriorityState(e.target.value)}
              options={priorityStateOptions}
              required
              darkMode={darkMode}
            />

            {/* Priority */}
            <SelectField
              name="priority"
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={priorityOptions}
              required
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Category Color */}
        <ColorPickerField
          {...form.getFieldProps('color')}
          label="Category Color"
          darkMode={darkMode}
        />

        {/* Auto-funding Settings */}
        <div className="space-y-4 p-4 bg-theme-secondary rounded-lg border border-theme-secondary">
          <h4 className="font-medium text-theme-primary flex items-center gap-2">
            <Target className="w-4 h-4" />
            Auto-funding Settings
          </h4>

          <CheckboxField
            name="autoFundingEnabled"
            label="Enable auto-funding for this category"
            checked={autoFundingEnabled}
            onChange={(e) => setAutoFundingEnabled(e.target.checked)}
            darkMode={darkMode}
          />

          {autoFundingEnabled && (
            <CurrencyField
              name="maxAutoFunding"
              label="Maximum Auto-funding Amount"
              value={maxAutoFunding}
              onChange={(e) => setMaxAutoFunding(e.target.value)}
              placeholder="500.00"
              darkMode={darkMode}
              hint="Maximum amount to auto-allocate to this category"
            />
          )}
        </div>

        {/* Description */}
        <TextField
          {...form.getFieldProps('description')}
          label="Description (Optional)"
          placeholder="Add notes about this category"
          darkMode={darkMode}
        />
      </div>
    </BaseForm>
  );
};

export default CategoryForm;