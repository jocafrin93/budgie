import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { formatDate } from '../../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import { CurrencyField } from '../form';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Checkbox, Input, Select, Textarea } from '../ui/Form';


// Frequency options for recurring expenses
const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'every-3-weeks', label: 'Every 3 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'every-5-weeks', label: 'Every 5 weeks' },
    { value: 'every-6-weeks', label: 'Every 6 weeks' },
    { value: 'every-7-weeks', label: 'Every 7 weeks' },
    { value: 'bi-monthly', label: 'Every other month' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi-annually', label: 'Every 6 months' },
    { value: 'annually', label: 'Annually' },
    { value: 'per-paycheck', label: 'Per Paycheck (Direct)' }
];

// Color options for category selection
const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue', color: '#3B82F6' },
    { value: 'bg-green-500', label: 'Green', color: '#10B981' },
    { value: 'bg-orange-500', label: 'Orange', color: '#F59E0B' },
    { value: 'bg-red-500', label: 'Red', color: '#EF4444' },
    { value: 'bg-purple-500', label: 'Purple', color: '#8B5CF6' },
    { value: 'bg-pink-500', label: 'Pink', color: '#EC4899' },
    { value: 'bg-teal-500', label: 'Teal', color: '#14B8A6' },
    { value: 'bg-lime-500', label: 'Lime', color: '#84CC16' },
];

const UnifiedCategoryForm = ({
    category = null,
    onSave,
    onCancel,
    accounts = [],
    currentPay = 0,
}) => {
    // Determine if we're editing a goal category
    const isGoal = category?.targetAmount !== undefined;
    const initialType = isGoal ? 'goal' : 'expense';

    // Initialize form with useForm hook
    console.log('=== FORM INITIALIZATION DEBUG ===');
    console.log('Category prop:', category);
    console.log('Category amount:', category?.amount);
    console.log('Category settings:', category?.settings);
    console.log('Category settings amount:', category?.settings?.amount);

    const initialValues = {
        // Basic category info
        name: category?.name || '',
        type: category?.type || 'single', // single or multiple
        planningType: category?.planningType || initialType, // expense or goal

        // Amount configuration - handle both direct fields and nested settings
        amount: category?.amount ? category.amount.toString() : (category?.settings?.amount ? category.settings.amount.toString() : ''),
        usePercentage: category?.usePercentage || false,
        percentageAmount: category?.percentageAmount ? category.percentageAmount.toString() : '',
        frequency: category?.frequency || category?.settings?.frequency || 'monthly',
        dueDate: category?.dueDate || category?.settings?.dueDate || '',

        // Timing configuration
        isRecurring: category?.isRecurring || false,

        // Account and status
        accountId: category?.accountId || (accounts[0]?.id || ''),
        status: category?.status || 'active',
        priority: category?.priority || 'medium',

        // Visual and advanced
        color: category?.color || 'bg-blue-500',
        autoFunding: category?.autoFunding?.enabled || category?.autoFunding || false,
        description: category?.description || '',

        // Goal-specific fields
        targetAmount: category?.targetAmount || 0,
        targetDate: category?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
        monthlyContribution: category?.monthlyContribution || 0,
        alreadySaved: category?.alreadySaved || 0,
    };

    console.log('Initial values calculated:', initialValues);
    console.log('Initial amount value:', initialValues.amount);
    console.log('=== FORM INITIALIZATION COMPLETE ===');

    const form = useForm({
        initialValues,
        onSubmit: (values) => {
            const selectedAccount = accounts.find(acc => acc.id === values.accountId);

            // Prepare the data based on category type
            const commonData = {
                name: values.name,
                type: values.type,
                account: selectedAccount,
                accountId: values.accountId,
                status: values.status,
                priority: values.priority,
                color: values.color,
                autoFunding: values.autoFunding,
                description: values.description,
            };

            if (values.planningType === 'expense') {
                onSave({
                    ...commonData,
                    planningType: 'expense',
                    amount: values.usePercentage
                        ? percentageToDollar(parseFloat(values.percentageAmount) || 0, currentPay)
                        : parseFloat(values.amount) || 0,
                    usePercentage: values.usePercentage,
                    percentageAmount: parseFloat(values.percentageAmount) || 0,
                    frequency: values.frequency,
                    dueDate: values.dueDate,
                });
            } else {
                onSave({
                    ...commonData,
                    planningType: 'goal',
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
                errors.name = 'Category name is required';
            }

            if (!values.accountId) {
                errors.accountId = 'Funding account is required';
            }

            // Type-specific validations
            if (values.planningType === 'expense') {
                if (values.usePercentage) {
                    if (!values.percentageAmount) {
                        errors.percentageAmount = 'Percentage is required';
                    }
                } else {
                    if (!values.amount) {
                        errors.amount = 'Amount is required';
                    }
                }
            } else {
                // Goal validation
                if (!values.targetAmount) {
                    errors.targetAmount = 'Target amount is required';
                }
            }

            return errors;
        },
    });

    useEffect(() => {
        if (form.values.planningType === 'expense' && currentPay > 0) {
            // Only perform automatic conversion when user manually changes a field
            if (form.values.usePercentage && form.values.amount && !form.values.percentageAmount) {
                // Convert dollar to percentage when switching to percentage mode
                const percentage = dollarToPercentage(parseFloat(form.values.amount) || 0, currentPay);
                form.setFieldValue('percentageAmount', parseFloat(percentage.toFixed(1)));
            } else if (!form.values.usePercentage && form.values.percentageAmount && !form.values.amount) {
                // Convert percentage to dollar when switching to dollar mode  
                const amount = percentageToDollar(parseFloat(form.values.percentageAmount) || 0, currentPay);
                form.setFieldValue('amount', parseFloat(amount.toFixed(2)));
            }
        }
    }, [form.values.usePercentage, form.values.amount, form.values.percentageAmount, currentPay, form]);

    // Status options
    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    // Priority options
    const priorityOptions = [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
    ];

    // Handle form submission
    const handleSubmit = () => {
        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('Form is valid:', form.isValid);
        console.log('Form values:', form.values);
        console.log('Form errors:', form.errors);

        if (!form.isValid) {
            console.log('Form is not valid, returning early');
            return;
        }

        // Find the full objects from the arrays
        const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);

        // Prepare the data with full objects
        const commonData = {
            name: form.values.name,
            type: form.values.type,
            account: selectedAccount,
            accountId: form.values.accountId,
            status: form.values.status,
            priority: form.values.priority,
            color: form.values.color,
            autoFunding: form.values.autoFunding,
            description: form.values.description,
        };

        let categoryData;
        if (form.values.planningType === 'expense') {
            const amountValue = form.values.usePercentage
                ? percentageToDollar(form.values.percentageAmount || 0, currentPay)
                : form.values.amount || 0;

            console.log('Processing expense category');
            console.log('Use percentage:', form.values.usePercentage);
            console.log('Raw amount value:', form.values.amount);
            console.log('Raw percentage value:', form.values.percentageAmount);
            console.log('Calculated amount value:', amountValue);

            categoryData = {
                ...commonData,
                planningType: 'expense',
                amount: amountValue,
                usePercentage: form.values.usePercentage,
                percentageAmount: form.values.percentageAmount || 0,
                frequency: form.values.frequency,
                dueDate: form.values.dueDate,
                isRecurring: form.values.isRecurring,
            };
        } else {
            categoryData = {
                ...commonData,
                planningType: 'goal',
                targetAmount: form.values.targetAmount || 0,
                targetDate: form.values.targetDate,
                monthlyContribution: form.values.monthlyContribution || 0,
                alreadySaved: form.values.alreadySaved || 0,
            };
        }

        console.log('Final category data to save:', categoryData);
        console.log('Calling onSave with data');

        // Call onSave with the prepared data
        onSave(categoryData, false); // false = not "add another"

        console.log('=== FORM SUBMIT COMPLETE ===');
    };

    // Handle "Save & Add Another" button
    const handleSubmitAnother = () => {
        const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);
        const currentAccountId = form.values.accountId;
        const currentType = form.values.type;
        const currentPlanningType = form.values.planningType;
        const currentStatus = form.values.status;
        const currentPriority = form.values.priority;

        // Prepare data same way as form's onSubmit
        const commonData = {
            name: form.values.name,
            type: form.values.type,
            account: selectedAccount,
            accountId: form.values.accountId,
            status: form.values.status,
            priority: form.values.priority,
            color: form.values.color,
            autoFunding: form.values.autoFunding,
            description: form.values.description,
        };

        let categoryData;
        if (form.values.planningType === 'expense') {
            categoryData = {
                ...commonData,
                planningType: 'expense',
                amount: form.values.usePercentage
                    ? percentageToDollar(parseFloat(form.values.percentageAmount) || 0, currentPay)
                    : parseFloat(form.values.amount) || 0,
                usePercentage: form.values.usePercentage,
                percentageAmount: parseFloat(form.values.percentageAmount) || 0,
                frequency: form.values.frequency,
                dueDate: form.values.dueDate,
                isRecurring: form.values.isRecurring,
            };
        } else {
            categoryData = {
                ...commonData,
                planningType: 'goal',
                targetAmount: parseFloat(form.values.targetAmount) || 0,
                targetDate: form.values.targetDate,
                monthlyContribution: parseFloat(form.values.monthlyContribution) || 0,
                alreadySaved: parseFloat(form.values.alreadySaved) || 0,
            };
        }

        // Call onSave with addAnother flag
        onSave(categoryData, true);

        // Reset form by recreating the initial values
        setTimeout(() => {
            // Create new initial values with preserved context
            const newInitialValues = {
                name: '',
                type: currentType,
                planningType: currentPlanningType,
                amount: '',
                usePercentage: false,
                percentageAmount: '',
                frequency: 'monthly',
                dueDate: '',
                isRecurring: false,
                accountId: currentAccountId,
                status: currentStatus,
                priority: currentPriority,
                color: 'bg-blue-500',
                autoFunding: false,
                description: '',
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

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity">
            <Card skin="shadow" className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {category ? 'Edit Category' : 'Add New Category'}
                        </h2>
                        <Button
                            onClick={onCancel}
                            variant="flat"
                            color="neutral"
                            isIcon
                            className="w-8 h-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Categories organize your expenses and goals for easier budgeting
                    </p>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                        {/* Category Name */}
                        <Input
                            {...form.getFieldProps('name')}
                            label="Category Name"
                            placeholder="Enter category name"
                            required
                            autoFocus
                        />

                        {/* Category Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                Category Type <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-3">
                                {/* Single Item Category */}
                                <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                                    <Checkbox
                                        checked={form.values.type === 'single'}
                                        onChange={() => form.setFieldValue('type', 'single')}
                                        className="mt-0.5 rounded-full"
                                    />
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">💰</span>
                                            <span className="font-medium text-gray-900 dark:text-white">Single Item Category</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            One specific expense or goal with detailed configuration options.
                                        </p>
                                    </div>
                                </div>

                                {/* Multiple Items Category */}
                                <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                                    <Checkbox
                                        checked={form.values.type === 'multiple'}
                                        onChange={() => form.setFieldValue('type', 'multiple')}
                                        className="mt-0.5 rounded-full"
                                    />
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">📦</span>
                                            <span className="font-medium text-gray-900 dark:text-white">Multiple Items Category</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            Detailed planning with individual item tracking and active/planning states.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Planning Type Selection - Only show for single item categories */}
                        {form.values.type === 'single' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                    What are you planning for?
                                </label>
                                <div className="flex space-x-3">
                                    <Button
                                        type="button"
                                        onClick={() => form.setFieldValue('planningType', 'expense')}
                                        variant={form.values.planningType === 'expense' ? 'filled' : 'outlined'}
                                        color={form.values.planningType === 'expense' ? 'primary' : 'neutral'}
                                        className="flex-1 h-12 flex items-center justify-center space-x-2"
                                    >
                                        <span>💸</span>
                                        <span>Expense</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => form.setFieldValue('planningType', 'goal')}
                                        variant={form.values.planningType === 'goal' ? 'filled' : 'outlined'}
                                        color={form.values.planningType === 'goal' ? 'warning' : 'neutral'}
                                        className="flex-1 h-12 flex items-center justify-center space-x-2"
                                    >
                                        <span>🎯</span>
                                        <span>Goal</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Amount Configuration - Only for single item expense categories */}
                        {form.values.type === 'single' && form.values.planningType === 'expense' && (
                            <>
                                {/* Amount Type Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                        How do you want to set the amount?
                                    </label>
                                    <div className="flex space-x-3">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (form.values.usePercentage && form.values.percentageAmount && currentPay > 0) {
                                                    const convertedAmount = percentageToDollar(form.values.percentageAmount, currentPay);
                                                    form.setFieldValue('amount', convertedAmount);
                                                }
                                                form.setFieldValue('usePercentage', false);
                                            }}
                                            variant={!form.values.usePercentage ? 'filled' : 'outlined'}
                                            color={!form.values.usePercentage ? 'secondary' : 'neutral'}
                                            className="flex-1 h-12 flex items-center justify-center space-x-1 text-sm"
                                        >
                                            <span>💰</span>
                                            <span>Dollar Amount</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (!form.values.usePercentage && form.values.amount && currentPay > 0) {
                                                    const convertedPercentage = dollarToPercentage(form.values.amount, currentPay);
                                                    form.setFieldValue('percentageAmount', convertedPercentage);
                                                }
                                                form.setFieldValue('usePercentage', true);
                                            }}
                                            variant={form.values.usePercentage ? 'filled' : 'outlined'}
                                            color={form.values.usePercentage ? 'warning' : 'neutral'}
                                            className="flex-1 h-12 flex items-center justify-center space-x-1 text-sm"
                                        >
                                            <span>📊</span>
                                            <span>% of Paycheck</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Amount Field */}
                                {form.values.usePercentage ? (
                                    <div>
                                        <Input
                                            name="percentageAmount"
                                            label="Percentage of Income"
                                            type="number"
                                            step="0.1"
                                            value={form.values.percentageAmount ? form.values.percentageAmount.toString() : ''}
                                            onChange={(e) => {
                                                const numericValue = parseFloat(e.target.value) || 0;
                                                form.setFieldValue('percentageAmount', numericValue);
                                            }}
                                            placeholder="0.0"
                                            error={form.errors.percentageAmount}
                                            description={currentPay > 0 ? `Approx. $${percentageToDollar(form.values.percentageAmount || 0, currentPay).toFixed(2)}` : ''}
                                        />
                                    </div>
                                ) : (
                                    <CurrencyField
                                        name="amount"
                                        label="Amount"
                                        value={form.values.amount}
                                        onChange={(e) => {
                                            form.setFieldValue('amount', e.target.value);
                                        }}
                                        placeholder="0.00"
                                        error={form.errors.amount}
                                        description={currentPay > 0 ? `Approx. ${dollarToPercentage(parseFloat(form.values.amount) || 0, currentPay).toFixed(1)}% of income` : ''}
                                    />
                                )}

                                {/* Due Date Field */}
                                <Input
                                    {...form.getFieldProps('dueDate')}
                                    label="Due Date"
                                    type="date"
                                    description="Optional - leave blank if no specific due date"
                                />

                                {/* Recurring Expense Section - Only show if due date is selected */}
                                {form.values.dueDate && (
                                    <div className="space-y-4 p-4 border border-gray-200 dark:border-dark-500 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-lg">🔄</span>
                                            <span className="font-medium text-gray-900 dark:text-white">Timing Options</span>
                                        </div>

                                        {/* Recurring Checkbox */}
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                checked={form.values.isRecurring}
                                                onChange={(e) => {
                                                    form.setFieldValue('isRecurring', e.target.checked);
                                                    // Reset frequency if unchecking recurring
                                                    if (!e.target.checked) {
                                                        form.setFieldValue('frequency', 'monthly');
                                                    }
                                                }}
                                                className="mt-0.5 rounded-full"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    This is a recurring expense
                                                </span>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    Check this if this expense repeats on a regular schedule
                                                </p>
                                            </div>
                                        </div>

                                        {/* Frequency Selection - Only show if recurring is checked */}
                                        {form.values.isRecurring && (
                                            <Select
                                                label="Frequency"
                                                value={form.values.frequency}
                                                onChange={(e) => form.setFieldValue('frequency', e.target.value)}
                                                required
                                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="">Select an option...</option>
                                                {frequencyOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Select>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Goal-specific fields - Only for single item goal categories */}
                        {form.values.type === 'single' && form.values.planningType === 'goal' && (
                            <>
                                {/* Target Amount */}
                                <CurrencyField
                                    {...form.getFieldProps('targetAmount')}
                                    label="Target Amount"
                                    placeholder="0.00"
                                />

                                {/* Target Date */}
                                <Input
                                    {...form.getFieldProps('targetDate')}
                                    label="Target Date"
                                    type="date"
                                />

                                {/* Monthly Contribution */}
                                <CurrencyField
                                    {...form.getFieldProps('monthlyContribution')}
                                    label="Monthly Contribution"
                                    placeholder="0.00"
                                />

                                {/* Already Saved */}
                                <CurrencyField
                                    {...form.getFieldProps('alreadySaved')}
                                    label="Already Saved"
                                    placeholder="0.00"
                                    description={form.values.targetAmount ? `${(((parseFloat(form.values.alreadySaved) || 0) / (parseFloat(form.values.targetAmount) || 1)) * 100).toFixed(1)}% funded` : ''}
                                />
                            </>
                        )}

                        {/* Funding Account Field */}
                        <Select
                            label="Funding Account"
                            value={form.values.accountId}
                            onChange={(e) => form.setFieldValue('accountId', e.target.value)}
                            error={form.errors.accountId}
                            required
                            className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Select Account</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </Select>

                        {/* Status Field */}
                        <Select
                            {...form.getFieldProps('status')}
                            label="Status"
                            data={statusOptions}
                        />

                        {/* Priority Field */}
                        <Select
                            {...form.getFieldProps('priority')}
                            label="Priority"
                            data={priorityOptions}
                        />

                        {/* Category Color */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-900 dark:text-white">
                                Category Color
                            </label>
                            <div className="flex space-x-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => form.setFieldValue('color', color.value)}
                                        className={`w-8 h-8 rounded-full ${color.value} border-2 transition-all ${form.values.color === color.value
                                            ? 'border-gray-900 dark:border-dark-50 scale-110'
                                            : 'border-gray-300 dark:border-dark-500 hover:scale-105'
                                            }`}
                                        title={color.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Auto-funding Settings */}
                        <div className="p-4 border border-gray-200 dark:border-dark-500 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">🎯</span>
                                <span className="font-medium text-gray-900 dark:text-white">Auto-funding Settings</span>
                            </div>
                            <Checkbox
                                {...form.getFieldProps('autoFunding')}
                                label="Enable auto-funding for this category"
                            />
                        </div>

                        {/* Description Field */}
                        <Textarea
                            {...form.getFieldProps('description')}
                            label="Description (Optional)"
                            placeholder="Add notes about this category"
                            rows={3}
                        />

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-600">
                            <Button
                                type="button"
                                onClick={onCancel}
                                variant="outlined"
                                color="neutral"
                            >
                                Cancel
                            </Button>
                            {!category && (
                                <Button
                                    type="button"
                                    onClick={handleSubmitAnother}
                                    variant="outlined"
                                    color="primary"
                                    disabled={!form.isValid}
                                    className="flex items-center space-x-1"
                                >
                                    <span>+</span>
                                    <span>Save & Add Another</span>
                                </Button>
                            )}
                            <Button
                                type="submit"
                                variant="filled"
                                color="primary"
                                disabled={!form.isValid}
                            >
                                {category ? 'Update Category' : 'Add Category'}
                            </Button>
                        </div>

                        {/* Keyboard shortcuts hint */}
                        <div className="text-xs text-gray-500 dark:text-dark-400 text-center pt-2">
                            💡 Press Enter to save • Shift+Enter to save & add another • Escape to cancel
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default UnifiedCategoryForm;
