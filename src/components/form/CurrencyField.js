/**
 * CurrencyField component
 * A standardized currency input field for forms
 * Uses the CurrencyInput component internally with "cash register" style input
 */
import React from 'react';
import FormField from './FormField';
import CurrencyInput from '../CurrencyInput';

const CurrencyField = ({
  name,
  label,
  value,
  onChange,
  placeholder = '0.00',
  error = '',
  hint = '',
  required = false,
  className = '',
  darkMode = false,
  autoFocus = false,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <FormField
      id={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
    >
      <CurrencyInput
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        darkMode={darkMode}
        autoFocus={autoFocus}
        {...props}
      />
    </FormField>
  );
};

export default CurrencyField;