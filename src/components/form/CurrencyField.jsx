import { forwardRef } from 'react';

const CurrencyField = forwardRef(({
    name,
    value,
    onChange,
    placeholder = "0.00",
    className = "",
    hideLabel = false,
    label,
    ...props
}, ref) => {
    const handleChange = (e) => {
        let inputValue = e.target.value;

        // Remove any non-digit and non-decimal characters
        inputValue = inputValue.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = inputValue.split('.');
        if (parts.length > 2) {
            inputValue = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
            inputValue = parts[0] + '.' + parts[1].substring(0, 2);
        }

        // Create synthetic event
        const syntheticEvent = {
            target: {
                name,
                value: inputValue
            }
        };

        onChange(syntheticEvent);
    };

    const baseClasses = `
        px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary
        ${className}
    `.trim();

    return (
        <div>
            {!hideLabel && label && (
                <label className="block text-sm font-medium text-gray-900 dark:text-dark-50 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-400">
                    $
                </span>
                <input
                    ref={ref}
                    type="text"
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`pl-7 ${baseClasses}`}
                    {...props}
                />
            </div>
        </div>
    );
});

CurrencyField.displayName = 'CurrencyField';

export default CurrencyField;
