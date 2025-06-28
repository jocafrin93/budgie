/**
 * DateField component
 * A standardized date input field for forms
 */
import FormField from './FormField';

const DateField = ({
  name,
  label,
  value,
  onChange,
  error = '',
  hint = '',
  required = false,
  className = '',
  darkMode = false,
  min,
  max,
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const baseClassName = `w-full p-2 border rounded ${'bg-theme-secondary border-theme-primary'
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
        type="date"
        name={name}
        value={value}
        onChange={handleChange}
        className={baseClassName}
        min={min}
        max={max}
        style={darkMode ? { colorScheme: 'dark' } : {}}
        {...props}
      />
    </FormField>
  );
};

export default DateField;