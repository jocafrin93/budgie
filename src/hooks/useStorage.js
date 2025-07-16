// src/hooks/useStorage.js
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [cloudValue, cloudSetter, cloudMeta] = cloudStorageResult;
    const [localValue, localSetter] = localStorageResult;

    // State to track initialization and current value
    const [hasInitialized, setHasInitialized] = useState(false);
    const [finalValue, setFinalValue] = useState(defaultValue);

    // Use refs to track previous values and prevent unnecessary updates
    const prevCloudValueRef = useRef(cloudValue);
    const prevLocalValueRef = useRef(localValue);
    const prevAuthStateRef = useRef({
        isAuthenticated: cloudMeta.isAuthenticated,
        isLoading: cloudMeta.isLoading
    });

    // Single consolidated effect to handle all storage state changes
    useEffect(() => {
        const currentAuthState = {
            isAuthenticated: cloudMeta.isAuthenticated,
            isLoading: cloudMeta.isLoading
        };

        // Check if auth state changed
        const authStateChanged =
            prevAuthStateRef.current.isAuthenticated !== currentAuthState.isAuthenticated ||
            prevAuthStateRef.current.isLoading !== currentAuthState.isLoading;

        // Check if values changed
        const cloudValueChanged = prevCloudValueRef.current !== cloudValue;
        const localValueChanged = prevLocalValueRef.current !== localValue;

        // Only proceed if something actually changed or we haven't initialized yet
        if (!authStateChanged && !cloudValueChanged && !localValueChanged && hasInitialized) {
            return;
        }

        // Update refs
        prevAuthStateRef.current = currentAuthState;
        prevCloudValueRef.current = cloudValue;
        prevLocalValueRef.current = localValue;

        // Determine which value to use based on current state
        let newValue = finalValue; // Default to current value
        let shouldUpdate = false;
        let logMessage = '';

        if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            // Use cloud storage
            if (!hasInitialized || cloudValueChanged || authStateChanged) {
                newValue = cloudValue;
                shouldUpdate = true;
                logMessage = hasInitialized ?
                    `☁️ STORAGE (${key}) - Cloud value updated` :
                    `☁️ STORAGE (${key}) - Cloud storage ready, using cloud data`;
            }
        } else if (!cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            // Use local storage
            if (!hasInitialized || localValueChanged || authStateChanged) {
                newValue = localValue;
                shouldUpdate = true;
                logMessage = hasInitialized ?
                    `💾 STORAGE (${key}) - Local value updated` :
                    `💾 STORAGE (${key}) - Not authenticated, using localStorage`;
            }
        } else if (cloudMeta.isLoading && !hasInitialized) {
            // Still loading for the first time
            newValue = defaultValue;
            shouldUpdate = true;
            logMessage = `⏳ STORAGE (${key}) - First load, using defaultValue temporarily`;
        }

        // Only update state if there's an actual change
        if (shouldUpdate && newValue !== finalValue) {
            console.log(logMessage);
            setFinalValue(newValue);
        }

        // Mark as initialized once we've processed the initial state
        if (!hasInitialized && !cloudMeta.isLoading) {
            setHasInitialized(true);
        }
    }, [
        cloudMeta.isAuthenticated,
        cloudMeta.isLoading,
        cloudValue,
        localValue,
        hasInitialized,
        key,
        defaultValue,
        finalValue
    ]);

    // Stable setter function that doesn't change unless auth state changes
    const setValue = useCallback((newValue) => {
        setFinalValue(prevValue => {
            const resolvedValue = typeof newValue === 'function' ? newValue(prevValue) : newValue;

            // Update the appropriate storage
            if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
                cloudSetter(resolvedValue);
            } else {
                localSetter(resolvedValue);
            }

            return resolvedValue;
        });
    }, [cloudMeta.isAuthenticated, cloudMeta.isLoading, cloudSetter, localSetter]);

    // Determine the loading state
    const isLoading = cloudMeta.isLoading && !hasInitialized;

    // Return the appropriate state
    if (isLoading) {
        return [
            defaultValue,
            () => { }, // Disabled setter during loading
            {
                isLoading: true,
                isAuthenticated: cloudMeta.isAuthenticated,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn
            }
        ];
    }

    return [
        finalValue,
        setValue,
        {
            isLoading: false,
            isAuthenticated: cloudMeta.isAuthenticated,
            error: cloudMeta.error,
            signIn: cloudMeta.signIn,
            signOut: cloudMeta.signOut
        }
    ];
};
