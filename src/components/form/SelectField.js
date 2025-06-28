// * SelectField component
//   * A standardized select dropdown field for forms
//     */

import FormField from './FormField';

const SelectField = ({
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  error = '',
  hint = '',
  required = false,
  disabled = false,
  className = '',
  darkMode = false,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const baseClassName = `w-full p-2 border rounded bg-theme-secondary border-theme-primary text-theme-primary ${error ? 'border-red-500' : ''
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

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
        disabled={disabled}
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