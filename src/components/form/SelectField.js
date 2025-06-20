/**
 * SelectField component
 * A standardized select dropdown for forms
 */
import React from 'react';
import FormField from './FormField';

const SelectField = ({
  name,
  label,
  value,
  onChange,
  options = [],
  error = '',
  hint = '',
  required = false,
  className = '',
  darkMode = false,
  placeholder = '',
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const baseClassName = `w-full p-2 border rounded ${
    darkMode ? 'bg-theme-secondary border-theme-primary' : 'bg-theme-primary border-theme-primary'
  } text-theme-primary ${error ? 'border-red-500' : ''} ${className}`;

  return (
    <FormField
      id={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
    >
      <select
        name={name}
        value={value}
        onChange={handleChange}
        className={baseClassName}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default SelectField;