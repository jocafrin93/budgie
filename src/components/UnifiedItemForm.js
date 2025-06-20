import React, { useEffect } from 'react';
import { 
  BaseForm, 
  TextField, 
  SelectField, 
  DateField, 
  CheckboxField, 
  CurrencyField,
  GoalFieldGroup
} from './form';
import { useForm } from '../hooks/useForm';
import { formatDate } from '../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../utils/moneyUtils';

const UnifiedItemForm = ({ 
  item = null, 
  onSave, 
  onCancel, 
  categories = [], 
  accounts = [],
  currentPay = 0,
  preselectedCategory = null,
  darkMode
}) => {
  // Determine if we're editing an expense or a goal
  const isGoal = item?.targetAmount !== undefined;
  const initialType = isGoal ? 'goal' : 'expense';
  
  // Initialize form with useForm hook
  const form = useForm({
    initialValues: {
      type: initialType,
      name: item?.name || '',
      amount: item?.amount || '',
      usePercentage: item?.usePercentage || false,
      percentageAmount: item?.percentageAmount || '',
      frequency: item?.frequency || 'monthly',
      dueDate: item?.dueDate || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
      categoryId: item?.categoryId || preselectedCategory?.id || (categories[0]?.id || ''),
      accountId: item?.accountId || (accounts[0]?.id || ''),
      priorityState: item?.priorityState || 'active',
      isRecurring: item?.isRecurring !== false, // Default to true for new items
      priority: item?.priority || 'medium',
      
      // Goal-specific fields
      targetAmount: item?.targetAmount || '',
      targetDate: item?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
      monthlyContribution: item?.monthlyContribution || '',
      alreadySaved: item?.alreadySaved || 0,
    },
    onSubmit: (values) => {
      // Prepare the data based on item type
      const commonData = {
        name: values.name,
        categoryId: values.categoryId,
        accountId: values.accountId,
        priorityState: values.priorityState,
      };
      
      if (values.type === 'expense') {
        onSave({
          ...commonData,
          type: 'expense',
          amount: values.usePercentage 
            ? percentageToDollar(parseFloat(values.percentageAmount) || 0, currentPay) 
            : parseFloat(values.amount) || 0,
          usePercentage: values.usePercentage,
          percentageAmount: parseFloat(values.percentageAmount) || 0,
          frequency: values.frequency,
          dueDate: values.dueDate,
          isRecurring: values.isRecurring,
          priority: values.priority,
        });
      } else {
        onSave({
          ...commonData,
          type: 'goal',
          targetAmount: parseFloat(values.targetAmount) || 0,
          targetDate: values.targetDate,
          monthlyContribution: parseFloat(values.monthlyContribution) || 0,
          alreadySaved: parseFloat(values.alreadySaved) || 0,
        });
      }
    },
    validate: (values) => {
      const errors = {};
      
      // Common validations
      if (!values.name) {
        errors.name = 'Name is required';
      }
      
      if (!values.categoryId) {
        errors.categoryId = 'Category is required';
      }
      
      if (!values.accountId) {
        errors.accountId = 'Account is required';
      }
      
      // Type-specific validations
      if (values.type === 'expense') {
        if (values.usePercentage) {
          if (!values.percentageAmount) {
            errors.percentageAmount = 'Percentage is required';
          }
        } else {
          if (!values.amount) {
            errors.amount = 'Amount is required';
          }
        }
        
        if (!values.frequency) {
          errors.frequency = 'Frequency is required';
        }
        
        if (!values.dueDate) {
          errors.dueDate = 'Due date is required';
        }
      } else {
        // Goal validations are handled by GoalFieldGroup
        // We need at least 2 of the 3 goal fields
        const hasTargetAmount = !!values.targetAmount;
        const hasTargetDate = !!values.targetDate;
        const hasMonthlyContribution = !!values.monthlyContribution;
        
        const filledFieldsCount = [
          hasTargetAmount, 
          hasTargetDate, 
          hasMonthlyContribution
        ].filter(Boolean).length;
        
        if (filledFieldsCount < 2) {
          errors.goalFields = 'Please fill at least 2 of the 3 goal fields';
        }
      }
      
      return errors;
    },
  });
  
  // Handle dollar/percentage conversion for expenses
  useEffect(() => {
    if (form.values.type === 'expense' && currentPay > 0) {
      if (form.values.usePercentage && form.values.amount && !form.values.percentageAmount) {
        // Convert dollar to percentage
        const percentage = dollarToPercentage(parseFloat(form.values.amount) || 0, currentPay);
        form.setFieldValue('percentageAmount', percentage.toFixed(1));
      } else if (!form.values.usePercentage && form.values.percentageAmount && !form.values.amount) {
        // Convert percentage to dollar
        const amount = percentageToDollar(parseFloat(form.values.percentageAmount) || 0, currentPay);
        form.setFieldValue('amount', amount.toFixed(2));
      }
    }
  }, [form.values.usePercentage, form.values.amount, form.values.percentageAmount, currentPay]);
  
  // Category options
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));
  
  // Account options
  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.name
  }));
  
  // Frequency options
  const frequencyOptions = [
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];
  
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
  
  // Type options
  const typeOptions = [
    { value: 'expense', label: 'Expense or Bill' },
    { value: 'goal', label: 'Savings Goal' }
  ];
  
  // Handle form submission
  const handleSubmit = () => {
    form.handleSubmit();
  };
  
  // Handle "Save & Add Another" button
  const handleSubmitAnother = () => {
    form.handleSubmit();
    // The parent component will handle the "add another" logic
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onSubmitAnother={handleSubmitAnother}
      onCancel={onCancel}
      submitLabel={item ? 'Update Item' : 'Add Item'}
      submitAnotherLabel="Save & Add Another"
      isSubmitDisabled={!form.isValid}
    >
      <SelectField
        {...form.getFieldProps('type')}
        label="Item Type"
        options={typeOptions}
        disabled={!!item} // Can't change type when editing
        required
        darkMode={darkMode}
      />
      
      <TextField
        {...form.getFieldProps('name')}
        label="Name"
        placeholder={form.values.type === 'expense' ? "Expense name (e.g., 'Rent')" : "Goal name (e.g., 'New Car')"}
        autoFocus
        required
        darkMode={darkMode}
      />
      
      <SelectField
        {...form.getFieldProps('categoryId')}
        label="Category"
        options={categoryOptions}
        required
        darkMode={darkMode}
      />
      
      <SelectField
        {...form.getFieldProps('accountId')}
        label="Funding Account"
        options={accountOptions}
        required
        darkMode={darkMode}
      />
      
      <SelectField
        {...form.getFieldProps('priorityState')}
        label="Status"
        options={priorityStateOptions}
        required
        darkMode={darkMode}
      />
      
      {form.values.type === 'expense' ? (
        // Expense-specific fields
        <>
          <div className="flex items-center mb-4">
            <CheckboxField
              {...form.getFieldProps('usePercentage')}
              label="Use percentage of income"
              darkMode={darkMode}
            />
          </div>
          
          {form.values.usePercentage ? (
            <TextField
              {...form.getFieldProps('percentageAmount')}
              label="Percentage of Income"
              placeholder="0.0"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              darkMode={darkMode}
              hint={currentPay > 0 ? `Approx. $${percentageToDollar(parseFloat(form.values.percentageAmount) || 0, currentPay).toFixed(2)}` : ''}
            />
          ) : (
            <CurrencyField
              {...form.getFieldProps('amount')}
              label="Amount"
              placeholder="0.00"
              required
              darkMode={darkMode}
              hint={currentPay > 0 ? `Approx. ${dollarToPercentage(parseFloat(form.values.amount) || 0, currentPay).toFixed(1)}% of income` : ''}
            />
          )}
          
          <SelectField
            {...form.getFieldProps('frequency')}
            label="Frequency"
            options={frequencyOptions}
            required
            darkMode={darkMode}
          />
          
          <DateField
            {...form.getFieldProps('dueDate')}
            label="Due Date"
            required
            darkMode={darkMode}
          />
          
          <CheckboxField
            {...form.getFieldProps('isRecurring')}
            label="This is a recurring expense"
            darkMode={darkMode}
          />
          
          <SelectField
            {...form.getFieldProps('priority')}
            label="Priority"
            options={priorityOptions}
            required
            darkMode={darkMode}
          />
        </>
      ) : (
        // Goal-specific fields
        <GoalFieldGroup
          targetAmount={form.values.targetAmount}
          targetDate={form.values.targetDate}
          monthlyContribution={form.values.monthlyContribution}
          onTargetAmountChange={(value) => form.setFieldValue('targetAmount', value)}
          onTargetDateChange={(value) => form.setFieldValue('targetDate', value)}
          onMonthlyContributionChange={(value) => form.setFieldValue('monthlyContribution', value)}
          error={form.errors.goalFields}
          darkMode={darkMode}
        />
      )}
      
      {form.values.type === 'goal' && (
        <CurrencyField
          {...form.getFieldProps('alreadySaved')}
          label="Already Saved"
          placeholder="0.00"
          darkMode={darkMode}
          hint={form.values.targetAmount ? `${(((parseFloat(form.values.alreadySaved) || 0) / (parseFloat(form.values.targetAmount) || 1)) * 100).toFixed(1)}% funded` : ''}
        />
      )}
    </BaseForm>
  );
};

export default UnifiedItemForm;