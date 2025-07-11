// src/hooks/useStorage.js
import { useLocalStorage } from './useLocalStorage';

export const useStorage = (key, defaultValue) => {
    const localStorageResult = useLocalStorage(key, defaultValue);

    // TEMPORARY: Use localStorage in production until Google API is fixed
    // This allows access to the app while we fix the Google API configuration
    return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: false, error: 'Google API configuration in progress', signIn: () => { } }];

    // Original cloud storage logic (commented out temporarily):
    // import { useCloudStorage } from './useCloudStorage';
    // const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('localhost');
    // const cloudStorageResult = useCloudStorage(key, defaultValue);
    // if (isDevelopment) {
    //     return [localStorageResult[0], localStorageResult[1], { isLoading: false, isAuthenticated: true, error: null, signIn: () => { } }];
    // } else {
    //     return cloudStorageResult;
    // }
};
