import FormField from './FormField';

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
  ...props
}) => {
  const handleChange = (e) => {
    let inputValue = e.target.value;

    // Remove any non-numeric characters except decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      inputValue = parts[0] + '.' + parts[1].slice(0, 2);
    }

    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      });
    }
  };

  const baseClassName = `w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary ${error ? 'border-red-500' : ''
    } ${className}`;

  return (
    <FormField
      id={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
    >
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-secondary">
          $
        </span>
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`pl-8 ${baseClassName}`}
          {...props}
        />
      </div>
    </FormField>
  );
};

export default CurrencyField;