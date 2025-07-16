// src/hooks/useStorage.js (Replace your existing file)
import { useState, useEffect, useCallback } from 'react';
import { useCloudStorageManager } from './useCloudStorageManager.jsx';
import { useLocalStorage } from './useLocalStorage';

export const useCloudStorage = (key, defaultValue) => {
    const { isAuthenticated, isLoading, readFromDrive, debouncedSave } = useCloudStorageManager();
    const [localValue, setLocalValue] = useLocalStorage(key, defaultValue);

    const [value, setValue] = useState(defaultValue);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

    // Load initial data when cloud storage is ready
    useEffect(() => {
        if (isLoading || hasLoadedInitialData) return;

        const loadInitialData = async () => {
            try {
                if (isAuthenticated) {
                    console.log(`📁 STORAGE (${key}) - Loading from cloud...`);
                    const cloudData = await readFromDrive(key, defaultValue);

                    // Check for localStorage migration
                    const localData = localStorage.getItem(key);
                    const hasLocalData = localData &&
                        localData !== 'undefined' &&
                        localData !== JSON.stringify(defaultValue);
                    const hasCloudData = JSON.stringify(cloudData) !== JSON.stringify(defaultValue);

                    if (hasLocalData && !hasCloudData) {
                        console.log(`🔄 STORAGE (${key}) - Migrating localStorage to cloud`);
                        const parsedLocalData = JSON.parse(localData);
                        setValue(parsedLocalData);
                        debouncedSave(key, parsedLocalData);
                    } else {
                        console.log(`☁️ STORAGE (${key}) - Using cloud data`);
                        setValue(cloudData);
                    }
                } else {
                    console.log(`💾 STORAGE (${key}) - Using localStorage (not authenticated)`);
                    setValue(localValue);
                }

                setHasLoadedInitialData(true);
            } catch (error) {
                console.error(`❌ STORAGE (${key}) - Load failed:`, error);
                setValue(localValue);
                setHasLoadedInitialData(true);
            }
        };

        loadInitialData();
    }, [isLoading, isAuthenticated, hasLoadedInitialData, key, defaultValue, readFromDrive, debouncedSave, localValue]);

    // Update function
    const updateValue = useCallback((newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;

        setValue(finalValue);

        if (isAuthenticated && !isLoading) {
            debouncedSave(key, finalValue);
        } else {
            setLocalValue(finalValue);
        }
    }, [value, isAuthenticated, isLoading, debouncedSave, setLocalValue, key]);

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
