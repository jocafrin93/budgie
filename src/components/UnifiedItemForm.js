import { useEffect } from 'react';
import { useForm } from '../hooks/useForm';
import { frequencyOptions } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../utils/moneyUtils';
import {
  BaseForm,
  CheckboxField,
  CurrencyField,
  DateField,
  GoalFieldGroup,
  SelectField,
  TextField
} from './form';

const formFrequencyOptions = frequencyOptions.map(freq => ({
  value: freq.value,
  label: freq.label
}));

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

  console.log('DEBUG - UnifiedItemForm rendering with categories:', categories);
  console.log('DEBUG - UnifiedItemForm rendering with preselectedCategory:', preselectedCategory);

  // Initialize form with useForm hook
  const initialValues = {
    type: initialType,
    name: item?.name || '',
    amount: item?.amount || 0,
    usePercentage: item?.usePercentage || false,
    percentageAmount: item?.percentageAmount || 0,
    frequency: item?.frequency || 'monthly',
    dueDate: item?.dueDate || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    categoryId: preselectedCategory?.preselectedCategory?.id || '', // Note the nested property
    accountId: item?.accountId || (accounts[0]?.id || ''),
    priorityState: item?.priorityState || 'active',
    isRecurring: item?.isRecurring !== false, // Default to true for new items
    priority: item?.priority || 'medium',

    // Goal-specific fields
    targetAmount: item?.targetAmount || 0,
    targetDate: item?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
    monthlyContribution: item?.monthlyContribution || 0,
    alreadySaved: item?.alreadySaved || 0,
  };

  console.log('DEBUG - Form initialValues:', initialValues);

  const form = useForm({
    initialValues,
    onSubmit: (values) => {
      const selectedCategory = categories.find(cat => cat.id === values.categoryId);
      const selectedAccount = accounts.find(acc => acc.id === values.accountId);
      // Prepare the data based on item type
      const commonData = {
        category: selectedCategory,
        categoryId: values.categoryId,
        account: selectedAccount,
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
        // Simplified goal validation - only require name and target amount
        // Name is already validated above
        if (!values.targetAmount) {
          errors.targetAmount = 'Target amount is required';
        }
        // Target date is already preset with a default value
        // Monthly contribution can be calculated or set manually
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
  // In UnifiedItemForm.js, replace your handleSubmit function with this:
  const handleSubmit = () => {
    console.log('DEBUG - Form submit button clicked');

    // Find the full objects from the arrays (same as handleSubmitAnother)
    const selectedCategory = categories.find(cat => cat.id === form.values.categoryId);
    const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);

    console.log('DEBUG - selectedCategory:', selectedCategory);
    console.log('DEBUG - selectedAccount:', selectedAccount);
    console.log('DEBUG - Form values before submit:', form.values);
    console.log('DEBUG - Form errors:', form.errors);
    console.log('DEBUG - Form isValid:', form.isValid);

    // Don't call form.handleSubmit() - prepare data manually like handleSubmitAnother does
    if (!form.isValid) {
      console.log('DEBUG - Form validation failed, not submitting');
      return;
    }

    // Prepare the data with full objects (same logic as handleSubmitAnother)
    const commonData = {
      name: form.values.name,
      category: selectedCategory,
      categoryId: form.values.categoryId,
      account: selectedAccount,
      accountId: form.values.accountId,
      priorityState: form.values.priorityState,
    };

    let itemData;
    if (form.values.type === 'expense') {
      itemData = {
        ...commonData,
        type: 'expense',
        amount: form.values.usePercentage
          ? percentageToDollar(form.values.percentageAmount || 0, currentPay)
          : form.values.amount || 0,
        usePercentage: form.values.usePercentage,
        percentageAmount: form.values.percentageAmount || 0,
        frequency: form.values.frequency,
        dueDate: form.values.dueDate,
        isRecurring: form.values.isRecurring,
        priority: form.values.priority,
      };
    } else {
      itemData = {
        ...commonData,
        type: 'goal',
        targetAmount: form.values.targetAmount || 0,
        targetDate: form.values.targetDate,
        monthlyContribution: form.values.monthlyContribution || 0,
        alreadySaved: form.values.alreadySaved || 0,
      };
    }

    console.log('DEBUG - Prepared itemData:', itemData);

    // Call onSave with the prepared data
    onSave(itemData, false); // false = not "add another"
  };

  // Handle "Save & Add Another" button
  // Add this function after your existing handleSubmit function
  // Replace your current handleSubmitAnother function in UnifiedItemForm with this:
  // Alternative handleSubmitAnother - uses resetForm
  // Replace your current handleSubmitAnother function in UnifiedItemForm with this:
  const handleSubmitAnother = () => {
    const selectedCategory = categories.find(cat => cat.id === form.values.categoryId);
    const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);
    const currentCategoryId = form.values.categoryId;
    const currentAccountId = form.values.accountId;
    const currentType = form.values.type;
    const currentPriorityState = form.values.priorityState;
    const currentFrequency = form.values.frequency;
    const currentPriority = form.values.priority;
    const currentIsRecurring = form.values.isRecurring;

    // Prepare data same way as form's onSubmit
    const commonData = {
      name: form.values.name,
      category: selectedCategory, // Pass full category object
      categoryId: form.values.categoryId, // Keep ID for backward compatibility
      account: selectedAccount, // Pass full account object
      accountId: form.values.accountId, // Keep ID for backward compatibility
      priorityState: form.values.priorityState,
    };

    let itemData;
    if (form.values.type === 'expense') {
      itemData = {
        ...commonData,
        type: 'expense',
        amount: form.values.usePercentage
          ? percentageToDollar(parseFloat(form.values.percentageAmount) || 0, currentPay)
          : parseFloat(form.values.amount) || 0,
        usePercentage: form.values.usePercentage,
        percentageAmount: parseFloat(form.values.percentageAmount) || 0,
        frequency: form.values.frequency,
        dueDate: form.values.dueDate,
        isRecurring: form.values.isRecurring,
        priority: form.values.priority,
      };
    } else {
      itemData = {
        ...commonData,
        type: 'goal',
        targetAmount: parseFloat(form.values.targetAmount) || 0,
        targetDate: form.values.targetDate,
        monthlyContribution: parseFloat(form.values.monthlyContribution) || 0,
        alreadySaved: parseFloat(form.values.alreadySaved) || 0,
      };
    }

    // Call onSave with addAnother flag
    onSave(itemData, true);

    // Reset form by recreating the initial values
    setTimeout(() => {
      // Create new initial values with preserved context
      const newInitialValues = {
        type: currentType,
        name: '',
        amount: '',
        usePercentage: false,
        percentageAmount: '',
        frequency: currentFrequency,
        dueDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        categoryId: currentCategoryId,
        accountId: currentAccountId,
        priorityState: currentPriorityState,
        isRecurring: currentIsRecurring,
        priority: currentPriority,
        // Goal fields
        targetAmount: '',
        targetDate: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        monthlyContribution: '',
        alreadySaved: 0,
      };

      // Set all values at once to match initial state
      Object.keys(newInitialValues).forEach(key => {
        form.setFieldValue(key, newInitialValues[key]);
      });

      // Focus name field
      const nameInput = document.querySelector('input[name="name"]');
      if (nameInput) nameInput.focus();
    }, 100);
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onSubmitAnother={!item ? handleSubmitAnother : undefined}
      onCancel={onCancel}
      submitLabel={item ? 'Update Item' : 'Add Item'}
      showSubmitAnother={!item}
      submitAnotherLabel="Save & Add Another"
      isSubmitDisabled={false} // Temporarily bypass validation for all item types
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
              name="percentageAmount"
              label="Percentage of Income"
              value={form.values.percentageAmount ? form.values.percentageAmount.toString() : ''}
              onChange={(e) => {
                const numericValue = parseFloat(e.target.value) || 0;
                console.log('DEBUG - PercentageAmount onChange - string:', e.target.value, 'number:', numericValue);
                form.setFieldValue('percentageAmount', numericValue); // Store as NUMBER
              }}
              placeholder="0.0"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              darkMode={darkMode}
              error={form.errors.percentageAmount}
              hint={currentPay > 0 ? `Approx. $${percentageToDollar(form.values.percentageAmount || 0, currentPay).toFixed(2)}` : ''}
            />
          ) : (
            <CurrencyField
              name="amount"
              label="Amount"
              value={form.values.amount ? form.values.amount.toString() : ''}
              onChange={(e) => {
                const numericValue = parseFloat(e.target.value) || 0;
                console.log('DEBUG - CurrencyField onChange - string:', e.target.value, 'number:', numericValue);
                form.setFieldValue('amount', numericValue); // Store as NUMBER
              }}
              placeholder="0.00"
              required
              darkMode={darkMode}
              error={form.errors.amount}
              hint={currentPay > 0 ? `Approx. ${dollarToPercentage(form.values.amount || 0, currentPay).toFixed(1)}% of income` : ''}
            />
          )}

          <SelectField
            {...form.getFieldProps('frequency')}
            label="Frequency"
            options={formFrequencyOptions}  // NOW uses your perfect constants!
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
        <>
          {console.log('DEBUG - Rendering goal fields with values:', {
            targetAmount: form.values.targetAmount,
            targetDate: form.values.targetDate,
            monthlyContribution: form.values.monthlyContribution
          })}
          <GoalFieldGroup
            formValues={form.values}
            onChange={(e) => {
              console.log('DEBUG - GoalFieldGroup onChange:', e.target.name, e.target.value);
              form.setFieldValue(e.target.name, e.target.value);
            }}
            errors={form.errors}
            darkMode={darkMode}
          />
        </>
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