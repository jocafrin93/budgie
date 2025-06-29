import { useEffect } from 'react';
import { useForm } from '../hooks/useForm';
import {
  BaseForm,
  CheckboxField,
  CurrencyField,
  DateField,
  SelectField,
  TextField
} from './form';

// Helper function to get today's date in YYYY-MM-DD format
const getTodaysDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddTransactionForm = ({
  onSave,
  onCancel,
  darkMode,
  transaction = null,
  accounts = [],
  categories = []
}) => {
  // Initialize form with useForm hook
  const form = useForm({
    initialValues: {
      date: transaction?.date || getTodaysDate(),
      payee: transaction?.payee || '',
      amount: transaction?.amount ? Math.abs(transaction.amount) : 0, // Always store as positive
      isIncome: transaction?.amount ? transaction.amount > 0 : false, // New field for income/expense toggle
      categoryId: transaction?.categoryId || '',
      accountId: transaction?.accountId || (accounts[0]?.id || ''),
      transferAccountId: transaction?.transferAccountId || '',
      memo: transaction?.memo || '',
      isCleared: transaction?.isCleared || false,
      isTransfer: transaction?.transferAccountId ? true : false
    },
    onSubmit: (values) => {
      if (values.isSplit) {
        // Handle split transaction
        const splits = values.splits || [];
        const totalSplitAmount = splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
        const finalAmount = values.isIncome ? totalSplitAmount : -totalSplitAmount;

        // Create main transaction with splits
        onSave({
          ...values,
          amount: finalAmount,
          splits: splits.map(split => ({
            amount: values.isIncome ? parseFloat(split.amount) : -parseFloat(split.amount),
            categoryId: parseInt(split.categoryId, 10),
            memo: split.memo || ''
          })),
          categoryId: null, // No main category for split transactions
          transferAccountId: values.isTransfer ? values.transferAccountId : null,
        });
      } else {
        // Handle regular transaction
        const finalAmount = values.isIncome
          ? Math.abs(parseFloat(values.amount) || 0)
          : -Math.abs(parseFloat(values.amount) || 0);

        onSave({
          ...values,
          amount: finalAmount,
          categoryId: values.isTransfer ? null : (values.categoryId ? parseInt(values.categoryId, 10) : null),
          transferAccountId: values.isTransfer ? (values.transferAccountId ? parseInt(values.transferAccountId, 10) : null) : null,
        });
      }
    },
    validate: (values) => {
      const errors = {};

      if (!values.date) {
        errors.date = 'Date is required';
      }

      if (!values.payee || values.payee.trim() === '') {
        errors.payee = 'Payee is required';
      }

      // Handle numeric amount from CurrencyField
      const amount = typeof values.amount === 'number' ? values.amount : parseFloat(values.amount);
      if (isNaN(amount) || amount === 0) {
        errors.amount = 'Amount is required';
      }

      if (!values.accountId) {
        errors.accountId = 'Account is required';
      }

      if (values.isTransfer && !values.transferAccountId) {
        errors.transferAccountId = 'Transfer account is required';
      } else if (values.isSplit) {
        // Validate splits
        const splits = values.splits || [];
        if (splits.length === 0) {
          errors.splits = 'At least one split is required';
        } else {
          let hasInvalidSplit = false;
          splits.forEach((split, index) => {
            if (!split.categoryId) {
              errors[`split_${index}_category`] = 'Category is required';
              hasInvalidSplit = true;
            }
            if (!split.amount || parseFloat(split.amount) <= 0) {
              errors[`split_${index}_amount`] = 'Amount is required';
              hasInvalidSplit = true;
            }
          });

          const splitTotal = splits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
          if (Math.abs(Math.abs(values.amount) - splitTotal) > 0.01) {
            errors.splits = 'Split amounts must add up to transaction total';
          }
        }
      } else if (!values.isTransfer && !values.categoryId && !values.isIncome) {
        // Only require category for expenses when not splitting
        errors.categoryId = 'Category is required for expenses';
      }

      return errors;
    },
  });

  // Filter out the selected account from transfer options
  const transferAccountOptions = accounts
    .filter(account => account.id !== form.values.accountId)
    .map(account => ({
      value: account.id,
      label: account.name
    }));

  // Account options
  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.name
  }));

  // Category options
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  // When isTransfer changes, reset categoryId or transferAccountId
  useEffect(() => {
    if (form.values.isTransfer) {
      form.setFieldValue('categoryId', '');
    } else {
      form.setFieldValue('transferAccountId', '');
    }
  }, [form.values.isTransfer]);

  // Auto-select Income category for income transactions
  useEffect(() => {
    if (form.values.isIncome && !form.values.categoryId && !form.values.isTransfer && !form.values.isSplit) {
      const incomeCategory = categories.find(cat =>
        cat.type === 'income' || cat.name === 'Income'
      );
      if (incomeCategory) {
        form.setFieldValue('categoryId', incomeCategory.id);
      }
    }
  }, [form.values.isIncome, form.values.isTransfer, form.values.isSplit, categories]);

  // Split transaction management
  const addSplit = () => {
    const newSplit = {
      id: Date.now(), // Simple ID for React keys
      amount: 0,
      categoryId: '',
      memo: ''
    };
    const currentSplits = form.values.splits || [];
    form.setFieldValue('splits', [...currentSplits, newSplit]);
  };

  const removeSplit = (splitId) => {
    const currentSplits = form.values.splits || [];
    const updatedSplits = currentSplits.filter(split => split.id !== splitId);
    form.setFieldValue('splits', updatedSplits);

    // If no splits left, turn off split mode
    if (updatedSplits.length === 0) {
      form.setFieldValue('isSplit', false);
    }
  };

  const updateSplit = (splitId, field, value) => {
    const currentSplits = form.values.splits || [];
    const updatedSplits = currentSplits.map(split =>
      split.id === splitId ? { ...split, [field]: value } : split
    );
    form.setFieldValue('splits', updatedSplits);
  };

  // Calculate split totals with safety check
  const splitTotal = (form.values.splits || []).reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
  const splitDifference = Math.abs(form.values.amount) - splitTotal;

  // Handle form submission
  const handleSubmit = () => {
    form.handleSubmit();
  };

  // Handle "Save & Add Another" button
  const handleSubmitAnother = () => {
    form.handleSubmit();
    // The parent component will handle the "add another" logic
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        handleSubmitAnother();
      } else if (e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  // Add event listener for keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onSubmitAnother={handleSubmitAnother}
      onCancel={onCancel}
      submitLabel={transaction ? 'Update Transaction' : 'Add Transaction'}
      submitAnotherLabel="Save & Add Another"
      isSubmitDisabled={!form.isValid}
    >
      <DateField
        {...form.getFieldProps('date')}
        label="Date"
        required
        darkMode={darkMode}
      />

      <TextField
        {...form.getFieldProps('payee')}
        label="Payee"
        placeholder="Who was this transaction with?"
        required
        autoFocus
        darkMode={darkMode}
      />

      <CurrencyField
        name="amount"
        label="Amount"
        value={form.values.amount || 0}
        onChange={(e) => {
          // CurrencyField returns a numeric value in e.target.value
          form.setFieldValue('amount', e.target.value);
        }}
        placeholder="0.00"
        required
        darkMode={darkMode}
        error={form.errors.amount}
      />

      {/* Income/Expense Toggle */}
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
          Transaction Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => form.setFieldValue('isIncome', false)}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${!form.values.isIncome
              ? 'bg-red-500 text-white border-red-500'
              : darkMode
                ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
          >
            💸 Expense
          </button>
          <button
            type="button"
            onClick={() => form.setFieldValue('isIncome', true)}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${form.values.isIncome
              ? 'bg-green-500 text-white border-green-500'
              : darkMode
                ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
          >
            💰 Income
          </button>
        </div>
      </div>

      <SelectField
        {...form.getFieldProps('accountId')}
        label="Account"
        options={accountOptions}
        required
        darkMode={darkMode}
      />

      <CheckboxField
        {...form.getFieldProps('isTransfer')}
        label="This is a transfer between accounts"
        darkMode={darkMode}
      />

      <CheckboxField
        name="isSplit"
        label="Split this transaction across multiple categories"
        checked={form.values.isSplit}
        onChange={(e) => {
          form.setFieldValue('isSplit', e.target.checked);
          if (e.target.checked && (!form.values.splits || form.values.splits.length === 0)) {
            // Add first split when enabling split mode
            addSplit();
          }
        }}
        darkMode={darkMode}
      />

      {form.values.isTransfer ? (
        <SelectField
          {...form.getFieldProps('transferAccountId')}
          label="Transfer To"
          options={transferAccountOptions}
          required
          darkMode={darkMode}
          hint={transferAccountOptions.length === 0 ? 'No other accounts available' : ''}
        />
      ) : form.values.isSplit ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Transaction Splits
            </h4>
            <button
              type="button"
              onClick={addSplit}
              className={`px-3 py-1 text-sm rounded border transition-colors ${darkMode
                ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
            >
              + Add Split
            </button>
          </div>

          {(form.values.splits || []).map((split, index) => (
            <div key={split.id} className={`p-3 border rounded ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Split {index + 1}
                </span>
                {(form.values.splits || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSplit(split.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CurrencyField
                  name={`split_${split.id}_amount`}
                  label="Amount"
                  value={split.amount || 0}
                  onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                  required
                  darkMode={darkMode}
                  error={form.errors[`split_${index}_amount`]}
                  hideLabel={false}
                />

                <SelectField
                  name={`split_${split.id}_category`}
                  label="Category"
                  value={split.categoryId}
                  onChange={(e) => updateSplit(split.id, 'categoryId', e.target.value)}
                  options={[
                    { value: '', label: 'Select category...' },
                    ...categoryOptions
                  ]}
                  required
                  darkMode={darkMode}
                  error={form.errors[`split_${index}_category`]}
                />
              </div>

              <TextField
                name={`split_${split.id}_memo`}
                label="Split Memo"
                value={split.memo || ''}
                onChange={(e) => updateSplit(split.id, 'memo', e.target.value)}
                placeholder="Optional memo for this split"
                darkMode={darkMode}
              />
            </div>
          ))}

          {/* Split total validation */}
          <div className={`text-sm p-2 rounded ${Math.abs(splitDifference) < 0.01
            ? darkMode
              ? 'bg-green-900 text-green-200'
              : 'bg-green-100 text-green-800'
            : darkMode
              ? 'bg-yellow-900 text-yellow-200'
              : 'bg-yellow-100 text-yellow-800'
            }`}>
            Split Total: ${splitTotal.toFixed(2)} |
            Transaction Total: ${Math.abs(form.values.amount).toFixed(2)} |
            Difference: ${Math.abs(splitDifference).toFixed(2)}
            {Math.abs(splitDifference) < 0.01 && ' ✓'}
          </div>

          {form.errors.splits && (
            <div className="text-red-500 text-sm">{form.errors.splits}</div>
          )}
        </div>
      ) : (
        <SelectField
          name="categoryId"
          label="Category"
          value={form.values.categoryId}
          onChange={(e) => form.setFieldValue('categoryId', e.target.value)}
          options={[
            { value: '', label: 'Select a category...' },
            ...categoryOptions
          ]}
          required={!form.values.isIncome}
          darkMode={darkMode}
          hint={form.values.isIncome ? 'Optional for income' : 'Required for expenses'}
          error={form.errors.categoryId}
        />
      )}

      <TextField
        {...form.getFieldProps('memo')}
        label="Memo"
        placeholder="Optional notes about this transaction"
        darkMode={darkMode}
      />

      <CheckboxField
        {...form.getFieldProps('isCleared')}
        label="Cleared (has posted to account)"
        darkMode={darkMode}
      />
    </BaseForm>
  );
};

export default AddTransactionForm;