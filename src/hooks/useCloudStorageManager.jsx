// src/hooks/useCloudStorageManager.jsx
// DEPRECATED: This hook is being phased out in favor of useSimpleStorage + useGoogleDriveSync
// Keeping as a safe stub to prevent errors during transition

/* eslint-disable no-unused-vars, react-refresh/only-export-components */
import { useCallback } from 'react';

/**
 * DEPRECATED: Safe stub for useCloudStorageManager
 * This prevents errors during the transition to simplified storage
 * All functionality has been moved to useSimpleStorage + useGoogleDriveSync
 */
export const useCloudStorageManager = () => {
    console.warn('useCloudStorageManager is deprecated. Use useSimpleStorage + useGoogleDriveSync instead.');

    return {
        isAuthenticated: false,
        isLoading: false,
        error: null,
        readFromDrive: useCallback(async (key, defaultValue) => {
            console.warn('readFromDrive is deprecated. Data is now stored in localStorage.');
            return defaultValue;
        }, []),
        debouncedSave: useCallback((key, data) => {
            console.warn('debouncedSave is deprecated. Data is now automatically saved to localStorage.');
        }, []),
        checkAuthState: useCallback(() => {
            console.warn('checkAuthState is deprecated. Use useGoogleDriveSync for cloud functionality.');
            return false;
        }, [])
    };
};

// Also export a no-op provider for any remaining references
export const CloudStorageProvider = ({ children }) => {
    console.warn('CloudStorageProvider is deprecated. It is no longer needed.');
    return children;
};
