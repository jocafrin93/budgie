// src/hooks/useStorage.js
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // Simple logic: use cloud if authenticated and not loading, otherwise use local
    if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
        console.log(`☁️ STORAGE (${key}) - Using CLOUD STORAGE`);
        return cloudStorageResult;
    }

    // Use local storage as fallback
    console.log(`💾 STORAGE (${key}) - Using localStorage fallback`);
    return [
        localStorageResult[0],
        localStorageResult[1],
        {
            isLoading: cloudMeta.isLoading,
            isAuthenticated: cloudMeta.isAuthenticated,
            error: cloudMeta.error,
            signIn: cloudMeta.signIn,
            signOut: cloudMeta.signOut
        }
    ];
};
