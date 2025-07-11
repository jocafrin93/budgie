// src/hooks/useStorage.js
import { useCloudStorage } from './useCloudStorage';
import { useLocalStorage } from './useLocalStorage';

const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('localhost');

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);
    const cloudStorageResult = useCloudStorage(key, defaultValue);
    const [, , cloudMeta] = cloudStorageResult;

    // ALWAYS prioritize cloud storage when authenticated (dev AND production)
    if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
        console.log(`☁️ STORAGE (${key}) - Using CLOUD STORAGE (authenticated)`);
        return cloudStorageResult;
    }

    // Show loading state while cloud storage initializes
    if (cloudMeta.isLoading) {
        console.log(`⏳ STORAGE (${key}) - Loading cloud storage state...`);
        return [
            defaultValue, // Show default while loading to prevent flicker
            () => { }, // Disabled setter during loading
            {
                isLoading: true,
                isAuthenticated: false,
                error: cloudMeta.error,
                signIn: cloudMeta.signIn
            }
        ];
    }

    // Fallback to localStorage only when cloud storage is not authenticated
    console.log(`💾 STORAGE (${key}) - Using localStorage fallback (not authenticated)`);
    return [
        localStorageResult[0],
        localStorageResult[1],
        {
            isLoading: false,
            isAuthenticated: false,
            error: cloudMeta.error,
            signIn: cloudMeta.signIn
        }
    ];
};
