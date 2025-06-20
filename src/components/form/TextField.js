/**
 * TextField component
 * A standardized text input field for forms
 */
import React from 'react';
import FormField from './FormField';

const TextField = ({
  name,
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  error = '',
  hint = '',
  required = false,
  autoFocus = false,
  className = '',
  darkMode = false,
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
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={baseClassName}
        autoFocus={autoFocus}
        {...props}
      />
    </FormField>
  );
};

export default TextField;