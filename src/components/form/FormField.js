/**
 * FormField component
 * A wrapper component for form fields with label and error handling
 */
import React from 'react';

const FormField = ({
  id,
  label,
  children,
  error,
  hint,
  required = false,
  className = '',
}) => {
  // Generate a unique ID if not provided
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-field space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={fieldId} 
          className="block text-sm font-medium mb-1 text-theme-primary"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Render the field (passed as children) */}
      {React.cloneElement(children, { 
        id: fieldId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined,
      })}
      
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
  );
};

export default FormField;