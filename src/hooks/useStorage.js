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

    if (isDevelopment) {
        // In development, use cloud storage if authenticated, otherwise localStorage
        const [cloudValue, setCloudValue, cloudMeta] = cloudStorageResult;

        if (cloudMeta.isAuthenticated && !cloudMeta.isLoading) {
            console.log(`🔄 STORAGE (${key}) - Using cloud storage in development (authenticated)`);
            return cloudStorageResult;
        } else {
            console.log(`🔄 STORAGE (${key}) - Using localStorage in development (not authenticated)`);
            return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: false, error: null, signIn: () => { } }];
        }
    } else {
        // Return cloud storage result in production
        return cloudStorageResult;
    }
};
