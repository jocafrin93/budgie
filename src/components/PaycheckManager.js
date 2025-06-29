// src/components/PaycheckManager.js
import { format } from 'date-fns';
import { useState } from 'react';
import { usePaycheckManagement } from '../hooks/usePaycheckManagement';

/**
 * Component for managing multiple paychecks
 * Updated to use the new PaydayWorkflow approach
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

  // Helper function to validate amount
  const validateAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 0;
    return Math.min(Math.max(amount, 0), 100000);
  };

  // State for editing/adding
  const [editingPaycheck, setEditingPaycheck] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    frequency: 'biweekly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
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
      startDate: paycheck.startDate || format(new Date(), 'yyyy-MM-dd'),
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
      startDate: format(new Date(), 'yyyy-MM-dd'),
      baseAmount: 0,
      variableAmount: false,
      accountDistribution: defaultDistribution
    });
  };

  // Handle distribution changes
  const handleDistributionChange = (index, field, value) => {
    setFormValues(prev => {
      const newDistribution = [...prev.accountDistribution];
      if (field === 'accountId') {
        newDistribution[index] = { ...newDistribution[index], accountId: parseInt(value) };
      } else if (field === 'amount') {
        const validatedAmount = validateAmount(parseFloat(value) || 0);
        newDistribution[index] = {
          ...newDistribution[index],
          amount: validatedAmount,
          distributionValue: validatedAmount
        };
      }
      return { ...prev, accountDistribution: newDistribution };
    });
  };

  // Recalculate distribution amounts when base amount changes
  const handleBaseAmountChange = (newAmount) => {
    const validatedAmount = validateAmount(newAmount);

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

  // Save paycheck (add or edit)
  const handleSavePaycheck = () => {
    // Validate form
    if (!formValues.name || formValues.baseAmount <= 0) {
      alert('Please provide a name and valid amount for the paycheck.');
      return;
    }

    // Ensure each account has an amount
    const invalidDistribution = formValues.accountDistribution.some(dist =>
      !dist.accountId || (parseFloat(dist.amount) || 0) <= 0
    );

    if (invalidDistribution) {
      alert('Please ensure all accounts have valid distribution amounts.');
      return;
    }

    if (editingPaycheck) {
      // Update existing paycheck
      updatePaycheck(editingPaycheck, formValues);
      setEditingPaycheck(null);
    } else if (showAddForm) {
      // Add new paycheck
      addPaycheck(formValues);
      setShowAddForm(false);
    }

    // Reset form
    setFormValues({
      name: '',
      frequency: 'biweekly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
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
    <div className="paycheck-manager">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-bold mb-2 text-theme-text">Paychecks</h3>
            <p className="text-sm text-theme-secondary">
              Configure your paychecks to plan your budget. Add multiple paychecks if you have more than one income source.
            </p>
          </div>

          {/* Start Payday Workflow Button */}
          <button
            onClick={() => onStartPaydayWorkflow && onStartPaydayWorkflow()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            💰 Start Payday Workflow
          </button>
        </div>

        {/* Paycheck List */}
        {paychecks.length === 0 ? (
          <div className="p-4 bg-theme-secondary bg-opacity-10 rounded text-center">
            No paychecks configured yet. Add your first paycheck to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {paychecks.map(paycheck => (
              <div
                key={paycheck.id}
                className={`p-4 border rounded-lg ${paycheck.isActive ?
                  'bg-theme-primary bg-opacity-5 border-theme-primary' : 'bg-gray-100 border-gray-300'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-theme-text">{paycheck.name}</h4>
                    <div className="text-sm mt-1">
                      <span className="text-theme-secondary">
                        {frequencyOptions.find(f => f.value === paycheck.frequency)?.label || 'Custom'} •
                        {paycheck.variableAmount ? ' Variable Amount' : ` ${formatCurrency(paycheck.baseAmount)}`}
                      </span>
                    </div>

                    {/* Account Distribution */}
                    <div className="mt-2 space-y-1">
                      {paycheck.accountDistribution?.map((dist, idx) => (
                        <div key={idx} className="text-xs flex justify-between">
                          <span className="text-theme-secondary">{getAccountName(dist.accountId)}</span>
                          <span className="font-medium text-theme-text">{formatCurrency(dist.amount)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Next Paycheck Dates */}
                    {showDates === paycheck.id && (
                      <div className="mt-3 p-2 bg-theme-primary bg-opacity-5 rounded text-xs">
                        <div className="font-medium mb-1 text-theme-text">Next Paycheck Dates:</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {nextDates.map((date, idx) => (
                            <div key={idx} className="text-theme-secondary">
                              {format(date, 'MMM d, yyyy')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleShowDates(paycheck.id)}
                      className="p-1 text-xs rounded hover:bg-theme-primary hover:bg-opacity-10"
                      title="Show next paycheck dates"
                    >
                      📅
                    </button>
                    <button
                      onClick={() => togglePaycheckActive(paycheck.id)}
                      className="p-1 text-xs rounded hover:bg-theme-primary hover:bg-opacity-10"
                      title={paycheck.isActive ? "Disable paycheck" : "Enable paycheck"}
                    >
                      {paycheck.isActive ? '✅' : '❌'}
                    </button>
                    <button
                      onClick={() => handleEditPaycheck(paycheck)}
                      className="p-1 text-xs rounded hover:bg-theme-primary hover:bg-opacity-10"
                      title="Edit paycheck"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(paycheck.id)}
                      className="p-1 text-xs rounded hover:bg-red-500 hover:bg-opacity-10"
                      title="Delete paycheck"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === paycheck.id && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600 mb-2">
                      Are you sure you want to delete this paycheck? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(paycheck.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Paycheck Button */}
        <div className="mt-4">
          <button
            onClick={handleAddNewPaycheck}
            className="px-4 py-2 bg-theme-primary text-white rounded hover:bg-theme-primary-dark transition-colors"
          >
            + Add New Paycheck
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingPaycheck) && (
          <div className="mt-6 p-6 bg-theme-secondary bg-opacity-10 rounded-lg border border-theme-border">
            <h4 className="text-lg font-semibold mb-4 text-theme-text">
              {editingPaycheck ? 'Edit Paycheck' : 'Add New Paycheck'}
            </h4>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-text">Name</label>
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) => setFormValues(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main Job, Side Gig"
                    className="w-full p-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-text">Frequency</label>
                  <select
                    value={formValues.frequency}
                    onChange={(e) => setFormValues(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full p-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
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
                  <label className="block text-sm font-medium mb-1 text-theme-text">Start Date</label>
                  <input
                    type="date"
                    value={formValues.startDate}
                    onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-theme-text">Base Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-theme-secondary">$</span>
                    <input
                      type="number"
                      value={formValues.baseAmount}
                      onChange={(e) => handleBaseAmountChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Variable Amount Option */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="variableAmount"
                  checked={formValues.variableAmount}
                  onChange={(e) => setFormValues(prev => ({ ...prev, variableAmount: e.target.checked }))}
                  className="rounded border-theme-border"
                />
                <label htmlFor="variableAmount" className="text-sm text-theme-text">
                  This paycheck has a variable amount (will track history for averaging)
                </label>
              </div>

              {/* Account Distribution */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-theme-text">Account Distribution</label>
                  {formValues.accountDistribution.length < accounts.length && (
                    <button
                      onClick={handleAddAccount}
                      className="text-sm text-theme-primary hover:text-theme-primary-dark"
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
                          className="w-full p-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                        >
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-theme-secondary text-sm">$</span>
                          <input
                            type="number"
                            value={dist.amount}
                            onChange={(e) => handleDistributionChange(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full pl-8 pr-3 py-2 border border-theme-border rounded bg-theme-surface text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary"
                          />
                        </div>
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
                <button
                  onClick={() => {
                    setEditingPaycheck(null);
                    setShowAddForm(false);
                    setFormValues({
                      name: '',
                      frequency: 'biweekly',
                      startDate: format(new Date(), 'yyyy-MM-dd'),
                      baseAmount: 0,
                      variableAmount: false,
                      accountDistribution: []
                    });
                  }}
                  className="px-4 py-2 border border-theme-border text-theme-text rounded hover:bg-theme-secondary hover:bg-opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaycheck}
                  className="px-6 py-2 bg-theme-primary text-white rounded hover:bg-theme-primary-dark transition-colors"
                >
                  {editingPaycheck ? 'Update Paycheck' : 'Add Paycheck'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaycheckManager;