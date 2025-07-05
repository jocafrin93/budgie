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
    // Convert numeric value to display format
    const formatDisplayValue = (numericValue) => {
        if (numericValue === '' || numericValue === null || numericValue === undefined) {
            return '';
        }

        const num = typeof numericValue === 'number' ? numericValue : parseFloat(numericValue);
        if (isNaN(num)) return '';

        return num.toFixed(2);
    };

    // Convert cents to dollars (500 -> 5.00)
    const formatCentsInput = (centsString) => {
        // Remove any non-digit characters
        const digitsOnly = centsString.replace(/[^0-9]/g, '');

        if (digitsOnly === '') return '';

        // Convert to cents, then to dollars
        const cents = parseInt(digitsOnly, 10);
        const dollars = cents / 100;

        return dollars.toFixed(2);
    };

    const handleChange = (e) => {
        const inputValue = e.target.value;

        // If user is typing digits, treat as cents input
        if (/^\d+$/.test(inputValue.replace(/[^0-9]/g, ''))) {
            const formattedValue = formatCentsInput(inputValue);

            // Create synthetic event with formatted value
            const syntheticEvent = {
                target: {
                    name,
                    value: formattedValue
                }
            };

            onChange(syntheticEvent);
        } else {
            // Handle direct decimal input (like copy/paste)
            let cleanValue = inputValue.replace(/[^0-9.]/g, '');

            // Ensure only one decimal point
            const parts = cleanValue.split('.');
            if (parts.length > 2) {
                cleanValue = parts[0] + '.' + parts.slice(1).join('');
            }

            // Limit to 2 decimal places
            if (parts[1] && parts[1].length > 2) {
                cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
            }

            const syntheticEvent = {
                target: {
                    name,
                    value: cleanValue
                }
            };

            onChange(syntheticEvent);
        }
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
                    value={formatDisplayValue(value)}
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
