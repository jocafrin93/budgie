// src/hooks/useCloudStorage.js
import { useState, useEffect, useCallback } from 'react';
import { useCloudStorageManager } from './useCloudStorageManager.jsx';

export const useCloudStorage = (key, defaultValue) => {
    const { isAuthenticated, isLoading, readFromDrive, debouncedSave } = useCloudStorageManager();
    const [value, setValue] = useState(defaultValue);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

    // Load initial data when cloud storage is ready
    useEffect(() => {
        if (isLoading || hasLoadedInitialData) return;

        const loadInitialData = async () => {
            try {
                if (isAuthenticated) {
                    console.log(`📁 CLOUD STORAGE (${key}) - Loading from cloud...`);
                    const cloudData = await readFromDrive(key, defaultValue);
                    console.log(`☁️ CLOUD STORAGE (${key}) - Using cloud data`);
                    setValue(cloudData);
                } else {
                    console.log(`💾 CLOUD STORAGE (${key}) - Not authenticated, using default`);
                    setValue(defaultValue);
                }

                setHasLoadedInitialData(true);
            } catch (error) {
                console.error(`❌ CLOUD STORAGE (${key}) - Load failed:`, error);
                setValue(defaultValue);
                setHasLoadedInitialData(true);
            }
        };

        loadInitialData();
    }, [isLoading, isAuthenticated, hasLoadedInitialData, key]); // Removed defaultValue and readFromDrive to prevent loops

    // Update function
    const updateValue = useCallback((newValue) => {
        setValue(prevValue => {
            const finalValue = typeof newValue === 'function' ? newValue(prevValue) : newValue;

            if (isAuthenticated && !isLoading) {
                debouncedSave(key, finalValue);
            }

            return finalValue;
        });
    }, [isAuthenticated, isLoading, debouncedSave, key]);

    // Return loading state during initial load
    if (!hasLoadedInitialData) {
        return [
            defaultValue,
            () => { },
            {
                isLoading: true,
                isAuthenticated,
                error: null
            }
        ];
    }

    return [
        value,
        updateValue,
        {
            isLoading: false,
            isAuthenticated,
            error: null
        }
    ];
};
