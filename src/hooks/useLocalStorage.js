import { useCallback, useRef, useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
    // Use a ref to track if we're currently updating to prevent infinite loops
    const isUpdating = useRef(false);

    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        // Prevent recursive updates
        if (isUpdating.current) {
            return; // Silently return instead of warning
        }

        try {
            isUpdating.current = true;

            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Only update if the value has actually changed
            const currentValueString = JSON.stringify(storedValue);
            const newValueString = JSON.stringify(valueToStore);

            if (newValueString !== currentValueString) {
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, newValueString);
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        } finally {
            // Reset the flag after a brief delay to ensure state has settled
            setTimeout(() => {
                isUpdating.current = false;
            }, 0);
        }
    }, [key, storedValue]);

    return [storedValue, setValue];
};