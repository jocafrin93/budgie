// src/components/budget/PaycheckManager.jsx
import React, { useRef, useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import { CurrencyField } from '../form';
import { Button } from '../ui/Button/index.jsx';
import { Card } from '../ui/Card/index.jsx';
import { Checkbox } from '../ui/Form/Checkbox.jsx';

/**
 * Component for managing multiple paychecks
 * Updated to use the new PaydayWorkflow approach and modern UI components
 */
const PaycheckManager = ({
    accounts = [],
}) => {
    const {
        paychecks,
        addPaycheck,
        updatePaycheck,
        deletePaycheck,
        togglePaycheckActive,
        getFrequencyOptions,
    } = usePaycheckManagement(accounts);

    // Ref for form container to enable auto-scroll
    const formRef = useRef(null);

    // Helper function to validate amount - handles both strings and numbers
    const validateAmount = (amount) => {
        // Convert string to number if needed
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (typeof numAmount !== 'number' || isNaN(numAmount)) return 0;
        return Math.min(Math.max(numAmount, 0), 100000);
    };

    // Helper function to format date for input fields
    const formatDateForInput = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to format date for display
    const formatDateForDisplay = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // State for editing/adding
    const [editingPaycheck, setEditingPaycheck] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formValues, setFormValues] = useState({
        name: '',
        frequency: 'biweekly',
        startDate: formatDateForInput(new Date()),
        baseAmount: 0,
        variableAmount: false,
        accountDistribution: [],
        useMultipleAccounts: false // New flag for distribution mode
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showDates] = useState(null);
    const [nextDates] = useState([]);

    // Frequency options
    const frequencyOptions = getFrequencyOptions();

    // Initialize edit form
    const handleEditPaycheck = (paycheck) => {
        setEditingPaycheck(paycheck.id);
        setShowAddForm(false);

        // Create account distribution if it doesn't exist
        let accountDist = [...(paycheck.accountDistribution || [])];
        if (accountDist.length === 0 && accounts.length > 0) {
            accountDist = [{
                accountId: accounts[0].id,
                amount: paycheck.baseAmount,
                distributionType: 'fixed',
                distributionValue: paycheck.baseAmount
            }];
        }

        setFormValues({
            name: paycheck.name || '',
            frequency: paycheck.frequency || 'biweekly',
            startDate: paycheck.startDate || formatDateForInput(new Date()),
            baseAmount: paycheck.baseAmount || 0,
            variableAmount: paycheck.variableAmount || false,
            accountDistribution: accountDist,
            useMultipleAccounts: accountDist.length > 1 // Set based on existing distribution
        });

        // Scroll to form after a brief delay to ensure it's rendered
        setTimeout(() => {
            formRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    // Initialize add form
    const handleAddNewPaycheck = () => {
        setEditingPaycheck(null);
        setShowAddForm(true);

        // Default distribution to first account if available
        let defaultDistribution = [];
        if (accounts.length > 0) {
            defaultDistribution = [{
                accountId: accounts[0].id,
                amount: 0,
                distributionType: 'fixed',
                distributionValue: 0
            }];
        }

        setFormValues({
            name: '',
            frequency: 'biweekly',
            startDate: formatDateForInput(new Date()),
            baseAmount: 0,
            variableAmount: false,
            accountDistribution: defaultDistribution,
            useMultipleAccounts: false // Default to single account mode
        });

        // Scroll to form after a brief delay to ensure it's rendered
        setTimeout(() => {
            formRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    // Handle distribution changes - properly convert strings to numbers
    const handleDistributionChange = (index, field, value) => {
        setFormValues(prev => {
            const newDistribution = [...prev.accountDistribution];
            if (field === 'accountId') {
                newDistribution[index] = { ...newDistribution[index], accountId: parseInt(value) };
            } else if (field === 'amount') {
                // Convert string value to number and validate
                const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                const validatedAmount = validateAmount(numericValue);
                newDistribution[index] = {
                    ...newDistribution[index],
                    amount: validatedAmount,
                    distributionValue: validatedAmount
                };
            }
            return { ...prev, accountDistribution: newDistribution };
        });
    };

    // Recalculate distribution amounts when base amount changes - handle CurrencyField event
    const handleBaseAmountChange = (e) => {
        // CurrencyField passes an event object with e.target.value as string
        const newAmount = e.target.value;
        const numericAmount = typeof newAmount === 'string' ? parseFloat(newAmount) || 0 : newAmount;
        const validatedAmount = validateAmount(numericAmount);

        setFormValues(prev => {
            let updatedDistribution;

            if (!prev.useMultipleAccounts) {
                // Single account mode - set full amount to the selected account
                updatedDistribution = prev.accountDistribution.map(dist => ({
                    ...dist,
                    amount: validatedAmount,
                    distributionValue: validatedAmount
                }));
            } else {
                // Multiple account mode - update distribution amounts proportionally
                const totalCurrentDistribution = prev.accountDistribution.reduce((sum, dist) => sum + (dist.amount || 0), 0);

                if (totalCurrentDistribution > 0) {
                    // Proportional update
                    updatedDistribution = prev.accountDistribution.map(dist => {
                        const proportion = dist.amount / totalCurrentDistribution;
                        const newAmount = proportion * validatedAmount;
                        return {
                            ...dist,
                            amount: newAmount,
                            distributionValue: newAmount
                        };
                    });
                } else {
                    // Equal distribution if no current distribution
                    const amountPerAccount = validatedAmount / Math.max(1, prev.accountDistribution.length);
                    updatedDistribution = prev.accountDistribution.map(dist => ({
                        ...dist,
                        amount: amountPerAccount,
                        distributionValue: amountPerAccount
                    }));
                }
            }

            return {
                ...prev,
                baseAmount: validatedAmount,
                accountDistribution: updatedDistribution
            };
        });
    };

    // Add account to distribution
    const handleAddAccount = () => {
        if (accounts.length === 0) return;

        // Find an account not already in distribution
        const usedAccountIds = formValues.accountDistribution.map(dist => dist.accountId);
        const availableAccount = accounts.find(acc => !usedAccountIds.includes(acc.id));

        if (availableAccount) {
            setFormValues(prev => {
                // Calculate amount for new account (split evenly with others)
                const newAmount = prev.baseAmount / (prev.accountDistribution.length + 1);

                // Adjust existing distribution amounts
                const updatedDistribution = prev.accountDistribution.map(dist => ({
                    ...dist,
                    amount: newAmount,
                    distributionValue: newAmount
                }));

                // Add new account
                updatedDistribution.push({
                    accountId: availableAccount.id,
                    amount: newAmount,
                    distributionType: 'fixed',
                    distributionValue: newAmount
                });

                return {
                    ...prev,
                    accountDistribution: updatedDistribution
                };
            });
        }
    };

    // Remove account from distribution
    const handleRemoveAccount = (index) => {
        setFormValues(prev => {
            if (prev.accountDistribution.length <= 1) return prev;

            const updatedDistribution = [...prev.accountDistribution];
            const removedAmount = parseFloat(updatedDistribution[index].amount) || 0;
            updatedDistribution.splice(index, 1);

            // Redistribute the removed amount among remaining accounts
            const perAccountIncrease = removedAmount / updatedDistribution.length;
            updatedDistribution.forEach(dist => {
                dist.amount = (parseFloat(dist.amount) || 0) + perAccountIncrease;
                dist.distributionValue = dist.amount;
            });

            return {
                ...prev,
                accountDistribution: updatedDistribution
            };
        });
    };

    // Validation helper functions
    const getTotalDistribution = () => {
        return formValues.accountDistribution.reduce((sum, dist) => sum + (validateAmount(dist.amount) || 0), 0);
    };

    const getDistributionValidation = () => {
        const baseAmount = validateAmount(formValues.baseAmount);
        const totalDistribution = getTotalDistribution();
        const difference = totalDistribution - baseAmount;

        return {
            isValid: Math.abs(difference) < 0.01, // Allow for small floating point differences
            isOver: difference > 0.01,
            isUnder: difference < -0.01,
            difference: Math.abs(difference),
            totalDistribution,
            baseAmount
        };
    };

    // Save paycheck (add or edit) - ensure proper number conversion
    const handleSavePaycheck = () => {
        // Convert and validate form values
        const baseAmount = validateAmount(formValues.baseAmount);

        // Validate form
        if (!formValues.name || baseAmount <= 0) {
            alert('Please provide a name and valid amount for the paycheck.');
            return;
        }

        // Ensure each account has a valid amount
        const invalidDistribution = formValues.accountDistribution.some(dist => {
            const amount = validateAmount(dist.amount);
            return !dist.accountId || amount <= 0;
        });

        if (invalidDistribution) {
            alert('Please ensure all accounts have valid distribution amounts.');
            return;
        }

        // Validate distribution total (only for multiple account mode)
        if (formValues.useMultipleAccounts) {
            const validation = getDistributionValidation();
            if (!validation.isValid) {
                if (validation.isOver) {
                    alert(`Distribution total (${formatCurrency(validation.totalDistribution)}) exceeds base amount (${formatCurrency(validation.baseAmount)}) by ${formatCurrency(validation.difference)}. Please adjust the distribution amounts.`);
                } else {
                    alert(`Distribution total (${formatCurrency(validation.totalDistribution)}) is less than base amount (${formatCurrency(validation.baseAmount)}) by ${formatCurrency(validation.difference)}. Please adjust the distribution amounts.`);
                }
                return;
            }
        }

        // Prepare the data with proper number conversion
        const paycheckData = {
            ...formValues,
            baseAmount: baseAmount,
            accountDistribution: formValues.accountDistribution.map(dist => ({
                ...dist,
                amount: validateAmount(dist.amount),
                distributionValue: validateAmount(dist.distributionValue || dist.amount)
            }))
        };

        if (editingPaycheck) {
            // Update existing paycheck
            updatePaycheck(editingPaycheck, paycheckData);
            setEditingPaycheck(null);
        } else if (showAddForm) {
            // Add new paycheck
            addPaycheck(paycheckData);
            setShowAddForm(false);
        }

        // Reset form
        setFormValues({
            name: '',
            frequency: 'biweekly',
            startDate: formatDateForInput(new Date()),
            baseAmount: 0,
            variableAmount: false,
            accountDistribution: []
        });
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (paycheckId) => {
        if (deletePaycheck(paycheckId)) {
            setShowDeleteConfirm(null);
        } else {
            alert('Cannot delete the only paycheck. You must have at least one paycheck configured.');
        }
    };


    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get account name by ID with safety checks
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : `⚠️ Deleted Account (ID: ${accountId})`;
    };

    // Validate and clean paycheck account references
    const validatePaycheckAccounts = (paycheck) => {
        if (!paycheck.accountDistribution || paycheck.accountDistribution.length === 0) {
            return false;
        }

        // Check if any referenced accounts no longer exist
        const hasInvalidAccounts = paycheck.accountDistribution.some(dist =>
            !accounts.find(acc => acc.id === dist.accountId)
        );

        return !hasInvalidAccounts;
    };

    // Clean up orphaned account references in paychecks
    const cleanupOrphanedReferences = () => {
        const needsCleanup = paychecks.some(paycheck => !validatePaycheckAccounts(paycheck));

        if (needsCleanup && accounts.length > 0) {
            const cleanedPaychecks = paychecks.map(paycheck => {
                if (!validatePaycheckAccounts(paycheck)) {
                    console.warn(`Cleaning up orphaned account references in paycheck: ${paycheck.name}`);

                    // Filter out invalid account references
                    const validDistributions = paycheck.accountDistribution.filter(dist =>
                        accounts.find(acc => acc.id === dist.accountId)
                    );

                    // If no valid distributions remain, create one with the first available account
                    if (validDistributions.length === 0) {
                        return {
                            ...paycheck,
                            accountDistribution: [{
                                accountId: accounts[0].id,
                                amount: paycheck.baseAmount,
                                distributionType: 'fixed',
                                distributionValue: paycheck.baseAmount
                            }],
                            useMultipleAccounts: false // Reset to single account mode
                        };
                    }

                    // If some valid distributions remain, redistribute the total amount
                    const totalValidAmount = validDistributions.reduce((sum, dist) => sum + (dist.amount || 0), 0);
                    const redistributionRatio = paycheck.baseAmount / Math.max(totalValidAmount, 1);

                    const redistributedDistributions = validDistributions.map(dist => ({
                        ...dist,
                        amount: dist.amount * redistributionRatio,
                        distributionValue: dist.amount * redistributionRatio
                    }));

                    return {
                        ...paycheck,
                        accountDistribution: redistributedDistributions,
                        useMultipleAccounts: redistributedDistributions.length > 1
                    };
                }
                return paycheck;
            });

            // Update paychecks with cleaned data - need to use setPaychecks directly
            // since updatePaycheck is for individual paycheck updates
            cleanedPaychecks.forEach(cleanedPaycheck => {
                updatePaycheck(cleanedPaycheck.id, cleanedPaycheck);
            });
        }
    };

    // Run cleanup when accounts change
    React.useEffect(() => {
        if (accounts.length > 0) {
            cleanupOrphanedReferences();
        }
    }, [accounts]);

    return (
        <Card className="p-6 bg-base-300">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-base-content">Paychecks</h3>
                    <p className="text-sm text-base-content/60">
                        Configure your paychecks to plan your budget. Add multiple paychecks if you have more than one income source.
                    </p>
                </div>

                {/* Start Payday Workflow Button */}

            </div>

            {/* Paycheck List */}
            {paychecks.length === 0 ? (
                <div className="p-4 bg-base-200 rounded text-center">
                    <p className="text-base-content/60">
                        No paychecks configured yet. Add your first paycheck to get started.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paychecks.map(paycheck => (
                        <div
                            key={paycheck.id}
                            className={`p-4 border rounded-lg ${paycheck.isActive ?
                                'bg-primary-200 border-primary-300' :
                                'bg-base-200 border-base-300'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base-content">{paycheck.name}</h4>
                                    <div className="text-sm mt-1">
                                        <span className="text-base-content/60">
                                            {frequencyOptions.find(f => f.value === paycheck.frequency)?.label || 'Custom'} •
                                            {paycheck.variableAmount ? ' Variable Amount' : ` ${formatCurrency(paycheck.baseAmount)}`}
                                        </span>
                                    </div>

                                    {/* Account Distribution */}
                                    <div className="mt-2 space-y-1">
                                        {paycheck.accountDistribution?.map((dist, idx) => (
                                            <div key={idx} className="text-xs flex justify-between">
                                                <span className="text-base-content/60">{getAccountName(dist.accountId)}</span>
                                                <span className="font-medium text-base-content">{formatCurrency(dist.amount)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Next Paycheck Dates */}
                                    {showDates === paycheck.id && (
                                        <div className="mt-3 p-2 bg-info/10 rounded text-xs">
                                            <div className="font-medium mb-1 text-base-content">Next Paycheck Dates:</div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                {nextDates.map((date, idx) => (
                                                    <div key={idx} className="text-base-content/60">
                                                        {formatDateForDisplay(date)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-2">

                                    <button
                                        onClick={() => togglePaycheckActive(paycheck.id)}
                                        className="btn btn-ghost btn-xs"
                                        title={paycheck.isActive ? "Disable paycheck" : "Enable paycheck"}
                                    >
                                        {paycheck.isActive ? '✅' : '❌'}
                                    </button>
                                    <button
                                        onClick={() => handleEditPaycheck(paycheck)}
                                        className="btn btn-ghost btn-xs"
                                        title="Edit paycheck"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(paycheck.id)}
                                        className="btn btn-ghost btn-xs"
                                        title="Delete paycheck"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === paycheck.id && (
                                <div className="mt-3 p-2 bg-error/10 border border-error/30 rounded">
                                    <p className="text-sm text-error mb-2">
                                        Are you sure you want to delete this paycheck? This action cannot be undone.
                                    </p>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            variant="outlined"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteConfirm(paycheck.id)}
                                            color="error"
                                            variant="filled"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Paycheck Button */}
            <div className="mt-4">
                <Button
                    onClick={handleAddNewPaycheck}
                    color="primary"
                    variant="filled"
                    className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-start"

                >
                    + Add New Paycheck

                </Button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingPaycheck) && (
                <div ref={formRef} className="mt-6 p-6 bg-base-200 rounded-lg border border-base-300">
                    <h4 className="text-lg font-semibold mb-4 text-base-content">
                        {editingPaycheck ? 'Edit Paycheck' : 'Add New Paycheck'}
                    </h4>

                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-base-content">Name</label>
                                <input
                                    type="text"
                                    value={formValues.name}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Main Job, Side Gig"
                                    className="w-full p-2 border border-base-300 rounded bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-base-content">Frequency</label>
                                <select
                                    value={formValues.frequency}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="w-full p-2 border border-base-300 rounded bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                >
                                    {frequencyOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-base-content">Start Date</label>
                                <input
                                    type="date"
                                    value={formValues.startDate}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full p-2 border border-base-300 rounded bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-base-content">Base Amount</label>
                                <CurrencyField
                                    value={formValues.baseAmount}
                                    onChange={handleBaseAmountChange}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Variable Amount Option */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                color="info"
                                className="rounded-full"
                                type="checkbox"
                                id="variableAmount"
                                checked={formValues.variableAmount}
                                onChange={(e) => setFormValues(prev => ({ ...prev, variableAmount: e.target.checked }))}
                            />
                            <label htmlFor="variableAmount" className="text-sm text-base-content">
                                This paycheck has a variable amount (will track history for averaging)
                            </label>
                        </div>

                        {/* Account Distribution */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-base-content">Account Distribution</label>
                                {accounts.length > 1 && (
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            color="info"
                                            className="rounded-full"
                                            type="checkbox"
                                            id="useMultipleAccounts"
                                            checked={formValues.useMultipleAccounts}
                                            onChange={(e) => {
                                                const useMultiple = e.target.checked;
                                                setFormValues(prev => {
                                                    if (useMultiple) {
                                                        // Switch to multiple account mode - keep existing distribution
                                                        return { ...prev, useMultipleAccounts: true };
                                                    } else {
                                                        // Switch to single account mode - use first account with full amount
                                                        const singleDistribution = [{
                                                            accountId: prev.accountDistribution[0]?.accountId || accounts[0].id,
                                                            amount: prev.baseAmount,
                                                            distributionType: 'fixed',
                                                            distributionValue: prev.baseAmount
                                                        }];
                                                        return {
                                                            ...prev,
                                                            useMultipleAccounts: false,
                                                            accountDistribution: singleDistribution
                                                        };
                                                    }
                                                });
                                            }}
                                        />
                                        <label htmlFor="useMultipleAccounts" className="text-sm text-base-content">
                                            Split across multiple accounts
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Single Account Mode */}
                            {!formValues.useMultipleAccounts && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium mb-1 text-base-content/60">Account</label>
                                            <select
                                                value={formValues.accountDistribution[0]?.accountId || ''}
                                                onChange={(e) => {
                                                    const accountId = parseInt(e.target.value);
                                                    setFormValues(prev => ({
                                                        ...prev,
                                                        accountDistribution: [{
                                                            accountId: accountId,
                                                            amount: prev.baseAmount,
                                                            distributionType: 'fixed',
                                                            distributionValue: prev.baseAmount
                                                        }]
                                                    }));
                                                }}
                                                className="w-full p-2 border border-base-300 rounded bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                            >
                                                {accounts.map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium mb-1 text-base-content/60">Amount</label>
                                            <div className="p-2 bg-base-200 border border-base-300 rounded text-base-content">
                                                {formatCurrency(formValues.baseAmount)} (Full Amount)
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-base-content/60 mt-2">
                                        💡 The full paycheck amount will go to the selected account. Enable &quot;Split across multiple accounts&quot; above to customize distribution.
                                    </p>
                                </div>
                            )}

                            {/* Multiple Account Mode */}
                            {formValues.useMultipleAccounts && (
                                <>
                                    <div className="space-y-2">
                                        {formValues.accountDistribution.map((dist, index) => {
                                            const validation = getDistributionValidation();
                                            const hasValidationError = !validation.isValid && formValues.baseAmount > 0;

                                            return (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <select
                                                            value={dist.accountId}
                                                            onChange={(e) => handleDistributionChange(index, 'accountId', e.target.value)}
                                                            className="w-full p-2 border border-base-300 rounded bg-base-100 text-base-content focus:outline-none focus:border-primary"
                                                        >
                                                            {accounts.map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="flex-1">
                                                        <CurrencyField
                                                            value={dist.amount}
                                                            onChange={(e) => handleDistributionChange(index, 'amount', e.target.value)}
                                                            placeholder="0.00"
                                                            className={hasValidationError ?
                                                                "border-error focus:border-primary" :
                                                                ""
                                                            }
                                                        />
                                                    </div>

                                                    {formValues.accountDistribution.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveAccount(index)}
                                                            className="btn btn-ghost btn-xs text-error"
                                                            title="Remove account"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Account Button */}
                                    {formValues.accountDistribution.length < accounts.length && (
                                        <button
                                            onClick={handleAddAccount}
                                            className="btn btn-ghost btn-sm text-info mt-2"
                                        >
                                            + Add Another Account
                                        </button>
                                    )}

                                    {/* Distribution Validation Summary */}
                                    {formValues.baseAmount > 0 && formValues.accountDistribution.length > 0 && (() => {
                                        const validation = getDistributionValidation();
                                        const totalDistribution = getTotalDistribution();

                                        return (
                                            <div className={`mt-3 p-3 rounded-lg border ${validation.isValid
                                                ? 'bg-success/10 border-success/30'
                                                : validation.isOver
                                                    ? 'bg-error/10 border-error/30'
                                                    : 'bg-warning/10 border-warning/30'
                                                }`}>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className={`font-medium ${validation.isValid
                                                        ? 'text-success'
                                                        : validation.isOver
                                                            ? 'text-error'
                                                            : 'text-warning'
                                                        }`}>
                                                        Distribution Total:
                                                    </span>
                                                    <span className={`font-bold ${validation.isValid
                                                        ? 'text-success'
                                                        : validation.isOver
                                                            ? 'text-error'
                                                            : 'text-warning'
                                                        }`}>
                                                        {formatCurrency(totalDistribution)}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center text-sm mt-1">
                                                    <span className="text-base-content/60">Base Amount:</span>
                                                    <span className="text-base-content text-base-content">{formatCurrency(validation.baseAmount)}</span>
                                                </div>

                                                {!validation.isValid && (
                                                    <div className={`text-xs mt-2 ${validation.isOver
                                                        ? 'text-error'
                                                        : 'text-warning'
                                                        }`}>
                                                        {validation.isOver
                                                            ? `⚠️ Over by ${formatCurrency(validation.difference)}`
                                                            : `⚠️ Under by ${formatCurrency(validation.difference)}`
                                                        }
                                                    </div>
                                                )}

                                                {validation.isValid && (
                                                    <div className="text-xs mt-2 text-success">
                                                        ✅ Distribution matches base amount
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                onClick={() => {
                                    setEditingPaycheck(null);
                                    setShowAddForm(false);
                                    setFormValues({
                                        name: '',
                                        frequency: 'biweekly',
                                        startDate: formatDateForInput(new Date()),
                                        baseAmount: 0,
                                        variableAmount: false,
                                        accountDistribution: []
                                    });
                                }}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSavePaycheck}
                                color="primary"
                                variant="filled"
                            >
                                {editingPaycheck ? 'Update Paycheck' : 'Add Paycheck'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PaycheckManager;
