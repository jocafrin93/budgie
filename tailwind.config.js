/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        // No gradient classes needed - using inline styles with hex codes
    ],
    theme: {
        extend: {
            colors: {
                // DaisyUI-style color system
                'primary': 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-focus': 'rgb(var(--color-primary-focus) / <alpha-value>)',
                'primary-content': 'rgb(var(--color-primary-content) / <alpha-value>)',

                'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',
                'secondary-focus': 'rgb(var(--color-secondary-focus) / <alpha-value>)',
                'secondary-content': 'rgb(var(--color-secondary-content) / <alpha-value>)',

                'accent': 'rgb(var(--color-accent) / <alpha-value>)',
                'accent-focus': 'rgb(var(--color-accent-focus) / <alpha-value>)',
                'accent-content': 'rgb(var(--color-accent-content) / <alpha-value>)',

                'neutral': 'rgb(var(--color-neutral) / <alpha-value>)',
                'neutral-focus': 'rgb(var(--color-neutral-focus) / <alpha-value>)',
                'neutral-content': 'rgb(var(--color-neutral-content) / <alpha-value>)',

                'base-100': 'rgb(var(--color-base-100) / <alpha-value>)',
                'base-200': 'rgb(var(--color-base-200) / <alpha-value>)',
                'base-300': 'rgb(var(--color-base-300) / <alpha-value>)',
                'base-content': 'rgb(var(--color-base-content) / <alpha-value>)',

                'info': 'rgb(var(--color-info) / <alpha-value>)',
                'info-content': 'rgb(var(--color-info-content) / <alpha-value>)',

                'success': 'rgb(var(--color-success) / <alpha-value>)',
                'success-content': 'rgb(var(--color-success-content) / <alpha-value>)',

                'warning': 'rgb(var(--color-warning) / <alpha-value>)',
                'warning-content': 'rgb(var(--color-warning-content) / <alpha-value>)',

                'error': 'rgb(var(--color-error) / <alpha-value>)',
                'error-content': 'rgb(var(--color-error-content) / <alpha-value>)',

                // Standard Tailwind colors for gradients
                'purple': {
                    '500': '#8b5cf6',
                    '600': '#7c3aed',
                },
                'pink': {
                    '500': '#ec4899',
                },
                'green': {
                    '500': '#10b981',
                    '600': '#059669',
                },
                'yellow': {
                    '500': '#eab308',
                },
                'red': {
                    '500': '#ef4444',
                },
                'indigo': {
                    '500': '#6366f1',
                    '600': '#4f46e5',
                },
                'blue': {
                    '500': '#3b82f6',
                },
                'orange': {
                    '500': '#f97316',
                },
                'teal': {
                    '500': '#14b8a6',
                    '600': '#0d9488',
                },
                'cyan': {
                    '500': '#06b6d4',
                },
                'emerald': {
                    '500': '#10b981',
                },
            }
        },
    },
    plugins: [],
}
