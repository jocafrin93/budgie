// src/hooks/useStorage.js
import { useEffect, useRef, useState } from 'react';
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // Track which storage system we're using to prevent flickering
    const [storageMode, setStorageMode] = useState('determining'); // 'determining', 'cloud', 'local'
    const [stableValue, setStableValue] = useState(defaultValue);
    const [stableSetter, setStableSetter] = useState(() => () => { });
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        // Only run this logic once during initialization
        if (hasInitializedRef.current) return;

        // Wait for cloud storage to finish loading before making a decision
        if (cloudMeta.isLoading) {
            console.log(`⏳ STORAGE (${key}) - Still loading cloud storage...`);
            return;
        }

        // Now we can make a stable decision
        hasInitializedRef.current = true;

        if (cloudMeta.isAuthenticated) {
            console.log(`☁️ STORAGE (${key}) - Switching to CLOUD STORAGE (authenticated)`);
            setStorageMode('cloud');
            setStableValue(cloudStorageResult[0]);
            setStableSetter(() => cloudStorageResult[1]);
        } else {
            console.log(`💾 STORAGE (${key}) - Using localStorage (not authenticated)`);
            setStorageMode('local');
            setStableValue(localStorageResult[0]);
            setStableSetter(() => localStorageResult[1]);
        }
    }, [cloudMeta.isLoading, cloudMeta.isAuthenticated, key]);

    // Update stable value when the active storage changes
    useEffect(() => {
        if (storageMode === 'cloud') {
            setStableValue(cloudStorageResult[0]);
            setStableSetter(() => cloudStorageResult[1]);
        } else if (storageMode === 'local') {
            setStableValue(localStorageResult[0]);
            setStableSetter(() => localStorageResult[1]);
        }
    }, [storageMode, cloudStorageResult, localStorageResult]);

    // Return loading state while determining which storage to use
    if (storageMode === 'determining') {
        return [
            defaultValue, // Show default while determining to prevent flicker
            () => { }, // Disabled setter during determination
            {
                isLoading: true,
                isAuthenticated: cloudMeta.isAuthenticated,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn,
                signOut: cloudMeta.signOut
            }
        ];
    }

    // Return the stable storage result
    return [
        stableValue,
        stableSetter,
        {
            isLoading: false,
            isAuthenticated: cloudMeta.isAuthenticated,
            error: cloudMeta.error,
            signIn: cloudMeta.signIn,
            signOut: cloudMeta.signOut
        }
    ];
};
