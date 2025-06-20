import React, { useEffect } from 'react';
import { 
  BaseForm, 
  TextField, 
  SelectField, 
  DateField, 
  CheckboxField, 
  CurrencyField 
} from './form';
import { useForm } from '../hooks/useForm';
import { formatDate } from '../utils/dateUtils';

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
      date: transaction?.date || formatDate(new Date()),
      payee: transaction?.payee || '',
      amount: transaction?.amount || '',
      categoryId: transaction?.categoryId || '',
      accountId: transaction?.accountId || (accounts[0]?.id || ''),
      transferAccountId: transaction?.transferAccountId || '',
      memo: transaction?.memo || '',
      isCleared: transaction?.isCleared || false,
      isTransfer: transaction?.transferAccountId ? true : false
    },
    onSubmit: (values) => {
      onSave({
        ...values,
        amount: parseFloat(values.amount) || 0,
        categoryId: values.isTransfer ? null : values.categoryId,
        transferAccountId: values.isTransfer ? values.transferAccountId : null,
      });
    },
    validate: (values) => {
      const errors = {};
      
      if (!values.date) {
        errors.date = 'Date is required';
      }
      
      if (!values.payee) {
        errors.payee = 'Payee is required';
      }
      
      if (values.amount === '') {
        errors.amount = 'Amount is required';
      }
      
      if (!values.accountId) {
        errors.accountId = 'Account is required';
      }
      
      if (values.isTransfer && !values.transferAccountId) {
        errors.transferAccountId = 'Transfer account is required';
      } else if (!values.isTransfer && !values.categoryId && parseFloat(values.amount) < 0) {
        errors.categoryId = 'Category is required for expenses';
      }
      
      return errors;
    },
  });

  // Determine if transaction is income based on amount
  const isIncome = parseFloat(form.values.amount) > 0;
  
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
  
  // Handle form submission
  const handleSubmit = () => {
    form.handleSubmit();
  };
  
  // Handle "Save & Add Another" button
  const handleSubmitAnother = () => {
    form.handleSubmit();
    // The parent component will handle the "add another" logic
  };

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
        {...form.getFieldProps('amount')}
        label="Amount"
        placeholder="0.00"
        required
        darkMode={darkMode}
        hint={isIncome ? 'Positive amount = income' : 'Negative amount = expense'}
      />
      
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
      
      {form.values.isTransfer ? (
        <SelectField
          {...form.getFieldProps('transferAccountId')}
          label="Transfer To"
          options={transferAccountOptions}
          required
          darkMode={darkMode}
          hint={transferAccountOptions.length === 0 ? 'No other accounts available' : ''}
        />
      ) : (
        !isIncome && (
          <SelectField
            {...form.getFieldProps('categoryId')}
            label="Category"
            options={categoryOptions}
            required
            darkMode={darkMode}
          />
        )
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