// src/hooks/useCloudStorage.js
import { useCallback, useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let gapi = null;
let isInitialized = false;
let initializationPromise = null;

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Check for existing token and set auth state
    const checkAuthState = useCallback(() => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');

            if (storedToken && tokenExpiry) {
                const now = Date.now();
                const expiry = parseInt(tokenExpiry);

                if (now < expiry) {
                    console.log('Found valid Google token for cloud storage');
                    setIsAuthenticated(true);

                    // Set the token for gapi if available
                    if (window.gapi?.client) {
                        window.gapi.client.setToken({
                            access_token: storedToken
                        });
                    }
                    return true;
                } else {
                    console.log('Google token expired for cloud storage');
                    localStorage.removeItem('google_access_token');
                    localStorage.removeItem('google_token_expiry');
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('Error checking auth state:', err);
            setIsAuthenticated(false);
        }
        return false;
    }, []);

    // Initialize Google API
    const initializeGapi = useCallback(async () => {
        if (isInitialized) return;
        if (initializationPromise) return initializationPromise;

        initializationPromise = (async () => {
            try {
                console.log('Initializing Google API for cloud storage...');

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

                await new Promise((resolve, reject) => {
                    gapi.load('client', async () => {
                        try {
                            await gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: [DISCOVERY_DOC]
                            });

                            isInitialized = true;
                            console.log('Google API initialized for cloud storage');
                            resolve();
                        } catch (initError) {
                            console.error('Error during gapi client init:', initError);
                            reject(initError);
                        }
                    });
                });
            } catch (err) {
                console.error('Google API initialization error:', err);
                setError(`Failed to initialize Google API: ${err?.message || err || 'Unknown error'}`);
                throw err;
            } finally {
                initializationPromise = null;
            }
        })();

        return initializationPromise;
    }, []);

    // Sign in to Google
    const signIn = useCallback(async () => {
        try {
            if (!gapi || !isInitialized) {
                throw new Error('Google API not initialized');
            }

            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance) {
                throw new Error('Google Auth instance not available');
            }

            await authInstance.signIn();
        } catch (err) {
            console.error('Google Sign-In error:', err);
            const errorMessage = err?.error || err?.message || err?.toString() || 'Unknown error occurred';
            setError(`Failed to sign in: ${errorMessage}`);
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
            const storedToken = localStorage.getItem('google_access_token');
            if (!storedToken) {
                console.error('No access token available for Drive write');
                return;
            }

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

            console.log(`${method === 'PATCH' ? 'Updating' : 'Creating'} file in Google Drive:`, fileName);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                },
                body: form
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Successfully saved to Google Drive:', fileName);
        } catch (err) {
            console.error('Error saving to Drive:', err);
            setError(`Failed to save to Drive: ${err.message}`);
        }
    }, [key, isAuthenticated, getFileId]);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);

            // Check for existing authentication first
            checkAuthState();

            await initializeGapi();

            if (isAuthenticated) {
                console.log('Loading data from Google Drive...');
                const data = await readFromDrive();
                setValue(data);
            } else {
                console.log('Not authenticated, using default value');
            }

            setIsLoading(false);
        };

        loadData();
    }, [initializeGapi, readFromDrive, isAuthenticated, checkAuthState]);

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
