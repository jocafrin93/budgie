// src/hooks/useCloudStorage.js
import { useCallback, useEffect, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapi = null;
let isInitialized = false;

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Google API
    const initializeGapi = useCallback(async () => {
        if (isInitialized) return;

        try {
            // Load gapi if not already loaded
            if (!window.gapi) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://apis.google.com/js/api.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            gapi = window.gapi;
            await gapi.load('client:auth2', async () => {
                await gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: [DISCOVERY_DOC],
                    scope: SCOPES
                });

                const authInstance = gapi.auth2.getAuthInstance();
                setIsAuthenticated(authInstance.isSignedIn.get());

                // Listen for sign-in state changes
                authInstance.isSignedIn.listen(setIsAuthenticated);

                isInitialized = true;
            });
        } catch (err) {
            console.error('Google API initialization error:', err);
            setError(`Failed to initialize Google API: ${err?.message || err || 'Unknown error'}`);
        }
    }, []);

    // Sign in to Google
    const signIn = useCallback(async () => {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
        } catch (err) {
            setError(`Failed to sign in: ${err.message}`);
        }
    }, []);

    // Get file ID for our storage key
    const getFileId = useCallback(async (fileName) => {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${fileName}' and parents in 'appDataFolder'`,
                spaces: 'appDataFolder'
            });

            return response.result.files.length > 0 ? response.result.files[0].id : null;
        } catch (err) {
            console.error('Error getting file ID:', err);
            return null;
        }
    }, []);

    // Read data from Google Drive
    const readFromDrive = useCallback(async () => {
        if (!isAuthenticated) return defaultValue;

        try {
            const fileName = `budgie_${key}.json`;
            const fileId = await getFileId(fileName);

            if (!fileId) {
                return defaultValue;
            }

            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            return JSON.parse(response.body);
        } catch (err) {
            console.error('Error reading from Drive:', err);
            return defaultValue;
        }
    }, [key, defaultValue, isAuthenticated, getFileId]);

    // Write data to Google Drive
    const writeToDrive = useCallback(async (data) => {
        if (!isAuthenticated) return;

        try {
            const fileName = `budgie_${key}.json`;
            const fileId = await getFileId(fileName);
            const content = JSON.stringify(data, null, 2);

            const fileMetadata = {
                name: fileName,
                parents: ['appDataFolder']
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));

            const url = fileId
                ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
                : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

            const method = fileId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                },
                body: form
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(`Failed to save to Drive: ${err.message}`);
        }
    }, [key, isAuthenticated, getFileId]);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await initializeGapi();

            if (isAuthenticated) {
                const data = await readFromDrive();
                setValue(data);
            }

            setIsLoading(false);
        };

        loadData();
    }, [initializeGapi, readFromDrive, isAuthenticated]);

    // Save data when value changes
    useEffect(() => {
        if (!isLoading && isAuthenticated && value !== defaultValue) {
            writeToDrive(value);
        }
    }, [value, isLoading, isAuthenticated, writeToDrive, defaultValue]);

    const updateValue = useCallback((newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
    }, [value]);

    return [
        value,
        updateValue,
        {
            isLoading,
            isAuthenticated,
            error,
            signIn
        }
    ];
};
