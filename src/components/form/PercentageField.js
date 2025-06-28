// src/components/form/PercentageField.js
import { useEffect, useState } from 'react';
import FormField from './FormField';

const PercentageField = ({
    name,
    label,
    value,
    onChange,
    placeholder = '0.0',
    error = '',
    hint = '',
    required = false,
    className = '',
    darkMode = false,
    hideLabel = false,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('0.0');

    // Convert numeric value to percentage display (always show one decimal place)
    const formatPercentage = (num) => {
        const number = parseFloat(num) || 0;
        return number.toFixed(1);
    };

    // Update display when prop value changes
    useEffect(() => {
        setDisplayValue(formatPercentage(value));
    }, [value]);

    const handleKeyDown = (e) => {
        // Allow: backspace, delete, tab, escape, enter, decimal point
        if ([8, 9, 27, 13, 46, 190, 110].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    };

    const handleChange = (e) => {
        let inputValue = e.target.value;

        // Remove all non-numeric characters except decimal point
        let cleanValue = inputValue.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit to reasonable percentage (0-100%)
        let numericValue = parseFloat(cleanValue) || 0;
        if (numericValue > 100) {
            numericValue = 100;
            cleanValue = '100.0';
        }

        // Format for display (ensure one decimal place)
        if (cleanValue === '' || cleanValue === '.') {
            setDisplayValue('0.0');
            numericValue = 0;
        } else {
            // Show what user typed, but ensure proper formatting
            if (cleanValue.endsWith('.')) {
                setDisplayValue(cleanValue + '0');
            } else if (!cleanValue.includes('.')) {
                setDisplayValue(cleanValue + '.0');
            } else {
                // Ensure one decimal place
                const decimalParts = cleanValue.split('.');
                if (decimalParts[1].length === 0) {
                    setDisplayValue(cleanValue + '0');
                } else if (decimalParts[1].length > 1) {
                    // Limit to one decimal place
                    const truncated = decimalParts[0] + '.' + decimalParts[1].charAt(0);
                    setDisplayValue(truncated);
                    numericValue = parseFloat(truncated);
                } else {
                    setDisplayValue(cleanValue);
                }
            }
        }

        // Call onChange with NUMERIC value
        if (onChange) {
            onChange({
                ...e,
                target: {
                    ...e.target,
                    value: numericValue // Return NUMBER for safe calculations
                }
            });
        }
    };

    const handleFocus = (e) => {
        // Select all on focus for easy replacement
        e.target.select();
    };

    const baseClassName = `w-full p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary ${error ?
        'border-red-500' : ''
        } ${className}`;

    const inputElement = (
        <div className="relative">
            <input
                type="text"
                name={name}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder={placeholder}
                className={`pr-8 ${baseClassName}`}
                {...props}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-secondary z-10">
                %
            </span>
        </div>
    );

    // If hideLabel is true, return just the input without FormField wrapper
    if (hideLabel) {
        return inputElement;
    }

    return (
        <FormField
            id={name}
            label={label}
            error={error}
            hint={hint}
            required={required}
        >
            {inputElement}
        </FormField>
    );
};

export default PercentageField;