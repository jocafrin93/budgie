// src/hooks/useStorage.js
import { useEffect, useRef, useState } from 'react';
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // Track initialization state to prevent flickering
    const [hasDecided, setHasDecided] = useState(false);
    const [useCloud, setUseCloud] = useState(false);
    const decisionMadeRef = useRef(false);

    // Make storage decision once and stick with it
    useEffect(() => {
        // Only make decision once during initialization
        if (decisionMadeRef.current) return;

        // Wait for cloud storage to finish loading
        if (cloudMeta.isLoading) return;

        // Now make the decision and stick with it
        decisionMadeRef.current = true;
        const shouldUseCloud = cloudMeta.isAuthenticated;

        console.log(`📋 STORAGE (${key}) - Making storage decision: ${shouldUseCloud ? 'CLOUD' : 'LOCAL'}`);
        setUseCloud(shouldUseCloud);
        setHasDecided(true);
    }, [cloudMeta.isLoading, cloudMeta.isAuthenticated, key]);

    // Show loading state while deciding
    if (!hasDecided) {
        return [
            defaultValue, // Show default while deciding to prevent flicker
            () => { }, // Disabled setter during decision
            {
                isLoading: true,
                isAuthenticated: cloudMeta.isAuthenticated,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn,
                signOut: cloudMeta.signOut
            }
        ];
    }

    // Return the decided storage system
    if (useCloud) {
        console.log(`☁️ STORAGE (${key}) - Using CLOUD STORAGE`);
        return cloudStorageResult;
    } else {
        console.log(`💾 STORAGE (${key}) - Using localStorage`);
        return [
            localStorageResult[0],
            localStorageResult[1],
            {
                isLoading: false,
                isAuthenticated: cloudMeta.isAuthenticated,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn,
                signOut: cloudMeta.signOut
            }
        ];
    }
};
