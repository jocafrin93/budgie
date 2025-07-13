import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { DaisyThemeContext } from './DaisyContext';
import { useThemeContext } from './context';

const DEFAULT_THEME = 'light';

// Map DaisyUI themes to light/dark for Tailux theme system
const THEME_MODE_MAP = {
    'light': 'light',
    'dark': 'dark',
    'cupcake': 'light',
    'corporate': 'light',
    'synthwave': 'dark',
    'retro': 'light',
    'cyberpunk': 'dark',
    'valentine': 'light',
    'forest': 'dark',
    'aqua': 'light',
    'dracula': 'dark',
    'abyss': 'dark'
};

export function DaisyThemeProvider({ children }) {
    const { setThemeMode } = useThemeContext();
    const syncRef = useRef(false); // Prevent infinite loops

    const [currentTheme, setCurrentTheme] = useState(() => {
        // Get theme from localStorage or use default
        if (typeof window !== 'undefined') {
            return localStorage.getItem('daisy-theme') || DEFAULT_THEME;
        }
        return DEFAULT_THEME;
    });

    // Apply theme to document and sync with main theme system
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('daisy-theme', currentTheme);

            // Sync with main Tailux theme system (with loop prevention)
            if (!syncRef.current) {
                syncRef.current = true;
                const tailuxMode = THEME_MODE_MAP[currentTheme] || 'light';
                setThemeMode(tailuxMode);
                // Reset the ref after a short delay
                setTimeout(() => {
                    syncRef.current = false;
                }, 100);
            }
        }
    }, [currentTheme, setThemeMode]);

    const changeTheme = (themeName) => {
        setCurrentTheme(themeName);
    };

    const value = {
        currentTheme,
        changeTheme,
        availableThemes: [
            'light',
            'dark',
            'cupcake',
            'corporate',
            'synthwave',
            'retro',
            'cyberpunk',
            'valentine',
            'forest',
            'aqua',
            'dracula',
            'abyss'
        ]
    };

    return (
        <DaisyThemeContext value={value}>
            {children}
        </DaisyThemeContext>
    );
}

DaisyThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
