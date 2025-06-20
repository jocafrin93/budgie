import React from 'react';
import { BaseForm, TextField, SelectField, CurrencyField } from './form';
import { useForm } from '../hooks/useForm';

const AddAccountForm = ({ 
  onSave, 
  onCancel, 
  darkMode, 
  account = null 
}) => {
  // Initialize form with useForm hook
  const form = useForm({
    initialValues: {
      name: account?.name || '',
      type: account?.type || 'checking',
      balance: account?.balance || '',
      bankName: account?.bankName || '',
    },
    onSubmit: (values) => {
      onSave({
        ...values,
        balance: parseFloat(values.balance) || 0,
      });
    },
    validate: (values) => {
      const errors = {};
      
      if (!values.name) {
        errors.name = 'Account name is required';
      }
      
      if (values.balance === '') {
        errors.balance = 'Balance is required';
      }
      
      return errors;
    },
  });

  // Account type options
  const accountTypeOptions = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'investment', label: 'Investment' },
    { value: 'loan', label: 'Loan' },
  ];

  // Handle form submission
  const handleSubmit = () => {
    form.handleSubmit();
  };

  return (
    <BaseForm
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitLabel={account ? 'Update Account' : 'Add Account'}
      isSubmitDisabled={!form.values.name || form.values.balance === ''}
    >
      <TextField
        {...form.getFieldProps('name')}
        label="Account Name"
        placeholder="Account name (e.g., 'Main Checking')"
        autoFocus
        required
        darkMode={darkMode}
      />
      
      <SelectField
        {...form.getFieldProps('type')}
        label="Account Type"
        options={accountTypeOptions}
        required
        darkMode={darkMode}
      />
      
      <TextField
        {...form.getFieldProps('bankName')}
        label="Bank Name"
        placeholder="Bank name (optional)"
        darkMode={darkMode}
      />
      
      <CurrencyField
        {...form.getFieldProps('balance')}
        label="Current Balance"
        placeholder="0.00"
        required
        darkMode={darkMode}
      />
    </BaseForm>
  );
};

export default AddAccountForm;