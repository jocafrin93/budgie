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

    // Add debugging to see which storage system is being used
    console.log(`🔍 STORAGE DECISION for ${key}:`, {
        shouldUseCloudStorage,
        cloudIsLoading: cloudMeta.isLoading,
        cloudValue: cloudStorageResult[0],
        localValue: localStorageResult[0],
        finalChoice: shouldUseCloudStorage ? 'CLOUD' : 'LOCAL'
    });

    // Return the appropriate storage system based on cached decision
    if (shouldUseCloudStorage) {
        // For cloud storage, if still loading, return local data to prevent showing defaults
        if (cloudMeta.isLoading) {
            console.log(`🔍 CLOUD LOADING for ${key} - using local data temporarily`);
            return [
                localStorageResult[0], // Use local data while cloud loads
                localStorageResult[1],
                {
                    isLoading: true,
                    isAuthenticated: cloudMeta.isAuthenticated,
                    error: cloudMeta.error,
                    signIn: cloudMeta.signIn,
                    signOut: cloudMeta.signOut
                }
            ];
        }
        console.log(`🔍 USING CLOUD STORAGE for ${key}`);
        return cloudStorageResult;
    }

    console.log(`🔍 USING LOCAL STORAGE for ${key}`);
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
};
