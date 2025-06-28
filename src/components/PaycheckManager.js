// src/components/PaycheckManager.js
import { format } from 'date-fns';
import { useState } from 'react';
import { usePaycheckManagement } from '../hooks/usePaycheckManagement';

/**
 * Component for managing multiple paychecks
 */
const PaycheckManager = ({
  accounts = [],
  onPaycheckReceived // Callback when a paycheck is received to trigger allocation workflow
}) => {
  const {
    paychecks,
    addPaycheck,
    updatePaycheck,
    deletePaycheck,
    togglePaycheckActive,
    recordPaycheckReceived,
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
  const [showReceiveForm, setShowReceiveForm] = useState(null);
  const [receiveFormValues, setReceiveFormValues] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: 0,
    notes: ''
  });

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

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormValues(prev => {
      const updated = { ...prev, [field]: value };

      // Update account distribution amounts when baseAmount changes
      if (field === 'baseAmount') {
        const numValue = parseFloat(value) || 0;

        // For single account distribution, set to full amount
        if (updated.accountDistribution.length === 1) {
          updated.accountDistribution = [{
            ...updated.accountDistribution[0],
            amount: numValue,
            distributionValue: numValue
          }];
        }
        // For multiple accounts, distribute proportionally
        else if (updated.accountDistribution.length > 1) {
          const totalAmount = prev.accountDistribution.reduce((sum, dist) => sum + (dist.amount || 0), 0) || 1;
          updated.accountDistribution = prev.accountDistribution.map(dist => {
            const proportion = totalAmount > 0 ? (dist.amount || 0) / totalAmount : 1 / prev.accountDistribution.length;
            return {
              ...dist,
              amount: Math.round((numValue * proportion) * 100) / 100,
              distributionValue: Math.round((numValue * proportion) * 100) / 100
            };
          });
        }
      }

      return updated;
    });
  };

  // Handle distribution changes
  const handleDistributionChange = (index, field, value) => {
    setFormValues(prev => {
      const updatedDistribution = [...prev.accountDistribution];
      updatedDistribution[index] = { ...updatedDistribution[index], [field]: value };

      // If amount is updated, update the distribution value too
      if (field === 'amount') {
        updatedDistribution[index].distributionValue = value;
      }

      // Recalculate baseAmount based on all distributions
      const newBaseAmount = updatedDistribution.reduce((sum, dist) => sum + (parseFloat(dist.amount) || 0), 0);

      return {
        ...prev,
        accountDistribution: updatedDistribution,
        baseAmount: newBaseAmount
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
        <h3 className="text-lg font-bold mb-2">Paychecks</h3>
        <p className="text-sm text-theme-secondary mb-4">
          Configure your paychecks to plan your budget. Add multiple paychecks if you have more than one income source.
        </p>

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
                className={`p-4 border rounded-lg ${paycheck.isActive ? 'bg-theme-primary bg-opacity-5 border-theme-primary' : 'bg-gray-100 border-gray-300'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{paycheck.name}</h4>
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
                          <span>{getAccountName(dist.accountId)}</span>
                          <span className="font-medium">{formatCurrency(dist.amount)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Next Paycheck Dates */}
                    {showDates === paycheck.id && (
                      <div className="mt-3 p-2 bg-theme-primary bg-opacity-5 rounded text-xs">
                        <div className="font-medium mb-1">Next Paycheck Dates:</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {nextDates.map((date, idx) => (
                            <div key={idx}>
                              {format(date, 'MMM d, yyyy')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowReceiveForm(paycheck.id);
                        setReceiveFormValues({
                          date: format(new Date(), 'yyyy-MM-dd'),
                          amount: paycheck.baseAmount,
                          notes: ''
                        });
                      }}
                      className="p-1 text-xs rounded hover:bg-green-500 hover:bg-opacity-10"
                      title="Record received paycheck"
                    >
                      💰
                    </button>
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

                {/* Record Received Paycheck Form */}
                {showReceiveForm === paycheck.id && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <h5 className="font-medium mb-2">Record Received Paycheck</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Date Received</label>
                        <input
                          type="date"
                          value={receiveFormValues.date}
                          onChange={(e) => setReceiveFormValues(prev => ({
                            ...prev,
                            date: e.target.value
                          }))}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2">$</span>
                          <input
                            type="number"
                            value={receiveFormValues.amount}
                            onChange={(e) => setReceiveFormValues(prev => ({
                              ...prev,
                              amount: parseFloat(e.target.value) || 0
                            }))}
                            className="w-full p-2 pl-8 border rounded"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Notes (optional)</label>
                        <textarea
                          value={receiveFormValues.notes}
                          onChange={(e) => setReceiveFormValues(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                          className="w-full p-2 border rounded"
                          rows="2"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => setShowReceiveForm(null)}
                          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const validatedAmount = validateAmount(receiveFormValues.amount);
                            if (validatedAmount <= 0) {
                              alert('Please enter a valid amount');
                              return;
                            }

                            // Calculate account distribution based on the validated amount
                            const updatedDistribution = paycheck.accountDistribution?.map(dist => {
                              const proportion = dist.amount / paycheck.baseAmount;
                              return {
                                ...dist,
                                amount: validateAmount(proportion * validatedAmount)
                              };
                            });

                            // Record the received paycheck
                            recordPaycheckReceived(
                              paycheck.id,
                              receiveFormValues.date,
                              validatedAmount,
                              receiveFormValues.notes
                            );
                            setShowReceiveForm(null);

                            // Trigger PaydayWorkflow with validated data
                            if (onPaycheckReceived) {
                              onPaycheckReceived({
                                ...paycheck,
                                amount: validatedAmount,
                                dateReceived: receiveFormValues.date,
                                accountDistribution: updatedDistribution
                              });
                            }
                          }}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Record & Start Allocation
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm === paycheck.id && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600 mb-2">
                      Are you sure you want to delete this paycheck? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm(paycheck.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
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

        {/* Add Button */}
        {!showAddForm && !editingPaycheck && (
          <button
            onClick={handleAddNewPaycheck}
            className="mt-4 flex items-center text-theme-primary hover:bg-theme-primary hover:bg-opacity-10 px-3 py-1 rounded"
          >
            <span className="mr-1">+</span> Add Paycheck
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingPaycheck) && (
        <div className="mt-4 p-4 border rounded-lg">
          <h4 className="font-bold mb-3">
            {editingPaycheck ? 'Edit Paycheck' : 'Add New Paycheck'}
          </h4>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Paycheck Name</label>
              <input
                type="text"
                value={formValues.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., Main Job, Side Gig, etc."
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={formValues.frequency}
                onChange={(e) => handleFormChange('frequency', e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">First Paycheck Date</label>
              <input
                type="date"
                value={formValues.startDate}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="text-xs text-theme-secondary mt-1">
                This helps calculate future paycheck dates
              </div>
            </div>

            {/* Variable Amount Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formValues.variableAmount}
                  onChange={(e) => handleFormChange('variableAmount', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Variable amount (changes each pay period)</span>
              </label>
            </div>

            {/* Base Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {formValues.variableAmount ? 'Average Amount' : 'Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2">$</span>
                <input
                  type="number"
                  value={formValues.baseAmount}
                  onChange={(e) => handleFormChange('baseAmount', e.target.value)}
                  className="w-full p-2 pl-8 border rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              {formValues.variableAmount && (
                <div className="text-xs text-theme-secondary mt-1">
                  Use your average paycheck amount for planning purposes
                </div>
              )}
            </div>

            {/* Account Distribution */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Account Distribution</label>
                {accounts.length > formValues.accountDistribution.length && (
                  <button
                    onClick={handleAddAccount}
                    className="text-xs text-theme-primary hover:underline"
                  >
                    + Add Account
                  </button>
                )}
              </div>

              {formValues.accountDistribution.length === 0 ? (
                <div className="text-sm text-theme-secondary italic">
                  No accounts available for distribution
                </div>
              ) : (
                <div className="space-y-3">
                  {formValues.accountDistribution.map((dist, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <select
                        value={dist.accountId}
                        onChange={(e) => handleDistributionChange(index, 'accountId', parseInt(e.target.value))}
                        className="flex-grow p-2 border rounded bg-white"
                      >
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>

                      <div className="relative w-32">
                        <span className="absolute left-3 top-2">$</span>
                        <input
                          type="number"
                          value={dist.amount}
                          onChange={(e) => handleDistributionChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 pl-8 border rounded"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      {formValues.accountDistribution.length > 1 && (
                        <button
                          onClick={() => handleRemoveAccount(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove account"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPaycheck(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaycheck}
                className="px-4 py-2 bg-theme-primary text-white rounded hover:bg-opacity-90"
              >
                {editingPaycheck ? 'Update Paycheck' : 'Add Paycheck'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaycheckManager;