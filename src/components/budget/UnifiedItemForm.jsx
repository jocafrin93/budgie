import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { frequencyOptions } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import { CurrencyField } from '../form';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Checkbox, Input, Select } from '../ui/Form';

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
}) => {
    // Determine if we're editing an expense or a goal
    const isGoal = item?.targetAmount !== undefined;
    const initialType = isGoal ? 'goal' : 'expense';

    console.log('DEBUG - UnifiedItemForm rendering with categories:', categories);
    console.log('DEBUG - UnifiedItemForm rendering with preselectedCategory:', preselectedCategory);
    const resolvedCategoryId = preselectedCategory?.id || preselectedCategory?.preselectedCategory?.id || '';

    console.log('🎯 Resolved categoryId:', resolvedCategoryId);

    // Initialize form with useForm hook
    const initialValues = {
        type: initialType,
        name: item?.name || '',
        amount: item?.amount || 0,
        usePercentage: item?.usePercentage || false,
        percentageAmount: item?.percentageAmount || 0,
        frequency: item?.frequency || 'monthly',
        dueDate: item?.dueDate || '',
        categoryId: resolvedCategoryId || '',
        accountId: item?.accountId || (accounts[0]?.id || ''),
        priorityState: item?.priorityState || 'active',
        isRecurring: item?.isRecurring || false,
        priority: item?.priority || 'medium',

        // Goal-specific fields
        targetAmount: item?.targetAmount || 0,
        targetDate: item?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
        monthlyContribution: item?.monthlyContribution || 0,
        monthlyPercentage: item?.monthlyPercentage || 0,
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
                    name: values.name,
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
                    name: values.name,
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
                if (values.isRecurring && !values.frequency) {
                    errors.frequency = 'Frequency is required when expense is recurring';
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
        if (form.values.type === 'expense' && currentPay > 0) {
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


    // Handle form submission
    const handleSubmit = () => {
        console.log('DEBUG - Form submit button clicked');

        // Find the full objects from the arrays
        const selectedCategory = categories.find(cat => cat.id === form.values.categoryId);
        const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);

        console.log('DEBUG - selectedCategory:', selectedCategory);
        console.log('DEBUG - selectedAccount:', selectedAccount);
        console.log('DEBUG - Form values before submit:', form.values);
        console.log('DEBUG - Form errors:', form.errors);
        console.log('DEBUG - Form isValid:', form.isValid);

        // Don't call form.handleSubmit() - prepare data manually
        if (!form.isValid) {
            console.log('DEBUG - Form validation failed, not submitting');
            return;
        }

        // Prepare the data with full objects
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
    const handleSubmitAnother = () => {
        const selectedCategory = categories.find(cat => cat.id === form.values.categoryId);
        const selectedAccount = accounts.find(acc => acc.id === form.values.accountId);
        const currentCategoryId = form.values.categoryId;
        const currentAccountId = form.values.accountId;
        const currentType = form.values.type;
        const currentPriorityState = form.values.priorityState;
        const currentFrequency = form.values.frequency;
        const currentPriority = form.values.priority;

        // Prepare data same way as form's onSubmit
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
                dueDate: item?.dueDate || formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
                categoryId: currentCategoryId,
                accountId: currentAccountId,
                priorityState: currentPriorityState,
                isRecurring: false,
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-50">
                            {item ? 'Edit Item' : 'Add New Item'}
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

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                        {/* Type Selection - Only show if not editing */}
                        {!item && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-900 dark:text-dark-50">
                                    What are you adding?
                                </label>
                                <div className="flex space-x-3">
                                    <Button
                                        type="button"
                                        onClick={() => form.setFieldValue('type', 'expense')}
                                        variant={form.values.type === 'expense' ? 'filled' : 'outlined'}
                                        color={form.values.type === 'expense' ? 'primary' : 'neutral'}
                                        className="flex-1 py-3 px-4 flex items-center justify-center space-x-2"
                                    >
                                        <span>💸</span>
                                        <span>Expense</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => form.setFieldValue('type', 'goal')}
                                        variant={form.values.type === 'goal' ? 'filled' : 'outlined'}
                                        color={form.values.type === 'goal' ? 'success' : 'neutral'}
                                        className="flex-1 py-3 px-4 flex items-center justify-center space-x-2"
                                    >
                                        <span>🎯</span>
                                        <span>Goal</span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Show current type when editing (read-only) */}
                        {item && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-900 dark:text-dark-50">
                                    Item Type
                                </label>
                                <div className={`py-3 px-4 rounded-lg border ${form.values.type === 'expense'
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                                    : 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                        <span>{form.values.type === 'expense' ? '💸' : '🎯'}</span>
                                        <span className="font-medium text-gray-900 dark:text-dark-50">
                                            {form.values.type === 'expense' ? 'Expense' : 'Savings Goal'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Name Field */}
                        <Input
                            {...form.getFieldProps('name')}
                            label="Name"
                            placeholder={form.values.type === 'expense' ? "Expense name (e.g., 'Rent')" : "Goal name (e.g., 'New Car')"}
                            autoFocus
                        />

                        {/* Category Field */}
                        <Select
                            {...form.getFieldProps('categoryId')}
                            label="Category"
                            data={categoryOptions}
                        />

                        {/* Account Field */}
                        <Select
                            {...form.getFieldProps('accountId')}
                            label="Funding Account"
                            data={accountOptions}
                        />

                        {/* Priority State Field */}
                        <Select
                            {...form.getFieldProps('priorityState')}
                            label="Status"
                            data={priorityStateOptions}
                        />

                        {form.values.type === 'expense' ? (
                            // Expense-specific fields
                            <>
                                {/* Amount Type Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-900 dark:text-dark-50">
                                        How do you want to set the amount?
                                    </label>
                                    <div className="flex space-x-3">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                // Convert percentage to dollar if switching from percentage mode
                                                if (form.values.usePercentage && form.values.percentageAmount && currentPay > 0) {
                                                    const convertedAmount = percentageToDollar(form.values.percentageAmount, currentPay);
                                                    form.setFieldValue('amount', convertedAmount);
                                                }
                                                form.setFieldValue('usePercentage', false);
                                            }}
                                            variant={!form.values.usePercentage ? 'filled' : 'outlined'}
                                            color={!form.values.usePercentage ? 'primary' : 'neutral'}
                                            className="flex-1 py-2 px-3 text-sm"
                                        >
                                            <span className="mr-1">💰</span>
                                            Dollar Amount
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                // Convert dollar to percentage if switching from dollar mode
                                                if (!form.values.usePercentage && form.values.amount && currentPay > 0) {
                                                    const convertedPercentage = dollarToPercentage(form.values.amount, currentPay);
                                                    form.setFieldValue('percentageAmount', convertedPercentage);
                                                }
                                                form.setFieldValue('usePercentage', true);
                                            }}
                                            variant={form.values.usePercentage ? 'filled' : 'outlined'}
                                            color={form.values.usePercentage ? 'success' : 'neutral'}
                                            className="flex-1 py-2 px-3 text-sm"
                                        >
                                            <span className="mr-1">📊</span>
                                            % of Paycheck
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
                                        value={form.values.amount ? form.values.amount.toString() : ''}
                                        onChange={(e) => {
                                            const numericValue = parseFloat(e.target.value) || 0;
                                            form.setFieldValue('amount', numericValue);
                                        }}
                                        placeholder="0.00"
                                        error={form.errors.amount}
                                        description={currentPay > 0 ? `Approx. ${dollarToPercentage(form.values.amount || 0, currentPay).toFixed(1)}% of income` : ''}
                                    />
                                )}

                                {/* Due Date Field */}
                                <Input
                                    {...form.getFieldProps('dueDate')}
                                    label="Due Date"
                                    type="date"
                                    description="Optional - leave blank if no specific due date"
                                />

                                {/* Recurring Checkbox */}
                                {form.values.dueDate && (
                                    <Checkbox
                                        {...form.getFieldProps('isRecurring')}
                                        label="This is a recurring expense"
                                    />
                                )}

                                {/* Frequency Field */}
                                {form.values.dueDate && form.values.isRecurring && (
                                    <Select
                                        {...form.getFieldProps('frequency')}
                                        label="Frequency"
                                        data={formFrequencyOptions}
                                        description="How often does this expense repeat?"
                                    />
                                )}
                            </>
                        ) : (
                            // Goal-specific fields
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
                            {!item && (
                                <Button
                                    type="button"
                                    onClick={handleSubmitAnother}
                                    variant="outlined"
                                    color="primary"
                                    disabled={!form.isValid}
                                >
                                    Save & Add Another
                                </Button>
                            )}
                            <Button
                                type="submit"
                                variant="filled"
                                color="primary"
                                disabled={!form.isValid}
                            >
                                {item ? 'Update Item' : 'Add Item'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default UnifiedItemForm;
