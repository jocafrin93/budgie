import { useState, useEffect } from 'react';

/**
 * Simple storage hook that uses localStorage with optional Google Drive backup
 * Much simpler than the previous over-engineered solution
 */
export const useSimpleStorage = (key, defaultValue) => {
    // Initialize from localStorage with defensive programming
    const [value, setValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;

            const parsedValue = JSON.parse(item);

            // For array-based keys, ensure the value is actually an array
            if (key.includes('scheduledTransactions') || key.includes('categories') || key.includes('planningItems')) {
                if (!Array.isArray(parsedValue)) {
                    console.warn(`🚨 STORAGE WARNING - ${key} is not an array, using default:`, parsedValue);
                    return Array.isArray(defaultValue) ? defaultValue : [];
                }
            }

            return parsedValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            // For array keys, return empty array; for others, return defaultValue
            if (key.includes('scheduledTransactions') || key.includes('categories') || key.includes('planningItems')) {
                return Array.isArray(defaultValue) ? defaultValue : [];
            }
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
