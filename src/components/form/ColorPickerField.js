import FormField from './FormField';

const DEFAULT_COLORS = [
  'bg-gradient-to-r from-purple-500 to-pink-500',
  'bg-gradient-to-r from-pink-500 to-blue-500',
  'bg-gradient-to-r from-orange-500 to-red-600',
  'bg-gradient-to-r from-green-500 to-yellow-400',
  'bg-gradient-to-r from-pink-500 to-red-500',
  'bg-gradient-to-r from-yellow-400 to-orange-500',
  'bg-gradient-to-r from-purple-600 to-teal-500',
  'bg-gradient-to-r from-violet-600 to-purple-800'
];

const ColorPickerField = ({
  name,
  label,
  value,
  onChange,
  error = '',
  hint = '',
  required = false,
  className = '',
  darkMode = false,
  colors = DEFAULT_COLORS,
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
      <div
        className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-theme-secondary border border-theme-primary"
        {...props}
      >
        {colors.map((color, index) => (
          <button
            key={`${color}-${index}`}
            type="button"
            onClick={() => handleColorSelect(color)}
            className={`
              h-16 rounded-lg ${color} 
              ${value === color
                ? 'ring-2 ring-theme-blue scale-105'
                : 'ring-transparent'
              }
              transition-all duration-200 
              hover:scale-105 
              hover:ring-2 
              hover:ring-theme-blue
              shadow-lg
            `}
            title={`Color option ${index + 1}`}
          >
            {value === color && (
              <span className="flex items-center justify-center h-full text-theme-inverse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </FormField>
  );
};

export default ColorPickerField;