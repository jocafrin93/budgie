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

    // Debug logging
    console.log('useStorage DEBUG:', {
        key,
        isDevelopment,
        hostname: window.location.hostname,
        usingCloudStorage: !isDevelopment
    });

    if (isDevelopment) {
        // Return localStorage result in development
        console.log(`useStorage: Using localStorage for ${key} (development mode)`);
        return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: true, error: null, signIn: () => { } }];
    } else {
        // Return cloud storage result in production
        console.log(`useStorage: Using cloud storage for ${key} (production mode)`);
        console.log('Cloud storage state:', {
            isLoading: cloudStorageResult[2]?.isLoading,
            isAuthenticated: cloudStorageResult[2]?.isAuthenticated,
            error: cloudStorageResult[2]?.error
        });
        return cloudStorageResult;
    }
};
