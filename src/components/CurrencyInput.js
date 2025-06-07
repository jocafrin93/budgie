// CurrencyInput.js - Add this as a new component file
import React, { useState, useEffect } from 'react';

const CurrencyInput = ({
    value,
    onChange,
    placeholder = "0.00",
    className = "",
    darkMode = false,
    disabled = false,
    step = "0.01",
    min,
    max,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Format number for display (with commas)
    const formatForDisplay = (num) => {
        if (num === '' || num === null || num === undefined) return '';
        const number = parseFloat(num);
        if (isNaN(number)) return '';
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    // Parse display value back to number
    const parseDisplayValue = (str) => {
        if (!str) return '';
        // Remove commas and parse
        const cleaned = str.replace(/,/g, '');
        const number = parseFloat(cleaned);
        return isNaN(number) ? '' : number;
    };

    // Update display value when prop value changes
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value ? formatForDisplay(value) : '');
        }
    }, [value, isFocused]);

    const handleFocus = (e) => {
        setIsFocused(true);
        // Show raw number when focused (no commas)
        setDisplayValue(value ? value.toString() : '');
        e.target.select(); // Select all text on focus
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        const numericValue = parseDisplayValue(e.target.value);

        // Update parent with numeric value
        if (onChange) {
            onChange({
                ...e,
                target: {
                    ...e.target,
                    value: numericValue
                }
            });
        }

        // Format for display
        setDisplayValue(numericValue ? formatForDisplay(numericValue) : '');
    };

    const handleChange = (e) => {
        const inputValue = e.target.value;

        if (isFocused) {
            // While focused, allow raw input
            setDisplayValue(inputValue);
        } else {
            // When not focused, parse and format
            const numericValue = parseDisplayValue(inputValue);
            if (onChange) {
                onChange({
                    ...e,
                    target: {
                        ...e.target,
                        value: numericValue
                    }
                });
            }
        }
    };

    const baseClassName = `w-full pl-8 p-2 border rounded ${darkMode
        ? "bg-gray-700 border-gray-600 text-gray-100"
        : "bg-white border-gray-300 text-gray-900"
        }`;

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                $
            </span>
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={`${baseClassName} ${className}`}
                {...props}
            />
        </div>
    );
};

export default CurrencyInput;
