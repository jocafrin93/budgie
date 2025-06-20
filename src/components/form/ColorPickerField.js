/**
 * ColorPickerField component
 * A color picker field for selecting category colors
 */
import React from 'react';
import FormField from './FormField';

const ColorPickerField = ({
  name,
  label,
  value,
  onChange,
  colors = [],
  error = '',
  hint = '',
  required = false,
  className = '',
  ...props
}) => {
  const handleColorSelect = (color) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: color
        }
      });
    }
  };

  return (
    <FormField
      id={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <div className="grid grid-cols-2 gap-3" {...props}>
        {colors.map((color, index) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorSelect(color)}
            className={`h-12 rounded-lg ${color} border-3 ${
              value === color
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-transparent hover:border-gray-400'
            } shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center`}
            title={`Aurora Gradient ${index + 1}`}
          >
            <div className="w-full h-full rounded-md opacity-80"></div>
          </button>
        ))}
      </div>
    </FormField>
  );
};

export default ColorPickerField;