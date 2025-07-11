// src/hooks/useCloudStorage.js
import { useCallback, useEffect, useState } from 'react';

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // EMERGENCY DISABLE: Load data on mount
    useEffect(() => {
        // Completely disable cloud storage to stop infinite loops
        console.log('Cloud storage DISABLED - using local storage only');
        setIsLoading(false);
        setIsAuthenticated(false);
    }, []);

    const updateValue = useCallback((newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
    }, [value]);

    // Minimal signIn function to prevent errors
    const signIn = useCallback(async () => {
        console.log('Cloud storage disabled - sign in not available');
        setError('Cloud storage is temporarily disabled');
    }, []);

    return [
        value,
        updateValue,
        {
            isLoading,
            isAuthenticated,
            error,
            signIn
        }
    ];
};
