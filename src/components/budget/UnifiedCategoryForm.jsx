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

            if (values.type === 'single' && values.planningType === 'expense') {
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
            } else if (values.type === 'single' && values.planningType === 'goal') {
                onSave({
                    ...commonData,
                    planningType: 'goal',
                    targetAmount: parseFloat(values.targetAmount) || 0,
                    targetDate: values.targetDate,
                    monthlyContribution: parseFloat(values.monthlyContribution) || 0,
                    alreadySaved: parseFloat(values.alreadySaved) || 0,
                });
            } else {
                // Multiple category - no planning data
                onSave({
                    ...commonData,
                    planningType: null,
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

            // Type-specific validations - only for single categories
            if (values.type === 'single') {
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
                } else if (values.planningType === 'goal') {
                    // Goal validation
                    if (!values.targetAmount) {
                        errors.targetAmount = 'Target amount is required';
                    }
                }
            }

            return errors;
        },
    });

    useEffect(() => {
        if (form.values.type === 'single' && form.values.planningType === 'expense' && currentPay > 0) {
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
        if (!form.isValid) {
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
        if (form.values.type === 'single' && form.values.planningType === 'expense') {
            const amountValue = form.values.usePercentage
                ? percentageToDollar(form.values.percentageAmount || 0, currentPay)
                : form.values.amount || 0;

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
        } else if (form.values.type === 'single' && form.values.planningType === 'goal') {
            categoryData = {
                ...commonData,
                planningType: 'goal',
                targetAmount: form.values.targetAmount || 0,
                targetDate: form.values.targetDate,
                monthlyContribution: form.values.monthlyContribution || 0,
                alreadySaved: form.values.alreadySaved || 0,
            };
        } else {
            // Multiple category - no planning data
            categoryData = {
                ...commonData,
                planningType: null,
            };
        }

        // Call onSave with the prepared data
        onSave(categoryData, false); // false = not "add another"
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
        if (form.values.type === 'single' && form.values.planningType === 'expense') {
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
        } else if (form.values.type === 'single' && form.values.planningType === 'goal') {
            categoryData = {
                ...commonData,
                planningType: 'goal',
                targetAmount: parseFloat(form.values.targetAmount) || 0,
                targetDate: form.values.targetDate,
                monthlyContribution: parseFloat(form.values.monthlyContribution) || 0,
                alreadySaved: parseFloat(form.values.alreadySaved) || 0,
            };
        } else {
            // Multiple category - no planning data
            categoryData = {
                ...commonData,
                planningType: null,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40">
            <Card skin="shadow" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {category ? 'Edit Category' : 'Add New Category'}
                        </h2>
                        <Button
                            onClick={onCancel}
                            variant="flat"
                            isIcon
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                        {/* Category Name */}
                        <Input
                            {...form.getFieldProps('name')}
                            label="Category Name"
                            placeholder="Enter category name"
                            autoFocus
                            className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />

                        {/* Category Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category Type</label>
                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    onClick={() => form.setFieldValue('type', 'single')}
                                    variant={form.values.type === 'single' ? 'filled' : 'outlined'}
                                    color={form.values.type === 'single' ? 'primary' : 'neutral'}
                                    className="flex-1 py-3 px-4 flex items-center justify-center space-x-2"
                                >
                                    <span>📄</span>
                                    <span>Single Item</span>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => form.setFieldValue('type', 'multiple')}
                                    variant={form.values.type === 'multiple' ? 'filled' : 'outlined'}
                                    color={form.values.type === 'multiple' ? 'success' : 'neutral'}
                                    className="flex-1 py-3 px-4 flex items-center justify-center space-x-2"
                                >
                                    <span>📁</span>
                                    <span>Multiple Items</span>
                                </Button>
                            </div>
                        </div>

                        {/* Planning Type Toggle - Only show for single categories */}
                        {form.values.type === 'single' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planning Type</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="planningType"
                                            value="expense"
                                            checked={form.values.planningType === 'expense'}
                                            onChange={form.handleChange}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-900 dark:text-gray-100">💸 Expense</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="planningType"
                                            value="goal"
                                            checked={form.values.planningType === 'goal'}
                                            onChange={form.handleChange}
                                            className="mr-2"
                                        />
                                        <span className="text-gray-900 dark:text-gray-100">🎯 Savings Goal</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Multiple Category Info */}
                        {form.values.type === 'multiple' && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-lg">📁</span>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Multiple Items Category</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This category will contain multiple budget items. The total amount needed per month and per paycheck will be calculated from the items you add to this category.
                                </p>
                            </div>
                        )}

                        {/* Expense-specific fields - Only show for single categories */}
                        {form.values.type === 'single' && form.values.planningType === 'expense' && (
                            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="font-medium text-blue-900 dark:text-blue-100">Expense Configuration</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Checkbox
                                                checked={form.values.usePercentage}
                                                onChange={(e) => form.setFieldValue('usePercentage', e.target.checked)}
                                            />
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Use percentage of pay
                                            </label>
                                        </div>

                                        {form.values.usePercentage ? (
                                            <Input
                                                label="Percentage of Pay"
                                                name="percentageAmount"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={form.values.percentageAmount}
                                                onChange={form.handleChange}
                                                error={form.errors.percentageAmount}
                                                placeholder="5.0"
                                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            />
                                        ) : (
                                            <CurrencyField
                                                label="Amount"
                                                name="amount"
                                                value={form.values.amount}
                                                onChange={(e) => form.setFieldValue('amount', e.target.value)}
                                                error={form.errors.amount}
                                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            />
                                        )}
                                    </div>

                                    <Select
                                        label="Frequency"
                                        name="frequency"
                                        value={form.values.frequency}
                                        onChange={form.handleChange}
                                        className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    >
                                        {frequencyOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <Input
                                    label="Due Date (Optional)"
                                    name="dueDate"
                                    type="date"
                                    value={form.values.dueDate}
                                    onChange={form.handleChange}
                                    className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        )}

                        {/* Goal-specific fields - Only show for single categories */}
                        {form.values.type === 'single' && form.values.planningType === 'goal' && (
                            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <h3 className="font-medium text-green-900 dark:text-green-100">Savings Goal Configuration</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CurrencyField
                                        label="Target Amount"
                                        name="targetAmount"
                                        value={form.values.targetAmount}
                                        onChange={(e) => form.setFieldValue('targetAmount', e.target.value)}
                                        error={form.errors.targetAmount}
                                        required
                                        className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />

                                    <Input
                                        label="Target Date"
                                        name="targetDate"
                                        type="date"
                                        value={form.values.targetDate}
                                        onChange={form.handleChange}
                                        className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CurrencyField
                                        label="Monthly Contribution"
                                        name="monthlyContribution"
                                        value={form.values.monthlyContribution}
                                        onChange={(e) => form.setFieldValue('monthlyContribution', e.target.value)}
                                        className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />

                                    <CurrencyField
                                        label="Already Saved"
                                        name="alreadySaved"
                                        value={form.values.alreadySaved}
                                        onChange={(e) => form.setFieldValue('alreadySaved', e.target.value)}
                                        className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Account and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Funding Account"
                                name="accountId"
                                value={form.values.accountId}
                                onChange={form.handleChange}
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

                            <Select
                                label="Status"
                                name="status"
                                value={form.values.status}
                                onChange={form.handleChange}
                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {/* Priority and Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Priority"
                                name="priority"
                                value={form.values.priority}
                                onChange={form.handleChange}
                                className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => form.setFieldValue('color', option.value)}
                                            className={`w-8 h-8 rounded-full border-2 ${form.values.color === option.value
                                                ? 'border-gray-900 dark:border-white'
                                                : 'border-gray-300 dark:border-gray-600'
                                                } ${option.value}`}
                                            title={option.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Options */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={form.values.autoFunding}
                                    onChange={(e) => form.setFieldValue('autoFunding', e.target.checked)}
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Enable auto-funding
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <Textarea
                            label="Description (Optional)"
                            name="description"
                            value={form.values.description}
                            onChange={form.handleChange}
                            rows={3}
                            className="border-gray-400 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <Button type="button" onClick={onCancel} variant="filled" color="secondary">
                                Cancel
                            </Button>
                            {!category && (
                                <Button
                                    type="button"
                                    onClick={handleSubmitAnother}
                                    variant="outlined"
                                    color="primary"
                                >
                                    Save & Add Another
                                </Button>
                            )}
                            <Button type="submit" variant="filled" color="primary">
                                {category ? 'Update' : 'Save'} Category
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default UnifiedCategoryForm;
