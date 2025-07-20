import { useState, useEffect } from 'react';

/**
 * Simple storage hook that uses localStorage with optional Google Drive backup
 * Much simpler than the previous over-engineered solution
 */
export const useSimpleStorage = (key, defaultValue) => {
    // Initialize from localStorage
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Save to localStorage whenever value changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error saving to localStorage key "${key}":`, error);
        }
    }, [key, value]);

    // Listen for storage changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.warn(`Error parsing storage change for key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [value, setValue];
};
