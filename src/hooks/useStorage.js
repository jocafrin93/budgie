// src/hooks/useStorage.js
import { useMemo, useRef, useCallback } from 'react';
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

// Global cache to prevent flickering across all storage instances
const storageDecisionCache = new Map();
const storageResultCache = new Map();
const recentWriteTimestamps = new Map(); // Track recent writes to prevent overwrites

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // Use refs to track previous values and prevent unnecessary recalculations
    const prevLocalValueRef = useRef();
    const prevCloudValueRef = useRef();
    const prevResultRef = useRef();

    // Check if we've already made a decision for this session
    const cacheKey = 'storage_decision';
    let shouldUseCloudStorage = storageDecisionCache.get(cacheKey);

    if (shouldUseCloudStorage === undefined) {
        // Make decision once per session based on current token state
        const storedToken = localStorage.getItem('google_access_token');
        const tokenExpiry = localStorage.getItem('google_token_expiry');
        const hasValidToken = storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry);

        shouldUseCloudStorage = hasValidToken;
        storageDecisionCache.set(cacheKey, shouldUseCloudStorage);

        console.log(`📋 STORAGE SESSION DECISION: ${shouldUseCloudStorage ? 'CLOUD' : 'LOCAL'} (cached for session)`);
    }

    // Memoized storage result calculation - only recalculate when values actually change
    const storageResult = useMemo(() => {
        const localValue = localStorageResult[0];
        const cloudValue = cloudStorageResult[0];

        // Check if values have actually changed
        const localChanged = prevLocalValueRef.current !== localValue;
        const cloudChanged = prevCloudValueRef.current !== cloudValue;

        // If nothing changed and we have a cached result, return it
        if (!localChanged && !cloudChanged && prevResultRef.current) {
            return prevResultRef.current;
        }

        // Update refs
        prevLocalValueRef.current = localValue;
        prevCloudValueRef.current = cloudValue;

        const debugKey = key === 'budgetCalc_planningItems';

        // Only log when values actually change
        if (debugKey && (localChanged || cloudChanged)) {
            console.log(`🔍 STORAGE VALUES CHANGED for ${key}:`, {
                shouldUseCloudStorage,
                cloudIsLoading: cloudMeta.isLoading,
                cloudValueLength: Array.isArray(cloudValue) ? cloudValue.length : 'not-array',
                localValueLength: Array.isArray(localValue) ? localValue.length : 'not-array',
                localChanged,
                cloudChanged,
                finalChoice: shouldUseCloudStorage ? 'CLOUD' : 'LOCAL'
            });
        }

        let result;

        if (shouldUseCloudStorage) {
            // For cloud storage, if still loading, return local data to prevent showing defaults
            if (cloudMeta.isLoading) {
                if (debugKey) console.log(`🔍 CLOUD LOADING for ${key} - using local data temporarily`);
                result = [
                    localValue,
                    localStorageResult[1],
                    {
                        isLoading: true,
                        isAuthenticated: cloudMeta.isAuthenticated,
                        error: cloudMeta.error,
                        signIn: cloudMeta.signIn,
                        signOut: cloudMeta.signOut
                    }
                ];
            } else {
                // CRITICAL FIX: Check if local storage has more recent data than cloud storage
                const cloudArray = Array.isArray(cloudValue) ? cloudValue : [];
                const localArray = Array.isArray(localValue) ? localValue : [];

                // Check for recent writes to prevent cloud overwrites
                const recentWriteTime = recentWriteTimestamps.get(key);
                const now = Date.now();
                const hasRecentWrite = recentWriteTime && (now - recentWriteTime) < 5000; // 5 second protection

                if (localArray.length > cloudArray.length || hasRecentWrite) {
                    if (debugKey) {
                        if (hasRecentWrite) {
                            console.log(`🛡️ WRITE PROTECTION ACTIVE for ${key}: preventing cloud overwrite (${now - recentWriteTime}ms ago)`);
                        } else {
                            console.log(`🔄 LOCAL DATA IS NEWER for ${key}: local(${localArray.length}) > cloud(${cloudArray.length}) - using local`);
                        }
                    }
                    result = [
                        localValue,
                        (newValue) => {
                            // Track write timestamp for protection
                            recentWriteTimestamps.set(key, Date.now());
                            // Update both local and cloud when local is used
                            localStorageResult[1](newValue);
                            cloudStorageResult[1](newValue);
                        },
                        {
                            isLoading: false,
                            isAuthenticated: cloudMeta.isAuthenticated,
                            error: cloudMeta.error,
                            signIn: cloudMeta.signIn,
                            signOut: cloudMeta.signOut
                        }
                    ];
                } else {
                    if (debugKey) console.log(`🔍 USING CLOUD STORAGE for ${key}`);
                    result = cloudStorageResult;
                }
            }
        } else {
            if (debugKey) console.log(`🔍 USING LOCAL STORAGE for ${key}`);
            result = [
                localValue,
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

        // Cache the result
        prevResultRef.current = result;
        return result;
    }, [
        localStorageResult[0],
        cloudStorageResult[0],
        cloudMeta.isLoading,
        cloudMeta.isAuthenticated,
        shouldUseCloudStorage,
        key
    ]);

    return storageResult;
};
