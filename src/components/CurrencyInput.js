import React, { useState, useEffect } from 'react';

const CurrencyInput = ({
    value,
    onChange,
    placeholder = "0.00",
    className = "",
    darkMode = false,
    disabled = false,
    autoFocus = false,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('0.00');

    // Convert numeric value to currency display (always show 0.00 format)
    const formatCurrency = (num) => {
        const number = parseFloat(num) || 0;
        return number.toFixed(2);
    };

    // Update display when prop value changes
    useEffect(() => {
        setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleKeyDown = (e) => {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
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
        let value = e.target.value;

        // Remove all non-digits
        let digits = value.replace(/\D/g, '');

        // If empty after removing non-digits, treat as 0
        if (!digits) {
            setDisplayValue('0.00');
            if (onChange) {
                onChange({
                    ...e,
                    target: {
                        ...e.target,
                        value: 0
                    }
                });
            }
            return;
        }

        // Limit to reasonable number of digits (max $999,999.99)
        if (digits.length > 8) {
            digits = digits.slice(0, 8);
        }

        // Convert to cents, then to dollars
        let cents = parseInt(digits) || 0;
        let dollars = cents / 100;

        // Format as currency
        let formatted = dollars.toFixed(2);
        setDisplayValue(formatted);

        // Call onChange with numeric value
        if (onChange) {
            onChange({
                ...e,
                target: {
                    ...e.target,
                    value: dollars
                }
            });
        }
    };

    const handleFocus = (e) => {
        // Select all on focus for easy replacement
        e.target.select();
    };

    const baseClassName = `w-full pl-8 p-2 border rounded bg-theme-primary border-theme-primary text-theme-primary
        }`;

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-tertiary z-10">
                $
            </span>
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                className={`${baseClassName} ${className}`}
                {...props}
            />
        </div>
    );
};

export default CurrencyInput;