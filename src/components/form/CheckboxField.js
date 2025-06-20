/**
 * CheckboxField component
 * A standardized checkbox input for forms
 */
import React from 'react';

const CheckboxField = ({
  id,
  name,
  label,
  checked,
  onChange,
  error = '',
  hint = '',
  className = '',
  ...props
}) => {
  const fieldId = id || name || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={fieldId}
        name={name}
        checked={checked}
        onChange={handleChange}
        className={`mr-2 ${error ? 'border-red-500' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />
      
      <div className="flex flex-col">
        <label htmlFor={fieldId} className="text-sm text-theme-primary">
          {label}
        </label>
        
        {/* Error message */}
        {error && (
          <div 
            id={`${fieldId}-error`} 
            className="text-xs text-red-500 mt-1"
            role="alert"
          >
            {error}
          </div>
        )}
        
        {/* Hint text */}
        {hint && !error && (
          <div 
            id={`${fieldId}-hint`} 
            className="text-xs text-theme-tertiary mt-1"
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckboxField;