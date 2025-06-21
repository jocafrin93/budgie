/**
 * CurrencyField component
 * A standardized currency input field for forms
 * Uses the CurrencyInput component internally with "cash register" style input
 */
import CurrencyInput from '../CurrencyInput';
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
  autoFocus = false,
  ...props
}) => {
  const handleChange = (e) => {
    console.log('DEBUG - CurrencyField handleChange:', { name, value: e.target.value });

    if (onChange) {
      // Create a new synthetic event with the proper field name
      const updatedEvent = {
        ...e,
        target: {
          ...e.target,
          name: name, // Add the field name to the event
          value: e.target.value
        }
      };

      onChange(updatedEvent);
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