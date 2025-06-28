import FormField from './FormField';

const DEFAULT_COLORS = [
  { value: 'bg-gradient-to-r from-blue-500 to-blue-600', style: 'linear-gradient(to right, #3B82F6, #2563EB)', name: 'Blue' },
  { value: 'bg-gradient-to-r from-green-500 to-emerald-600', style: 'linear-gradient(to right, #10B981, #059669)', name: 'Green' },
  { value: 'bg-gradient-to-r from-yellow-400 to-orange-500', style: 'linear-gradient(to right, #FBBF24, #F97316)', name: 'Yellow' },
  { value: 'bg-gradient-to-r from-red-500 to-pink-600', style: 'linear-gradient(to right, #EF4444, #DC2626)', name: 'Red' },
  { value: 'bg-gradient-to-r from-purple-500 to-indigo-600', style: 'linear-gradient(to right, #8B5CF6, #4F46E5)', name: 'Purple' },
  { value: 'bg-gradient-to-r from-orange-500 to-red-500', style: 'linear-gradient(to right, #F97316, #EF4444)', name: 'Orange' },
  { value: 'bg-gradient-to-r from-cyan-500 to-teal-600', style: 'linear-gradient(to right, #06B6D4, #0D9488)', name: 'Cyan' },
  { value: 'bg-gradient-to-r from-lime-500 to-green-600', style: 'linear-gradient(to right, #84CC16, #16A34A)', name: 'Lime' }
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
  const handleColorSelect = (colorValue) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: colorValue
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
        className="flex justify-between gap-3"
        {...props}
      >
        {colors.map((color, index) => (
          <button
            key={`${color.value}-${index}`}
            type="button"
            onClick={() => handleColorSelect(color.value)}
            className={`
              w-10 h-10 rounded-full border-3 transition-all duration-200 hover:scale-110 hover:shadow-lg
              ${value === color.value
                ? 'border-gray-800 dark:border-white scale-110 shadow-lg ring-2 ring-offset-2 ring-gray-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
            `}
            style={{ background: color.style }}
            title={color.name}
          >
            {value === color.value && (
              <span className="flex items-center justify-center h-full text-white drop-shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
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