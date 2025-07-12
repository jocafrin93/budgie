import { RefreshCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { formatDate } from '../../utils/dateUtils';
import { dollarToPercentage, percentageToDollar } from '../../utils/moneyUtils';
import { CurrencyField } from '../form';
import { Checkbox, Input, Select, Textarea } from '../ui';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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
    { value: 'bg-info/50', label: 'info', color: '#3B82F6' },
    { value: 'bg-success', label: 'Green', color: '#10B981' },
    { value: 'bg-warning', label: 'Orange', color: '#F59E0B' },
    { value: 'bg-error', label: 'Red', color: '#EF4444' },
    { value: 'bg-secondary', label: 'Purple', color: '#8B5CF6' },
    { value: 'bg-accent', label: 'Pink', color: '#EC4899' },
    { value: 'bg-info', label: 'Teal', color: '#14B8A6' },
    { value: 'bg-lime-500', label: 'Lime', color: '#84CC16' },
];

// PayeeAutocomplete component with info theme styling
const PayeeAutocompleteinfo = ({ value, onChange, payees, onAddPayee, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredPayees, setFilteredPayees] = useState(payees);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Filter payees based on input
    useEffect(() => {
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
    useEffect(() => {
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-info hover"
                >
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-info rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

// Enhanced Goal Fields Component with paycheck-based auto-calculation
const EnhancedGoalFields = ({ formValues, setFieldValue, errors, currentPay }) => {
    const [modifiedFields, setModifiedFields] = useState({
        targetAmount: false,
        targetDate: false,
        perPaycheckContribution: false
    });

    const [usePercentageForPaycheck, setUsePercentageForPaycheck] = useState(false);
    const [calculatedField, setCalculatedField] = useState(null);
    const [showRecalculationOptions, setShowRecalculationOptions] = useState(false);
    const isCalculating = useRef(false);



    const handleFieldChange = (fieldName, value) => {
        setModifiedFields(prev => ({
            ...prev,
            [fieldName]: true
        }));

        setFieldValue(fieldName, value);
    };

    const handlePaycheckModeToggle = (usePercentage) => {
        if (usePercentage && !usePercentageForPaycheck && formValues.perPaycheckContribution && currentPay > 0) {
            const convertedPercentage = dollarToPercentage(parseFloat(formValues.perPaycheckContribution), currentPay);
            setFieldValue('paycheckPercentage', convertedPercentage);
        } else if (!usePercentage && usePercentageForPaycheck && formValues.paycheckPercentage && currentPay > 0) {
            const convertedAmount = percentageToDollar(parseFloat(formValues.paycheckPercentage), currentPay);
            setFieldValue('perPaycheckContribution', convertedAmount);
        }
        setUsePercentageForPaycheck(usePercentage);
    };

    const handleRecalculate = (fieldToCalculate) => {
        setCalculatedField(fieldToCalculate);
        setModifiedFields(prev => ({
            ...prev,
            [fieldToCalculate]: false
        }));
    };

    // Auto-calculation logic - now paycheck-based
    useEffect(() => {
        // Get paycheck management functionality
        const getPaychecksInDateRange = (startDate, endDate) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const paychecks = [];

            // Assume bi-weekly paychecks starting from today
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + (14 - (currentDate.getDate() % 14))); // Next paycheck

            while (currentDate <= end) {
                if (currentDate >= start) {
                    paychecks.push({
                        date: new Date(currentDate),
                        amount: currentPay
                    });
                }
                currentDate.setDate(currentDate.getDate() + 14); // Add 14 days for bi-weekly
            }

            return paychecks;
        };

        // Calculate number of paychecks between now and target date
        const calculatePaychecksUntilTarget = (targetDate) => {
            if (!targetDate) return 0;

            const today = new Date();
            const target = new Date(targetDate);

            if (target <= today) return 0;

            const paychecks = getPaychecksInDateRange(today, target);
            return paychecks.length;
        };

        const targetAmount = parseFloat(formValues.targetAmount) || 0;
        const perPaycheckContribution = parseFloat(formValues.perPaycheckContribution) || 0;
        const targetDate = formValues.targetDate ? new Date(formValues.targetDate) : null;

        const hasTargetAmount = modifiedFields.targetAmount && targetAmount > 0;
        const hasPerPaycheckContribution = modifiedFields.perPaycheckContribution && perPaycheckContribution > 0;
        const hasTargetDate = modifiedFields.targetDate && targetDate && targetDate > new Date();

        const filledFieldCount = [hasTargetAmount, hasPerPaycheckContribution, hasTargetDate].filter(Boolean).length;

        if (filledFieldCount === 2 && !isCalculating.current) {
            isCalculating.current = true;

            try {
                if (!hasPerPaycheckContribution && hasTargetAmount && hasTargetDate) {
                    setCalculatedField('perPaycheckContribution');
                    const paychecksUntilTarget = calculatePaychecksUntilTarget(targetDate);
                    if (paychecksUntilTarget > 0) {
                        const calculatedContribution = targetAmount / paychecksUntilTarget;
                        setFieldValue('perPaycheckContribution', calculatedContribution.toFixed(2));
                    }
                }
                else if (!hasTargetAmount && hasPerPaycheckContribution && hasTargetDate) {
                    setCalculatedField('targetAmount');
                    const paychecksUntilTarget = calculatePaychecksUntilTarget(targetDate);
                    const calculatedAmount = perPaycheckContribution * paychecksUntilTarget;
                    setFieldValue('targetAmount', calculatedAmount.toFixed(2));
                }
                else if (!hasTargetDate && hasTargetAmount && hasPerPaycheckContribution) {
                    setCalculatedField('targetDate');
                    const paychecksNeeded = Math.ceil(targetAmount / perPaycheckContribution);
                    // Calculate target date based on bi-weekly paychecks
                    const calculatedDate = new Date();
                    calculatedDate.setDate(calculatedDate.getDate() + (paychecksNeeded * 14));
                    const year = calculatedDate.getFullYear();
                    const month = String(calculatedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(calculatedDate.getDate()).padStart(2, '0');
                    setFieldValue('targetDate', `${year}-${month}-${day}`);
                }
            } catch (error) {
                console.error("Error in calculation:", error);
            } finally {
                setTimeout(() => {
                    isCalculating.current = false;
                }, 100);
            }
        } else {
            setCalculatedField(null);
        }
    }, [formValues.targetAmount, formValues.perPaycheckContribution, formValues.targetDate, modifiedFields, setFieldValue, currentPay]);

    useEffect(() => {
        const hasPerPaycheckValue = parseFloat(formValues.perPaycheckContribution) > 0;
        setShowRecalculationOptions(calculatedField === 'perPaycheckContribution' || hasPerPaycheckValue);
    }, [formValues.perPaycheckContribution, calculatedField]);

    const getFieldHint = (fieldName) => {
        if (calculatedField === fieldName) {
            return "Auto-calculated";
        }
        return "";
    };

    return (
        <div className="space-y-4 p-4 bg-success-lighter/20 border border-success-light rounded-lg">
            <h3 className="font-medium text-success-dark">Savings Goal Configuration</h3>

            <div className="bg-info/10 border border-info p-3 mb-4 rounded-md text-sm text-info">
                <div className="mt-1 text-xs">
                    <span className="text-error">*</span> Required field
                </div>
                <div className="mt-1">
                    Fill in two fields to automatically calculate the third.
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <div className="flex items-center mb-1">
                        <label className="text-sm font-medium text-base-content">
                            Target Amount <span className="text-error">*</span>
                        </label>
                        {showRecalculationOptions && (
                            <button
                                type="button"
                                className="ml-2 p-1 rounded focus:outline-none text-base-content hover"
                                onClick={() => handleRecalculate('targetAmount')}
                                title="Click to recalculate target amount"
                            >
                                <RefreshCcw size={16} />
                            </button>
                        )}
                    </div>
                    <CurrencyField
                        name="targetAmount"
                        value={formValues.targetAmount}
                        error={errors.targetAmount}
                        hint={getFieldHint('targetAmount')}
                        onChange={(e) => handleFieldChange('targetAmount', e.target.value)}
                        className="border-base-300 bg-base-100 text-base-content"
                    />
                </div>

                <div className="relative">
                    <div className="flex items-center mb-1">
                        <label className="text-sm font-medium text-base-content">
                            Target Date
                        </label>
                        {showRecalculationOptions && (
                            <button
                                type="button"
                                className="ml-2 p-1 rounded focus:outline-none text-base-content hover"
                                onClick={() => handleRecalculate('targetDate')}
                                title="Click to recalculate target date"
                            >
                                <RefreshCcw size={16} />
                            </button>
                        )}
                    </div>
                    <Input
                        name="targetDate"
                        type="date"
                        value={formValues.targetDate}
                        error={errors.targetDate}
                        hint={getFieldHint('targetDate')}
                        onChange={(e) => handleFieldChange('targetDate', e.target.value)}
                        className="border-base-300 bg-base-100 text-base-content"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-base-content">
                    How much will you save each paycheck?
                </label>
                <div className="flex space-x-2">
                    <Button
                        type="button"
                        onClick={() => handlePaycheckModeToggle(false)}
                        variant={!usePercentageForPaycheck ? 'filled' : 'outlined'}
                        color={!usePercentageForPaycheck ? 'primary' : 'neutral'}
                        className="flex-1 py-2 px-3 text-sm"
                    >
                        <span className="mr-1">💰</span>
                        Dollar Amount
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handlePaycheckModeToggle(true)}
                        variant={usePercentageForPaycheck ? 'filled' : 'outlined'}
                        color={usePercentageForPaycheck ? 'success' : 'neutral'}
                        className="flex-1 py-2 px-3 text-sm"
                    >
                        <span className="mr-1">📊</span>
                        % of Paycheck
                    </Button>
                </div>
            </div>

            <div className="relative">
                <div className="flex items-center mb-1">
                    <label className="text-sm font-medium text-base-content">
                        Per Paycheck Contribution
                    </label>
                    {showRecalculationOptions && (
                        <button
                            type="button"
                            className="ml-2 p-1 rounded focus:outline-none text-base-content hover"
                            onClick={() => handleRecalculate('perPaycheckContribution')}
                            title="Click to recalculate per paycheck contribution"
                        >
                            <RefreshCcw size={16} />
                        </button>
                    )}
                </div>

                {usePercentageForPaycheck ? (
                    <Input
                        name="paycheckPercentage"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formValues.paycheckPercentage || ''}
                        error={errors.perPaycheckContribution}
                        hint={currentPay > 0 ? `Approx. $${percentageToDollar(formValues.paycheckPercentage || 0, currentPay).toFixed(2)} per paycheck` : getFieldHint('perPaycheckContribution')}
                        onChange={(e) => {
                            handleFieldChange('paycheckPercentage', e.target.value);
                            if (currentPay > 0) {
                                const dollarAmount = percentageToDollar(e.target.value, currentPay);
                                handleFieldChange('perPaycheckContribution', dollarAmount);
                            }
                        }}
                        placeholder="5.0"
                        className="border-base-300 bg-base-100 text-base-content"
                    />
                ) : (
                    <CurrencyField
                        name="perPaycheckContribution"
                        value={formValues.perPaycheckContribution}
                        error={errors.perPaycheckContribution}
                        hint={currentPay > 0 ? `Approx. ${dollarToPercentage(formValues.perPaycheckContribution || 0, currentPay).toFixed(1)}% of paycheck` : getFieldHint('perPaycheckContribution')}
                        onChange={(e) => {
                            handleFieldChange('perPaycheckContribution', e.target.value);
                            if (currentPay > 0) {
                                const percentageAmount = dollarToPercentage(e.target.value, currentPay);
                                handleFieldChange('paycheckPercentage', percentageAmount);
                            }
                        }}
                        className="border-base-300 bg-base-100 text-base-content"
                    />
                )}
            </div>

            <CurrencyField
                label="Already Saved"
                name="alreadySaved"
                value={formValues.alreadySaved}
                onChange={(e) => setFieldValue('alreadySaved', e.target.value)}
                className="border-base-300 bg-base-100 text-base-content"
            />
        </div>
    );
};

const UnifiedCategoryForm = ({
    category = null,
    onSave,
    onCancel,
    accounts = [],
    currentPay = 0,
}) => {
    // Payee management - use localStorage fallback for build compatibility
    const [payees, setPayees] = useState(() => {
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
        } catch {
            return [
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
        }
    });

    const handleAddPayee = (newPayee) => {
        if (newPayee.trim() && !payees.includes(newPayee.trim())) {
            const updatedPayees = [...payees, newPayee.trim()];
            setPayees(updatedPayees);
            localStorage.setItem('budgetCalc_payees', JSON.stringify(updatedPayees));
        }
    };

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
        payee: category?.payee || '',

        // Timing configuration
        isRecurring: category?.isRecurring || false,

        // Account and status
        accountId: category?.accountId || (accounts[0]?.id || ''),
        status: category?.status || 'active',
        priority: category?.priority || 'medium',

        // Visual and advanced
        color: category?.color || 'bg-info/50',
        autoFunding: category?.autoFunding?.enabled || category?.autoFunding || false,
        description: category?.description || '',

        // Goal-specific fields
        targetAmount: category?.targetAmount || 0,
        targetDate: category?.targetDate || formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year from now
        perPaycheckContribution: category?.perPaycheckContribution || category?.monthlyContribution || 0, // Support legacy data
        alreadySaved: category?.alreadySaved || 0,

        // Scheduled transaction fields
        createScheduledTransactions: category?.createScheduledTransactions || false,
        scheduledEndCondition: category?.scheduledEndCondition || 'indefinite',
        scheduledEndDate: category?.scheduledEndDate || '',
        scheduledMaxOccurrences: category?.scheduledMaxOccurrences || 12,
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
                    isRecurring: values.isRecurring,
                });
            } else if (values.type === 'single' && values.planningType === 'goal') {
                onSave({
                    ...commonData,
                    planningType: 'goal',
                    targetAmount: parseFloat(values.targetAmount) || 0,
                    targetDate: values.targetDate,
                    perPaycheckContribution: parseFloat(values.perPaycheckContribution) || 0,
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
                errors.accountId = 'Account is required';
            }

            // Type-specific validations
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
        }
    });

    // Handle percentage/dollar conversion when switching modes
    useEffect(() => {
        if (currentPay > 0) {
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
        console.log('🔥 FORM SUBMIT - Starting handleSubmit');
        console.log('🔥 FORM VALUES:', form.values);
        console.log('🔥 SCHEDULED TRANSACTIONS CHECKBOX:', form.values.createScheduledTransactions);
        console.log('🔥 END CONDITION:', form.values.scheduledEndCondition);
        console.log('🔥 END DATE:', form.values.scheduledEndDate);
        console.log('🔥 MAX OCCURRENCES:', form.values.scheduledMaxOccurrences);

        // Trigger validation using the validate function directly
        const validateFunction = form.validate || ((values) => {
            const errors = {};

            // Common validations
            if (!values.name) {
                errors.name = 'Category name is required';
            }

            if (!values.accountId) {
                errors.accountId = 'Account is required';
            }

            // Type-specific validations
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
        });

        const errors = validateFunction(form.values);

        // If there are errors, don't submit
        if (Object.keys(errors).length > 0) {
            // Force form to show errors
            Object.keys(errors).forEach(key => {
                form.setFieldError(key, errors[key]);
            });
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
                payee: form.values.payee,
                isRecurring: form.values.isRecurring,
                // Scheduled transaction options
                createScheduledTransactions: form.values.createScheduledTransactions,
                endCondition: form.values.scheduledEndCondition,
                endDate: form.values.scheduledEndDate,
                maxOccurrences: form.values.scheduledMaxOccurrences,
            };

            console.log('🔥 CATEGORY DATA PREPARED:', categoryData);
            console.log('🔥 SCHEDULED TRANSACTION FIELDS IN CATEGORY DATA:');
            console.log('  - createScheduledTransactions:', categoryData.createScheduledTransactions);
            console.log('  - endCondition:', categoryData.endCondition);
            console.log('  - endDate:', categoryData.endDate);
            console.log('  - maxOccurrences:', categoryData.maxOccurrences);
        } else if (form.values.type === 'single' && form.values.planningType === 'goal') {
            categoryData = {
                ...commonData,
                planningType: 'goal',
                targetAmount: form.values.targetAmount || 0,
                targetDate: form.values.targetDate,
                perPaycheckContribution: form.values.perPaycheckContribution || 0,
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
        // Trigger validation using the validate function directly
        const validateFunction = form.validate || ((values) => {
            const errors = {};

            // Common validations
            if (!values.name) {
                errors.name = 'Category name is required';
            }

            if (!values.accountId) {
                errors.accountId = 'Account is required';
            }

            // Type-specific validations
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
        });

        const errors = validateFunction(form.values);

        // If there are errors, don't submit
        if (Object.keys(errors).length > 0) {
            // Force form to show errors
            Object.keys(errors).forEach(key => {
                form.setFieldError(key, errors[key]);
            });
            return;
        }

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
                perPaycheckContribution: parseFloat(form.values.perPaycheckContribution) || 0,
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
                color: 'neutral',
                autoFunding: false,
                description: '',
                // Goal fields
                targetAmount: '',
                targetDate: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
                perPaycheckContribution: '',
                alreadySaved: 0,
            };

            // Set all values at once to match initial state
            Object.keys(newInitialValues).forEach(key => {
                form.setFieldValue(key, newInitialValues[key]);
            });
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <Card skin="shadow" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-base-content">
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
                            error={form.errors.name}
                            className="border-base-300 bg-base-100 text-base-content"
                        />

                        {/* Category Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-base-content">Category Type</label>
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
                                <label className="block text-sm font-medium text-base-content">Planning Type</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="planningType"
                                            value="expense"
                                            checked={form.values.planningType === 'expense'}
                                            onChange={form.handleChange}
                                            className="form-radio h-4 w-4 text-info border-base-300 focus:border-primary mr-2"
                                        />
                                        <span className="text-base-content">💸 Expense</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="planningType"
                                            value="goal"
                                            checked={form.values.planningType === 'goal'}
                                            onChange={form.handleChange}
                                            className="form-radio h-4 w-4 text-info border-base-300 focus:border-primary mr-2"
                                        />
                                        <span className="text-base-content">🎯 Savings Goal</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Multiple Category Info */}
                        {form.values.type === 'multiple' && (
                            <div className="p-4 bg-base-200/50 border border-base-300 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-lg">📁</span>
                                    <h3 className="font-medium text-base-content">Multiple Items Category</h3>
                                </div>
                                <p className="text-sm text-base-content/60">
                                    This category will contain multiple budget items. The total amount needed per month and per paycheck will be calculated from the items you add to this category.
                                </p>
                            </div>
                        )}

                        {/* Expense-specific fields - Only show for single categories */}
                        {form.values.type === 'single' && form.values.planningType === 'expense' && (
                            <div className="space-y-4 p-4 bg-primary/20 bg-base-200 border border-primary rounded-lg">
                                <h3 className="font-medium text-info">Expense Configuration</h3>

                                {/* Amount Field - Always show */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Checkbox
                                            checked={form.values.usePercentage}
                                            onChange={(e) => form.setFieldValue('usePercentage', e.target.checked)}
                                        />
                                        <label className="text-sm font-medium text-base-content">
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
                                            className="border-base-300 bg-base-100 text-base-content"
                                        />
                                    ) : (
                                        <CurrencyField
                                            label="Amount"
                                            name="amount"
                                            value={form.values.amount}
                                            onChange={(e) => form.setFieldValue('amount', e.target.value)}
                                            error={form.errors.amount}
                                            className="border-base-300 bg-base-100 text-base-content"
                                        />
                                    )}
                                </div>

                                {/* Due Date - Always show */}
                                <Input
                                    label="Due Date (Optional)"
                                    name="dueDate"
                                    type="date"
                                    value={form.values.dueDate}
                                    onChange={form.handleChange}
                                    className="border-base-300 bg-base-100 text-base-content"
                                />

                                {/* Frequency - Always show */}
                                <Select
                                    label="Frequency"
                                    name="frequency"
                                    value={form.values.frequency}
                                    onChange={form.handleChange}
                                    className="border-base-300 bg-base-100 text-base-content"
                                >
                                    {frequencyOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>

                                {/* Scheduled Transactions Option - Only show if due date AND frequency are filled */}
                                {form.values.dueDate && form.values.frequency && (
                                    <div className="space-y-3 pt-4 border-t border-info">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
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
                                                    <PayeeAutocompleteinfo
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
                            </div>
                        )}

                        {/* Enhanced Goal-specific fields with auto-calculation */}
                        {form.values.type === 'single' && form.values.planningType === 'goal' && (
                            <EnhancedGoalFields
                                formValues={form.values}
                                setFieldValue={form.setFieldValue}
                                errors={form.errors}
                                currentPay={currentPay}
                            />
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
                                className="border-base-300 bg-base-100 text-base-content"
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
                                className="border-base-300 bg-base-100 text-base-content"
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
                                className="border-base-300 bg-base-100 text-base-content"
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>

                            <div>
                                <label className="block text-sm font-medium text-base-content mb-1">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map(option => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => form.setFieldValue('color', option.value)}
                                            className={`w-8 h-8 rounded-full border-2 ${form.values.color === option.value
                                                ? 'border-base-content'
                                                : 'border-base-300'
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
                                <label className="text-sm font-medium text-base-content">
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
                            className="border-base-300 bg-base-100 text-base-content"
                        />

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
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
