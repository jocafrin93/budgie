// src/hooks/useStorage.js
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

// Global cache to prevent flickering across all storage instances
const storageDecisionCache = new Map();

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // Check if we've already made a decision for this session
    const cacheKey = 'storage_decision';
    let useCloudStorage = storageDecisionCache.get(cacheKey);

    if (useCloudStorage === undefined) {
        // Make decision once per session based on current token state
        const storedToken = localStorage.getItem('google_access_token');
        const tokenExpiry = localStorage.getItem('google_token_expiry');
        const hasValidToken = storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry);

        useCloudStorage = hasValidToken;
        storageDecisionCache.set(cacheKey, useCloudStorage);

        console.log(`📋 STORAGE SESSION DECISION: ${useCloudStorage ? 'CLOUD' : 'LOCAL'} (cached for session)`);
    }

    // Return the appropriate storage system based on cached decision
    if (useCloudStorage) {
        return cloudStorageResult;
    } else {
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
