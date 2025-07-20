// src/hooks/useCloudStorage.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCloudStorageManager } from './useCloudStorageManager.jsx';

export const useCloudStorage = (key, defaultValue) => {
    const { isAuthenticated, isLoading, readFromDrive, debouncedSave } = useCloudStorageManager();
    const [value, setValue] = useState(defaultValue);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Track previous auth state to detect changes
    const prevAuthStateRef = useRef({ isAuthenticated: false, isLoading: true });
    const hasLoggedInitialStateRef = useRef(false);

    // Load data when authentication state changes or initially
    useEffect(() => {
        const currentAuthState = { isAuthenticated, isLoading };
        const prevAuthState = prevAuthStateRef.current;

        // Check if auth state actually changed
        const authStateChanged =
            prevAuthState.isAuthenticated !== currentAuthState.isAuthenticated ||
            prevAuthState.isLoading !== currentAuthState.isLoading;

        // Only proceed if auth state changed or we haven't loaded initial data
        if (!authStateChanged && hasLoadedInitialData) {
            return;
        }

        // Update the ref
        prevAuthStateRef.current = currentAuthState;

        // Don't load if still loading
        if (isLoading) {
            return;
        }

        const loadData = async () => {
            setIsLoadingData(true);

            try {
                if (isAuthenticated) {
                    // Only log once per key to reduce console spam
                    if (!hasLoggedInitialStateRef.current) {
                        console.log(`📁 CLOUD STORAGE (${key}) - Loading from cloud...`);
                        hasLoggedInitialStateRef.current = true;
                    }

                    const cloudData = await readFromDrive(key, defaultValue);
                    setValue(cloudData);

                    if (!hasLoadedInitialData) {
                        console.log(`☁️ CLOUD STORAGE (${key}) - Cloud data loaded successfully`);
                    }
                } else {
                    // Use default value when not authenticated
                    setValue(defaultValue);

                    if (!hasLoadedInitialData && !hasLoggedInitialStateRef.current) {
                        console.log(`💾 CLOUD STORAGE (${key}) - Not authenticated, using default`);
                        hasLoggedInitialStateRef.current = true;
                    }
                }

                setHasLoadedInitialData(true);
            } catch (error) {
                console.error(`❌ CLOUD STORAGE (${key}) - Load failed:`, error);
                setValue(defaultValue);
                setHasLoadedInitialData(true);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadData();
    }, [isLoading, isAuthenticated, hasLoadedInitialData, key, defaultValue, readFromDrive]);

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

    // Return loading state during initial load or data loading
    if (!hasLoadedInitialData || isLoadingData) {
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
