/**
 * CheckboxField component
 * A standardized checkbox field for forms
 */
import FormField from './FormField';

const CheckboxField = ({
  name,
  label,
  checked,
  onChange,
  error = '',
  hint = '',
  disabled = false,
  className = '',
  darkMode = false,
  children,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const checkboxClassName = `
    h-4 w-4 rounded border-theme-primary text-theme-blue 
    focus:ring-theme-blue focus:ring-2 focus:ring-offset-0
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${error ? 'border-red-500' : ''}
    ${className}
  `;

  return (
    <FormField
      id={name}
      label=""
      error={error}
      hint={hint}
      required={false}
    >
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={handleChange}
          className={checkboxClassName}
          disabled={disabled}
          {...props}
        />
        {label && (
          <label
            htmlFor={name}
            className={`text-sm text-theme-primary ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
          >
            {label}
          </label>
        )}
        {children && (
          <div className="text-sm text-theme-secondary">
            {children}
          </div>
        )}
      </div>
    </FormField>
  );
};

export default CheckboxField;