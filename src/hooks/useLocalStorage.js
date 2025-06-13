import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };
    const migrateCategoriesData = (categories) => {
        return categories.map(category => ({
            ...category,
            // Add envelope fields
            allocated: category.allocated || 0,
            spent: category.spent || 0,
            lastFunded: category.lastFunded || null,
            targetBalance: category.targetBalance || 0,
            autoFunding: category.autoFunding || {
                enabled: false,
                maxAmount: 500,
                priority: 'medium'
            }
        }));
    };
    return [storedValue, setValue];
};
