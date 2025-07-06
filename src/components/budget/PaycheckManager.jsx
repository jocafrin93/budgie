// src/components/budget/PaycheckManager.jsx
import { useState } from 'react';
import { usePaycheckManagement } from '../../hooks/usePaycheckManagement';
import { CurrencyField } from '../form';
import { Button } from '../ui/Button/index.jsx';
import { Card } from '../ui/Card/index.jsx';

/**
 * Component for managing multiple paychecks
 * Updated to use the new PaydayWorkflow approach and modern UI components
 */
const PaycheckManager = ({
    accounts = [],
    onStartPaydayWorkflow // Callback to start the payday workflow
}) => {
    const {
        paychecks,
        addPaycheck,
        updatePaycheck,
        deletePaycheck,
        togglePaycheckActive,
        getFrequencyOptions,
        generatePaycheckDates
    } = usePaycheckManagement(accounts);

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
        accountDistribution: []
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showDates, setShowDates] = useState(null);
    const [nextDates, setNextDates] = useState([]);

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
            accountDistribution: accountDist
        });
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
            accountDistribution: defaultDistribution
        });
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

    // Recalculate distribution amounts when base amount changes - handle string input
    const handleBaseAmountChange = (newAmount) => {
        // Convert string to number if needed
        const numericAmount = typeof newAmount === 'string' ? parseFloat(newAmount) || 0 : newAmount;
        const validatedAmount = validateAmount(numericAmount);

        setFormValues(prev => {
            // Update distribution amounts proportionally
            const totalCurrentDistribution = prev.accountDistribution.reduce((sum, dist) => sum + (dist.amount || 0), 0);

            let updatedDistribution;
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

    // Show next paycheck dates
    const handleShowDates = (paycheckId) => {
        if (showDates === paycheckId) {
            setShowDates(null);
            setNextDates([]);
        } else {
            setShowDates(paycheckId);
            setNextDates(generatePaycheckDates(paycheckId, 6));
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

    // Get account name by ID
    const getAccountName = (accountId) => {
        const account = accounts.find(acc => acc.id === accountId);
        return account ? account.name : 'Unknown Account';
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-dark-50">Paychecks</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-300">
                        Configure your paychecks to plan your budget. Add multiple paychecks if you have more than one income source.
                    </p>
                </div>

                {/* Start Payday Workflow Button */}
                {onStartPaydayWorkflow && (
                    <Button
                        onClick={onStartPaydayWorkflow}
                        color="success"
                        variant="filled"
                        className="flex items-center gap-2"
                    >
                        💰 Start Payday Workflow
                    </Button>
                )}
            </div>

            {/* Paycheck List */}
            {paychecks.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-dark-600 rounded text-center">
                    <p className="text-gray-600 dark:text-dark-300">
                        No paychecks configured yet. Add your first paycheck to get started.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paychecks.map(paycheck => (
                        <div
                            key={paycheck.id}
                            className={`p-4 border rounded-lg ${paycheck.isActive ?
                                'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                'bg-gray-100 dark:bg-dark-600 border-gray-300 dark:border-dark-500'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-dark-50">{paycheck.name}</h4>
                                    <div className="text-sm mt-1">
                                        <span className="text-gray-600 dark:text-dark-300">
                                            {frequencyOptions.find(f => f.value === paycheck.frequency)?.label || 'Custom'} •
                                            {paycheck.variableAmount ? ' Variable Amount' : ` ${formatCurrency(paycheck.baseAmount)}`}
                                        </span>
                                    </div>

                                    {/* Account Distribution */}
                                    <div className="mt-2 space-y-1">
                                        {paycheck.accountDistribution?.map((dist, idx) => (
                                            <div key={idx} className="text-xs flex justify-between">
                                                <span className="text-gray-600 dark:text-dark-300">{getAccountName(dist.accountId)}</span>
                                                <span className="font-medium text-gray-900 dark:text-dark-50">{formatCurrency(dist.amount)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Next Paycheck Dates */}
                                    {showDates === paycheck.id && (
                                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                            <div className="font-medium mb-1 text-gray-900 dark:text-dark-50">Next Paycheck Dates:</div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                {nextDates.map((date, idx) => (
                                                    <div key={idx} className="text-gray-600 dark:text-dark-300">
                                                        {formatDateForDisplay(date)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleShowDates(paycheck.id)}
                                        className="p-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                        title="Show next paycheck dates"
                                    >
                                        📅
                                    </button>
                                    <button
                                        onClick={() => togglePaycheckActive(paycheck.id)}
                                        className="p-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                        title={paycheck.isActive ? "Disable paycheck" : "Enable paycheck"}
                                    >
                                        {paycheck.isActive ? '✅' : '❌'}
                                    </button>
                                    <button
                                        onClick={() => handleEditPaycheck(paycheck)}
                                        className="p-1 text-xs rounded hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                        title="Edit paycheck"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(paycheck.id)}
                                        className="p-1 text-xs rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                                        title="Delete paycheck"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm === paycheck.id && (
                                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
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
                >
                    + Add New Paycheck
                </Button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingPaycheck) && (
                <div className="mt-6 p-6 bg-gray-50 dark:bg-dark-600 rounded-lg border border-gray-200 dark:border-dark-500">
                    <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-50">
                        {editingPaycheck ? 'Edit Paycheck' : 'Add New Paycheck'}
                    </h4>

                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-dark-50">Name</label>
                                <input
                                    type="text"
                                    value={formValues.name}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Main Job, Side Gig"
                                    className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-dark-50">Frequency</label>
                                <select
                                    value={formValues.frequency}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-dark-50">Start Date</label>
                                <input
                                    type="date"
                                    value={formValues.startDate}
                                    onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-dark-50">Base Amount</label>
                                <CurrencyField
                                    value={formValues.baseAmount}
                                    onChange={handleBaseAmountChange}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Variable Amount Option */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="variableAmount"
                                checked={formValues.variableAmount}
                                onChange={(e) => setFormValues(prev => ({ ...prev, variableAmount: e.target.checked }))}
                                className="rounded border-gray-300 dark:border-dark-500"
                            />
                            <label htmlFor="variableAmount" className="text-sm text-gray-900 dark:text-dark-50">
                                This paycheck has a variable amount (will track history for averaging)
                            </label>
                        </div>

                        {/* Account Distribution */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-gray-900 dark:text-dark-50">Account Distribution</label>
                                {formValues.accountDistribution.length < accounts.length && (
                                    <button
                                        onClick={handleAddAccount}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    >
                                        + Add Account
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {formValues.accountDistribution.map((dist, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <select
                                                value={dist.accountId}
                                                onChange={(e) => handleDistributionChange(index, 'accountId', e.target.value)}
                                                className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                onChange={(value) => handleDistributionChange(index, 'amount', value)}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {formValues.accountDistribution.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveAccount(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remove account"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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
