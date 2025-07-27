import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { frequencyOptions } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import { CurrencyField } from '../form';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Form';

const formFrequencyOptions = frequencyOptions.map(freq => ({
    value: freq.value,
    label: freq.label
}));

// Simple PayeeAutocomplete component that matches the form styling
const PayeeAutocompleteComponent = ({ value, onChange, payees, onAddPayee, placeholder }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || '');
    const [filteredPayees, setFilteredPayees] = React.useState(payees);
    const inputRef = React.useRef(null);
    const dropdownRef = React.useRef(null);

    // Update input value when prop value changes
    React.useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Filter payees based on input
    React.useEffect(() => {
        if (!inputValue.trim()) {
            setFilteredPayees(payees);
        } else {
            const filtered = payees.filter(payee =>
                payee.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredPayees(filtered);
        }
    }, [inputValue, payees]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.({ target: { name: 'payee', value: newValue } });
        setIsOpen(true);
    };

    const handleSelectPayee = (payee) => {
        setInputValue(payee);
        onChange?.({ target: { name: 'payee', value: payee } });
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleAddNewPayee = () => {
        if (inputValue.trim() && !payees.includes(inputValue.trim())) {
            const newPayee = inputValue.trim();
            onAddPayee?.(newPayee);
            handleSelectPayee(newPayee);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const exactMatch = filteredPayees.find(payee =>
                payee.toLowerCase() === inputValue.toLowerCase()
            );

            if (exactMatch) {
                handleSelectPayee(exactMatch);
            } else if (inputValue.trim() && filteredPayees.length === 0) {
                handleAddNewPayee();
            } else if (filteredPayees.length > 0) {
                handleSelectPayee(filteredPayees[0]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    const showAddOption = inputValue.trim() &&
        !payees.some(payee => payee.toLowerCase() === inputValue.toLowerCase()) &&
        filteredPayees.length === 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    name="payee"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-10 border border-info bg-base-100 text-base-content rounded-lg focus:outline-none focus:border-primary transition-colors"
                />

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-base-content/60 hover"
                >
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Existing payees */}
                    {filteredPayees.length > 0 && (
                        <div>
                            {filteredPayees.map((payee, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectPayee(payee)}
                                    className="w-full px-3 py-2 text-left hover text-base-content transition-colors first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {payee}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Add new payee option */}
                    {showAddOption && (
                        <button
                            type="button"
                            onClick={handleAddNewPayee}
                            className="w-full px-3 py-2 text-left hover text-info transition-colors border-t border-info flex items-center space-x-2"
                        >
                            <span>+</span>
                            <span>Add &#34;{inputValue}&#34;</span>
                        </button>
                    )}

                    {/* No results */}
                    {filteredPayees.length === 0 && !showAddOption && inputValue.trim() && (
                        <div className="px-3 py-2 text-base-content/60 text-sm">
                            No payees found
                        </div>
                    )}

                    {/* Show all payees when input is empty */}
                    {!inputValue.trim() && payees.length === 0 && (
                        <div className="px-3 py-2 text-base-content/60 text-sm">
                            Start typing to add your first payee
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UnifiedItemForm = ({
    item = null,
    onSave,
    onCancel,
    categories = [],
    accounts = [],
    currentPay = 0,
    preselectedCategory = null,
}) => {
    // Payee management - use localStorage directly (fallback for build compatibility)
    const [payees, setPayees] = React.useState(() => {
        try {
            const stored = localStorage.getItem('budgetCalc_payees');
            return stored ? JSON.parse(stored) : [
                'Amazon',
                'Walmart',
                'Target',
                'Grocery Store',
                'Gas Station',
                'Utility Company',
                'Insurance Company',
                'Bank',
                'Credit Card Company',
                'Restaurant'
            ];
        } catch (error) {
            console.error('Error loading payees:', error);
            return [];
        }
    });

    const handleAddPayee = (newPayee) => {
        if (newPayee.trim() && !payees.includes(newPayee.trim())) {
            const updatedPayees = [...payees, newPayee.trim()];
            setPayees(updatedPayees);
            localStorage.setItem('budgetCalc_payees', JSON.stringify(updatedPayees));
        }
    };
    // Determine if we're editing an expense or a goal
    // const isGoal = item?.targetAmount !== undefined;
    // const initialType = isGoal ? 'goal' : 'expense';
    const initialType = 'expense'; // Only expenses for now

    console.log('DEBUG - UnifiedItemForm rendering with categories:', categories);
    console.log('DEBUG - UnifiedItemForm rendering with preselectedCategory:', preselectedCategory);
    const resolvedCategoryId = preselectedCategory?.id || preselectedCategory?.preselectedCategory?.id || '';

    console.log('🎯 Resolved categoryId:', resolvedCategoryId);

    // Initialize form with useForm hook
    const initialValues = {
        type: initialType,
        name: item?.name || '',
        amount: item?.amount !== undefined ? item.amount : 0,
        usePercentage: item?.usePercentage || false,
        percentageAmount: item?.percentageAmount !== undefined ? item.percentageAmount : 0,
        frequency: item?.frequency || 'monthly',
        dueDate: item?.dueDate || '',
        payee: item?.payee || '',
        categoryId: item?.categoryId || resolvedCategoryId || '',
        accountId: item?.accountId || (accounts[0]?.id || ''),
        priorityState: item?.priorityState || 'active',
        isActive: item?.isActive !== false, // Default to true unless explicitly false
        isRecurring: item?.isRecurring || false,
        priority: item?.priority || 'medium',

        // Goal-specific fields
        targetAmount: item?.targetAmount !== undefined ? item.targetAmount : 0,
        targetDate: item?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
        monthlyContribution: item?.monthlyContribution !== undefined ? item.monthlyContribution : 0,
        monthlyPercentage: item?.monthlyPercentage !== undefined ? item.monthlyPercentage : 0,
        alreadySaved: item?.alreadySaved !== undefined ? item.alreadySaved : 0,

        // Scheduled transaction fields
        createScheduledTransactions: item?.createScheduledTransactions || false,
        scheduledEndCondition: item?.scheduledEndCondition || 'indefinite',
        scheduledEndDate: item?.scheduledEndDate || '',
        scheduledMaxOccurrences: item?.scheduledMaxOccurrences || 12,
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
                    payee: values.payee,
                    isRecurring: values.isRecurring,
                    priority: values.priority,
                    // Scheduled transaction fields
                    createScheduledTransactions: values.createScheduledTransactions,
                    scheduledEndCondition: values.scheduledEndCondition,
                    scheduledEndDate: values.scheduledEndDate,
                    scheduledMaxOccurrences: values.scheduledMaxOccurrences,
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

        // Ensure accountId is always a number for consistency
        const accountId = Number(form.values.accountId);
        const categoryId = Number(form.values.categoryId);

        // Find the full objects from the arrays using numeric IDs
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        const selectedAccount = accounts.find(acc => acc.id === accountId);

        console.log('DEBUG - Account ID Conversion:', {
            originalAccountId: form.values.accountId,
            originalAccountIdType: typeof form.values.accountId,
            convertedAccountId: accountId,
            convertedAccountIdType: typeof accountId,
            selectedAccount,
            selectedAccountFound: !!selectedAccount
        });

        console.log('DEBUG - Category ID Conversion:', {
            originalCategoryId: form.values.categoryId,
            originalCategoryIdType: typeof form.values.categoryId,
            convertedCategoryId: categoryId,
            convertedCategoryIdType: typeof categoryId,
            selectedCategory,
            selectedCategoryFound: !!selectedCategory
        });

        console.log('DEBUG - Form values before submit:', form.values);
        console.log('DEBUG - Form errors:', form.errors);
        console.log('DEBUG - Form isValid:', form.isValid);

        // Don't call form.handleSubmit() - prepare data manually
        if (!form.isValid) {
            console.log('DEBUG - Form validation failed, not submitting');
            return;
        }

        // Prepare the data with full objects - ensure IDs are always numbers
        const commonData = {
            name: form.values.name,
            category: selectedCategory,
            categoryId: categoryId, // Use the converted numeric categoryId
            account: selectedAccount,
            accountId: accountId, // Use the converted numeric accountId
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
                payee: form.values.payee,
                isActive: form.values.isActive, // Include isActive field
                isRecurring: form.values.isRecurring,
                priority: form.values.priority,
                // Scheduled transaction fields
                createScheduledTransactions: form.values.createScheduledTransactions,
                scheduledEndCondition: form.values.scheduledEndCondition,
                scheduledEndDate: form.values.scheduledEndDate,
                scheduledMaxOccurrences: form.values.scheduledMaxOccurrences,
            };
        } else {
            itemData = {
                ...commonData,
                type: 'goal',
                targetAmount: form.values.targetAmount || 0,
                targetDate: form.values.targetDate,
                monthlyContribution: form.values.monthlyContribution || 0,
                alreadySaved: form.values.alreadySaved || 0,
                isActive: form.values.isActive, // Include isActive field
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
                payee: form.values.payee,
                isRecurring: form.values.isRecurring,
                priority: form.values.priority,
                // Scheduled transaction fields
                createScheduledTransactions: form.values.createScheduledTransactions,
                scheduledEndCondition: form.values.scheduledEndCondition,
                scheduledEndDate: form.values.scheduledEndDate,
                scheduledMaxOccurrences: form.values.scheduledMaxOccurrences,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/50 backdrop-blur-sm transition-opacity">
            <Card skin="shadow" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-base-content">
                            {item ? 'Edit Item' : 'Add New Item'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="btn btn-ghost btn-sm"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                        {/* Type Selection - Only show if not editing */}
                        {/* COMMENTED OUT - Only expenses for now
                        {!item && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-base-content">
                                    What are you adding?
                                </label>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => form.setFieldValue('type', 'expense')}
                                        className={`flex-1 py-2 px-3 flex items-center justify-center space-x-1 text-sm rounded-lg border transition-colors ${form.values.type === 'expense'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-base-100 text-base-content border-base-300 hover:bg-base-200'
                                            }`}
                                    >
                                        <span>💸</span>
                                        <span>Expense</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => form.setFieldValue('type', 'goal')}
                                        className={`flex-1 py-2 px-3 flex items-center justify-center space-x-1 text-sm rounded-lg border transition-colors ${form.values.type === 'goal'
                                            ? 'bg-success text-white border-success'
                                            : 'bg-base-100 text-base-content border-base-300 hover:bg-base-200'
                                            }`}
                                    >
                                        <span>🎯</span>
                                        <span>Goal</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        */}

                        {/* Show current type when editing (read-only) */}
                        {item && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-base-content">
                                    Item Type
                                </label>
                                <div className={`py-2 px-3 rounded-lg border ${form.values.type === 'expense'
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-success/10 border-success'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                        <span>{form.values.type === 'expense' ? '💸' : '🎯'}</span>
                                        <span className="font-medium text-base-content text-sm">
                                            {form.values.type === 'expense' ? 'Expense' : 'Savings Goal'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Basic Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                {...form.getFieldProps('name')}
                                label="Name"
                                placeholder={form.values.type === 'expense' ? "Expense name (e.g., 'Rent')" : "Goal name (e.g., 'New Car')"}
                                autoFocus
                                className="border-base-300 bg-base-100 text-base-content"
                            />

                            <Select
                                {...form.getFieldProps('priorityState')}
                                label="Status"
                                data={priorityStateOptions}
                                className="border-base-300 bg-base-100 text-base-content"
                            />
                        </div>

                        {/* Category and Account Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                {...form.getFieldProps('categoryId')}
                                label="Category"
                                data={categoryOptions}
                                className="border-base-300 bg-base-100 text-base-content"
                            />

                            <Select
                                {...form.getFieldProps('accountId')}
                                label="Funding Account"
                                data={accountOptions}
                                className="border-base-300 bg-base-100 text-base-content"
                            />
                        </div>

                        {/* Active/Inactive Toggle */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-base-content">
                                Item Status
                            </label>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => form.setFieldValue('isActive', !form.values.isActive)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${form.values.isActive
                                        ? 'bg-success/10 border-success text-success'
                                        : 'bg-base-200 border-base-300 text-base-content/60'
                                        }`}
                                >
                                    {form.values.isActive ? (
                                        <>
                                            <span className="text-lg">✅</span>
                                            <span className="font-medium">Active</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg">⏸️</span>
                                            <span className="font-medium">Inactive</span>
                                        </>
                                    )}
                                </button>
                                <div className="text-sm text-base-content/60">
                                    {form.values.isActive
                                        ? 'This item will be included in budget calculations'
                                        : 'This item is for planning only and won\'t affect budget totals'
                                    }
                                </div>
                            </div>
                        </div>

                        {form.values.type === 'expense' ? (
                            // Expense-specific fields
                            <>
                                {/* Amount Type Selection
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-base-content">
                                        How do you want to set the amount?
                                    </label>
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Convert percentage to dollar if switching from percentage mode
                                                if (form.values.usePercentage && form.values.percentageAmount && currentPay > 0) {
                                                    const convertedAmount = percentageToDollar(form.values.percentageAmount, currentPay);
                                                    form.setFieldValue('amount', convertedAmount);
                                                }
                                                form.setFieldValue('usePercentage', false);
                                            }}
                                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${!form.values.usePercentage
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-base-100 text-base-content border-base-300 hover:bg-base-200'
                                                }`}
                                        >
                                            <span className="mr-1">💰</span>
                                            Dollar Amount
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Convert dollar to percentage if switching from dollar mode
                                                if (!form.values.usePercentage && form.values.amount && currentPay > 0) {
                                                    const convertedPercentage = dollarToPercentage(form.values.amount, currentPay);
                                                    form.setFieldValue('percentageAmount', convertedPercentage);
                                                }
                                                form.setFieldValue('usePercentage', true);
                                            }}
                                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${form.values.usePercentage
                                                ? 'bg-success text-white border-success'
                                                : 'bg-base-100 text-base-content border-base-300 hover:bg-base-200'
                                                }`}
                                        >
                                            <span className="mr-1">📊</span>
                                            % of Paycheck
                                        </button>
                                    </div>
                                </div> */}

                                {/* Amount Field */}
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
                                    className="border-base-300 bg-base-100 text-base-content"

                                />
                                {/* {form.values.usePercentage ? (
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
                                        className="border-base-300 bg-base-100 text-base-content"

                                    />
                                )} */}

                                {/* Due Date - Always show */}
                                <Input
                                    {...form.getFieldProps('dueDate')}
                                    label="Due Date (Optional)"
                                    type="date"
                                    className="border-base-300 bg-base-100 text-base-content"
                                />

                                {/* Recurring Expense Checkbox - Only show if due date is filled */}
                                {form.values.dueDate && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox-rounded this:success"
                                            checked={form.values.isRecurring}
                                            onChange={(e) => form.setFieldValue('isRecurring', e.target.checked)}
                                        />
                                        <label className="text-sm font-medium text-base-content">
                                            This is a recurring expense
                                        </label>
                                    </div>
                                )}

                                {/* Frequency - Only show if recurring */}
                                {form.values.dueDate && form.values.isRecurring && (
                                    <Select
                                        {...form.getFieldProps('frequency')}
                                        label="Frequency"
                                        data={formFrequencyOptions}
                                        className="border-base-300 bg-base-100 text-base-content"
                                    />
                                )}

                                {/* Scheduled Transactions Option - Only show if due date AND recurring AND frequency are filled */}
                                {form.values.dueDate && form.values.isRecurring && form.values.frequency && (
                                    <div className="space-y-3 pt-4 border-t border-base-300">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox-rounded this:secondary"
                                                checked={form.values.createScheduledTransactions}
                                                onChange={(e) => form.setFieldValue('createScheduledTransactions', e.target.checked)}
                                            />
                                            <label className="text-sm font-medium text-info">
                                                Create scheduled transactions for this expense
                                            </label>
                                        </div>

                                        {/* Payee and End Conditions - Only show if scheduled transactions is checked */}
                                        {form.values.createScheduledTransactions && (
                                            <div className="ml-6 space-y-4 p-3 bg-info/10 rounded-lg">
                                                <p className="text-xs text-info">
                                                    Scheduled transactions will be created based on the due date and frequency above.
                                                </p>

                                                {/* Payee Field */}
                                                <div>
                                                    <label className="block text-sm font-medium text-info mb-1">
                                                        Payee (Optional)
                                                    </label>
                                                    <PayeeAutocompleteComponent
                                                        value={form.values.payee}
                                                        onChange={form.handleChange}
                                                        payees={payees}
                                                        onAddPayee={handleAddPayee}
                                                        placeholder="Enter payee name"
                                                    />
                                                </div>

                                                {/* End Condition Selection */}
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-info">
                                                        End Condition
                                                    </label>
                                                    <div className="space-y-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="radio"
                                                                name="scheduledEndCondition"
                                                                value="until_date"
                                                                checked={form.values.scheduledEndCondition === 'until_date'}
                                                                onChange={form.handleChange}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm text-info">Repeat until date</span>
                                                        </label>
                                                        {form.values.scheduledEndCondition === 'until_date' && (
                                                            <Input
                                                                name="scheduledEndDate"
                                                                type="date"
                                                                value={form.values.scheduledEndDate}
                                                                onChange={form.handleChange}
                                                                className="ml-6 border-info bg-base-100 text-base-content"
                                                            />
                                                        )}

                                                        <label className="flex items-center">
                                                            <input
                                                                type="radio"
                                                                name="scheduledEndCondition"
                                                                value="max_occurrences"
                                                                checked={form.values.scheduledEndCondition === 'max_occurrences'}
                                                                onChange={form.handleChange}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm text-info">Number of payments</span>
                                                        </label>
                                                        {form.values.scheduledEndCondition === 'max_occurrences' && (
                                                            <Input
                                                                name="scheduledMaxOccurrences"
                                                                type="number"
                                                                min="1"
                                                                value={form.values.scheduledMaxOccurrences}
                                                                onChange={form.handleChange}
                                                                placeholder="12"
                                                                className="ml-6 w-24 border-info bg-base-100 text-base-content"
                                                            />
                                                        )}

                                                        <label className="flex items-center">
                                                            <input
                                                                type="radio"
                                                                name="scheduledEndCondition"
                                                                value="indefinite"
                                                                checked={form.values.scheduledEndCondition === 'indefinite'}
                                                                onChange={form.handleChange}
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm text-info">Repeat indefinitely</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            // Goal-specific fields - COMMENTED OUT FOR NOW
                            <>
                                {/* Target Amount
                                <CurrencyField
                                    {...form.getFieldProps('targetAmount')}
                                    label="Target Amount"
                                    placeholder="0.00"
                                />

                                Target Date
                                <Input
                                    {...form.getFieldProps('targetDate')}
                                    label="Target Date"
                                    type="date"
                                />

                                Monthly Contribution
                                <CurrencyField
                                    {...form.getFieldProps('monthlyContribution')}
                                    label="Monthly Contribution"
                                    placeholder="0.00"
                                />
                                */}

                            </>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-base-content/60 bg-base-100 border border-base-300 rounded-lg hover transition-colors"
                            >
                                Cancel
                            </button>
                            {!item && (
                                <button
                                    type="button"
                                    onClick={handleSubmitAnother}
                                    disabled={!form.isValid}
                                    className="btn btn-primary btn-outline"
                                >
                                    Save & Add Another
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!form.isValid}
                                className="btn btn-primary"
                            >
                                {item ? 'Update' : 'Save'} Item
                            </button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default UnifiedItemForm;
