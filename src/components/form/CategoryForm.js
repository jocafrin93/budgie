import { DollarSign, Info, Package, Target } from 'lucide-react';
import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { frequencyOptions } from '../../utils/constants';
import {
  BaseForm,
  ColorPickerField,
  CurrencyField // Added CurrencyField import
  ,
  TextField
} from './';

const CategoryForm = ({
  category = null,
  onSave,
  onCancel,
  darkMode = false,
  payFrequency = 'bi-weekly'
}) => {
  // Determine initial category type
  const initialCategoryType = category?.type || 'single';

  // Add state for category type and related fields
  const [categoryType, setCategoryType] = useState(initialCategoryType);

  // Single category specific fields - Changed: amount now stores numeric value
  const [amount, setAmount] = useState(category?.amount || 0);
  const [frequency, setFrequency] = useState(category?.frequency || 'monthly');
  const [dueDate, setDueDate] = useState(category?.dueDate || '');

  // Auto-funding settings - Changed: maxAutoFunding now stores numeric value
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
      // Combine form values with category type and related fields
      const formData = {
        ...values,
        type: categoryType,
        autoFunding: {
          enabled: autoFundingEnabled,
          maxAmount: parseFloat(maxAutoFunding) || 500,
          priority: 'medium'
        },
        // Include single category specific data
        ...(categoryType === 'single' && {
          amount: parseFloat(amount) || 0,  // Ensure numeric
          frequency,
          dueDate: dueDate || null
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

      if (categoryType === 'single' && (!amount || parseFloat(amount) <= 0)) {
        errors.amount = 'Amount must be greater than 0';
      }

      return errors;
    }
  });

  // Calculate per-paycheck amount for single categories
  const getPerPaycheckPreview = () => {
    if (categoryType !== 'single' || !amount) return null;

    const monthlyAmount = parseFloat(amount) * (frequencyOptions.find(f => f.value === frequency)?.weeksPerYear / 12 || 1);
    const paychecksPerMonth = payFrequency === 'bi-weekly' ? 2.17 : payFrequency === 'weekly' ? 4.33 : 1;
    const perPaycheck = monthlyAmount / paychecksPerMonth;

    return perPaycheck;
  };

  const perPaycheckPreview = getPerPaycheckPreview();

  return (
    <BaseForm
      onSubmit={form.handleSubmit}
      onCancel={onCancel}
      submitLabel={category ? 'Update Category' : 'Add Category'}
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
          <label className="block text-sm font-medium text-theme-primary mb-3">
            Category Type *
          </label>
          <div className="space-y-3">
            {/* Single Expense Option */}
            <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${categoryType === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
              <input
                type="radio"
                value="single"
                checked={categoryType === 'single'}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Single Expense</span>
                </div>
                <p className="text-sm text-theme-tertiary">
                  Perfect for individual bills like rent, car payments, or insurance.
                  Simple envelope-style with one specific amount and frequency.
                </p>
                {categoryType === 'single' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-blue-700 font-medium mb-2">
                      ✨ You'll enter the expense details below
                    </div>
                  </div>
                )}
              </div>
            </label>

            {/* Multiple Expenses Option */}
            <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${categoryType === 'multiple' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
              <input
                type="radio"
                value="multiple"
                checked={categoryType === 'multiple'}
                onChange={(e) => setCategoryType(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-700" />
                  <span className="font-medium text-purple-700">Multiple Expenses</span>
                </div>
                <p className="text-sm text-theme-tertiary">
                  Group related expenses like subscriptions, shopping categories, or transportation costs.
                  Detailed planning with individual item tracking and active/planning states.
                </p>
                {categoryType === 'multiple' && (
                  <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="text-xs text-purple-700 font-medium mb-2">
                      ✨ Add individual items after creating the category
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Single Category Details */}
        {categoryType === 'single' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Expense Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount - FIXED: Now uses CurrencyField */}
              <CurrencyField
                name="amount"
                label="Amount *"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                darkMode={darkMode}
                error={form.errors.amount}
              />

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {frequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-theme-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Per-paycheck Preview */}
            {perPaycheckPreview && (
              <div className="p-3 bg-blue-100 rounded border border-blue-300">
                <div className="text-sm text-blue-800">
                  <strong>Per-paycheck amount:</strong> ${perPaycheckPreview.toFixed(2)}
                  <div className="text-xs mt-1">
                    Based on your {payFrequency.replace('-', ' ')} pay schedule
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category Color */}
        <ColorPickerField
          {...form.getFieldProps('color')}
          label="Category Color"
          required
          darkMode={darkMode}
        />

        {/* Auto-funding Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoFunding"
              checked={autoFundingEnabled}
              onChange={(e) => setAutoFundingEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoFunding" className="text-sm font-medium text-theme-primary">
              Enable auto-funding (optional)
            </label>
          </div>

          {autoFundingEnabled && (
            <div className="pl-6 space-y-3">
              {/* Maximum auto-funding amount - FIXED: Now uses CurrencyField */}
              <CurrencyField
                name="maxAutoFunding"
                label="Maximum auto-funding amount"
                value={maxAutoFunding}
                onChange={(e) => setMaxAutoFunding(e.target.value)}
                placeholder="500.00"
                darkMode={darkMode}
              />
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Auto-funding will automatically allocate money to this category during the payday workflow,
                  up to the maximum amount specified.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description Field */}
        <TextField
          {...form.getFieldProps('description')}
          label="Description"
          placeholder="Optional description"
          multiline
          rows={3}
          darkMode={darkMode}
        />
      </div>
    </BaseForm>
  );
};

export default CategoryForm;