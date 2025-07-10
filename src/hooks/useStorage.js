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
        // Return localStorage result in development
        return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: true, error: null, signIn: () => { } }];
    } else {
        // Return cloud storage result in production
        return cloudStorageResult;
    }
};