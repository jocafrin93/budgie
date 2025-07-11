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

    // TEMPORARY: Use localStorage in production until Google API is fixed
    // This allows access to the app while we fix the Google API configuration
    return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: false, error: 'Google API configuration in progress', signIn: () => { } }];

    // Original logic (commented out temporarily):
    // if (isDevelopment) {
    //     // Return localStorage result in development
    //     return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: true, error: null, signIn: () => { } }];
    // } else {
    //     // Return cloud storage result in production
    //     return cloudStorageResult;
    // }
};
