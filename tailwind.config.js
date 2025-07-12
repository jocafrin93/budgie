/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    plugins: [
        require('daisyui'),
    ],
    daisyui: {
        // Enable DaisyUI components and theming
        base: true, // Apply DaisyUI base styles
        styled: true, // Apply DaisyUI component styles
        utils: true, // Apply DaisyUI utility classes
        prefix: "", // No prefix for DaisyUI classes
        logs: true, // Show info about DaisyUI version and config in console
        themeRoot: ":root", // The element that receives theme color CSS variables
        themes: [
            // Light themes
            "light",
            "corporate",
            "emerald",
            "fantasy",
            "lofi",
            "pastel",
            "cupcake",
            "bumblebee",
            "garden",
            "retro",
            "valentine",
            "aqua",
            "cmyk",
            "autumn",
            "acid",
            "lemonade",
            "winter",

            // Dark themes  
            "dark",
            "synthwave",
            "forest",
            "black",
            "night",
            "coffee",
            "dim",
            "nord",
            "sunset",
            "cyberpunk",
            "halloween",
            "luxury",
            "dracula",
            "business",

            // Custom themes that match your current color schemes
            {
                "budgie-light": {
                    "primary": "#0ea5e9", // sky-600 (your current info color)
                    "secondary": "#e000ad", // your current secondary
                    "accent": "#10b981", // emerald-500
                    "neutral": "#64748b", // slate-500
                    "base-100": "#ffffff", // white background
                    "base-200": "#f8fafc", // slate-50
                    "base-300": "#e2e8f0", // slate-200
                    "info": "#0ea5e9",
                    "success": "#10b981",
                    "warning": "#f59200",
                    "error": "#ff4f1a",
                },
            },
            {
                "budgie-dark": {
                    "primary": "#0ea5e9", // sky-600
                    "secondary": "#e000ad", // your current secondary
                    "accent": "#10b981", // emerald-500
                    "neutral": "#4c4f57", // cinder-400
                    "base-100": "#2a2c32", // cinder-500 (dark background)
                    "base-200": "#232429", // cinder-600
                    "base-300": "#1c1d21", // cinder-700
                    "info": "#0ea5e9",
                    "success": "#10b981",
                    "warning": "#f59200",
                    "error": "#ff4f1a",
                },
            },
        ],
    },
}
