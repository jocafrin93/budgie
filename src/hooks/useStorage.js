// src/hooks/useStorage.js
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';
import { useState, useEffect, useCallback } from 'react';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [cloudValue, cloudSetter, cloudMeta] = cloudStorageResult;
    const [localValue, localSetter] = localStorageResult;

    // State to track if we've received the initial cloud data
    const [hasLoadedCloudData, setHasLoadedCloudData] = useState(false);
    const [finalValue, setFinalValue] = useState(defaultValue);

    // Handle cloud storage state changes
    useEffect(() => {
        if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            // Cloud storage is ready and authenticated
            console.log(`☁️ STORAGE (${key}) - Cloud storage ready, using cloud data`);
            setFinalValue(cloudValue);
            setHasLoadedCloudData(true);
        } else if (!cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            // Not authenticated, use localStorage
            console.log(`💾 STORAGE (${key}) - Not authenticated, using localStorage`);
            setFinalValue(localValue);
            setHasLoadedCloudData(true);
        } else if (cloudMeta.isLoading) {
            // Still loading - keep current value or default if this is initial load
            if (!hasLoadedCloudData) {
                console.log(`⏳ STORAGE (${key}) - Cloud storage loading, keeping current state`);
                // Don't change finalValue during loading to prevent flicker
            }
        }
    }, [cloudValue, cloudMeta.isAuthenticated, cloudMeta.isLoading, localValue, key, hasLoadedCloudData]);

    // Determine which setter to use
    const setValue = useCallback((newValue) => {
        if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            cloudSetter(newValue);
        } else {
            localSetter(newValue);
        }
        // Update final value immediately for responsive UI
        const finalNewValue = typeof newValue === 'function' ? newValue(finalValue) : newValue;
        setFinalValue(finalNewValue);
    }, [cloudMeta.isAuthenticated, cloudMeta.isLoading, cloudSetter, localSetter, finalValue]);

    // Determine the loading state
    const isLoading = cloudMeta.isLoading && !hasLoadedCloudData;

    // Return the appropriate state
    if (isLoading) {
        // Still loading cloud storage for the first time
        return [
            finalValue, // Keep current value during loading
            () => { }, // Disabled setter during loading
            {
                isLoading: true,
                isAuthenticated: cloudMeta.isAuthenticated,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn
            }
        ];
    }

    // Cloud storage is ready (authenticated or not)
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