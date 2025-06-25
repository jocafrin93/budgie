// src/components/AddCategoryForm.js - UPDATED
import { DollarSign, Info, Package, Target } from 'lucide-react';
import { useState } from 'react';
import { frequencyOptions } from '../utils/constants';
import BaseForm from './form/BaseForm';

/**
 * Enhanced AddCategoryForm component
 * Now supports creating both single and multiple expense categories
 */
const AddCategoryForm = ({
  onSubmit,
  onCancel,
  onSubmitAnother,
  categories = [],
  payFrequency = 'bi-weekly'
}) => {
  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('single');
  const [categoryColor, setCategoryColor] = useState('bg-gradient-to-r from-blue-500 to-purple-500');

  // Single category specific fields
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dueDate, setDueDate] = useState('');

  // Auto-funding settings
  const [autoFundingEnabled, setAutoFundingEnabled] = useState(false);
  const [maxAutoFunding, setMaxAutoFunding] = useState('500');

  // Validation
  const [errors, setErrors] = useState({});

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
    }

    if (categories.some(cat => cat.name.toLowerCase() === categoryName.trim().toLowerCase())) {
      newErrors.categoryName = 'A category with this name already exists';
    }

    if (categoryType === 'single') {
      if (!amount || parseFloat(amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;

    const categoryData = {
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor,
      autoFunding: {
        enabled: autoFundingEnabled,
        maxAmount: parseFloat(maxAutoFunding) || 500,
        priority: 'medium'
      },
      // Include single category specific data
      ...(categoryType === 'single' && {
        amount: parseFloat(amount),
        frequency,
        dueDate: dueDate || null
      })
    };

    onSubmit(categoryData);
    resetForm();
  };

  // Handle submit and add another
  const handleSubmitAnother = () => {
    if (!validateForm()) return;

    const categoryData = {
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor,
      autoFunding: {
        enabled: autoFundingEnabled,
        maxAmount: parseFloat(maxAutoFunding) || 500,
        priority: 'medium'
      },
      ...(categoryType === 'single' && {
        amount: parseFloat(amount),
        frequency,
        dueDate: dueDate || null
      })
    };

    onSubmitAnother(categoryData);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setCategoryName('');
    setCategoryType('single');
    setAmount('');
    setFrequency('monthly');
    setDueDate('');
    setAutoFundingEnabled(false);
    setMaxAutoFunding('500');
    setErrors({});
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // Color options
  const colorOptions = [
    'bg-gradient-to-r from-blue-500 to-purple-500',
    'bg-gradient-to-r from-green-500 to-blue-500',
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'bg-gradient-to-r from-yellow-500 to-orange-500',
    'bg-gradient-to-r from-red-500 to-pink-500',
    'bg-gradient-to-r from-indigo-500 to-purple-500',
    'bg-gradient-to-r from-teal-500 to-green-500',
    'bg-gradient-to-r from-orange-500 to-red-500'
  ];

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
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onSubmitAnother={onSubmitAnother}
      submitLabel="Create Category"
      showSubmitAnother={true}
      isSubmitDisabled={!categoryName.trim()}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Category</h3>
          <p className="text-sm text-gray-600">
            Categories organize your expenses and goals for easier budgeting
          </p>
        </div>

        {/* Category Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              if (errors.categoryName) {
                setErrors(prev => ({ ...prev, categoryName: undefined }));
              }
            }}
            placeholder="e.g., Car Payment, Subscriptions, Groceries"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoryName ? 'border-red-300' : 'border-gray-300'
              }`}
          />
          {errors.categoryName && (
            <p className="text-red-600 text-sm mt-1">{errors.categoryName}</p>
          )}
        </div>

        {/* Category Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
                  <span className="font-medium text-gray-900">Single Expense</span>
                </div>
                <p className="text-sm text-gray-600">
                  Perfect for individual bills like rent, car payments, or insurance.
                  Simple YNAB-style envelope with one specific amount and frequency.
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
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Multiple Expenses</span>
                </div>
                <p className="text-sm text-gray-600">
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
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors(prev => ({ ...prev, amount: undefined }));
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCategoryColor(color)}
                className={`w-full h-10 rounded-lg ${color} border-2 transition-all ${categoryColor === color ? 'border-gray-800 scale-105' : 'border-gray-300 hover:scale-102'
                  }`}
              />
            ))}
          </div>
        </div>

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
            <label htmlFor="autoFunding" className="text-sm font-medium text-gray-700">
              Enable auto-funding (optional)
            </label>
          </div>

          {autoFundingEnabled && (
            <div className="pl-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum auto-funding amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxAutoFunding}
                    onChange={(e) => setMaxAutoFunding(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
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
      </div>
    </BaseForm>
  );
};

export default AddCategoryForm;