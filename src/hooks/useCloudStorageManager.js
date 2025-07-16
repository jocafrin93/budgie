// src/hooks/useCloudStorageManager.js
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const DEBOUNCE_DELAY = 1500;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

// Global state
let gapi = null;
let isInitialized = false;
let initializationPromise = null;

// Create context for cloud storage
const CloudStorageContext = createContext();

export const CloudStorageProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Global refs
    const saveTimeoutsRef = useRef(new Map());
    const lastSavedValuesRef = useRef(new Map());
    const dataCache = useRef(new Map());
    const initPromiseRef = useRef(null);

    // Check authentication state
    const checkAuthState = useCallback(() => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');

            if (storedToken && tokenExpiry) {
                const now = Date.now();
                const expiry = parseInt(tokenExpiry);

                if (now < expiry) {
                    console.log('Cloud Storage Manager: Valid token found');
                    setIsAuthenticated(true);
                    return true;
                } else {
                    console.log('Cloud Storage Manager: Token expired');
                    localStorage.removeItem('google_access_token');
                    localStorage.removeItem('google_token_expiry');
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('Cloud Storage Manager: Auth check error:', err);
            setIsAuthenticated(false);
        }
        return false;
    }, []);

    // Initialize Google API (once for all hooks)
    const initializeGapi = useCallback(async () => {
        if (isInitialized) return;
        if (initializationPromise) return initializationPromise;

        initializationPromise = (async () => {
            try {
                console.log('Cloud Storage Manager: Initializing Google API...');

                if (!window.gapi) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://apis.google.com/js/api.js';
                        script.onload = resolve;
                        script.onerror = () => reject(new Error('Failed to load Google API script'));
                        document.head.appendChild(script);
                    });
                }

                gapi = window.gapi;

                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error('Google API initialization timeout'));
                    }, 10000);

                    gapi.load('client', async () => {
                        try {
                            clearTimeout(timeoutId);
                            await gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: [DISCOVERY_DOC]
                            });

                            isInitialized = true;
                            console.log('Cloud Storage Manager: Google API initialized successfully');
                            resolve();
                        } catch (initError) {
                            clearTimeout(timeoutId);
                            reject(initError);
                        }
                    });
                });
            } catch (err) {
                console.error('Cloud Storage Manager: Failed to initialize Google API:', err);
                throw err;
            }
        })();

        return initializationPromise;
    }, []);

    // Get file ID for a key
    const getFileId = useCallback(async (key) => {
        const storedToken = localStorage.getItem('google_access_token');
        if (!storedToken) throw new Error('No access token available');

        const fileName = `budgie_${key}.json`;
        const query = encodeURIComponent(`name='${fileName}' and parents in 'appDataFolder'`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return data.files?.length > 0 ? data.files[0].id : null;
    }, []);

    // Read data from Google Drive
    const readFromDrive = useCallback(async (key, defaultValue) => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');
            const hasValidToken = storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry);

            if (!hasValidToken) {
                console.log(`Cloud Storage Manager: No valid token for ${key}`);
                return defaultValue;
            }

            const fileId = await getFileId(key);
            if (!fileId) {
                console.log(`Cloud Storage Manager: No file found for ${key}`);
                return defaultValue;
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${storedToken}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const content = await response.text();
            const data = JSON.parse(content);

            console.log(`Cloud Storage Manager: Successfully loaded ${key}`);
            dataCache.current.set(key, data);
            return data;
        } catch (err) {
            console.error(`Cloud Storage Manager: Failed to read ${key}:`, err);
            return defaultValue;
        }
    }, [getFileId]);

    // Write data to Google Drive
    const writeToDrive = useCallback(async (key, data) => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            if (!storedToken) return;

            const dataString = JSON.stringify(data);
            const lastSaved = lastSavedValuesRef.current.get(key);

            if (lastSaved === dataString) {
                console.log(`Cloud Storage Manager: No changes for ${key}, skipping save`);
                return;
            }

            const fileName = `budgie_${key}.json`;
            const fileId = await getFileId(key);
            const content = JSON.stringify(data, null, 2);

            const fileMetadata = fileId
                ? { name: fileName }
                : { name: fileName, parents: ['appDataFolder'] };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
            form.append('file', new Blob([content], { type: 'application/json' }));

            const url = fileId
                ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
                : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

            const response = await fetch(url, {
                method: fileId ? 'PATCH' : 'POST',
                headers: { 'Authorization': `Bearer ${storedToken}` },
                body: form
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            lastSavedValuesRef.current.set(key, dataString);
            dataCache.current.set(key, data);
            console.log(`Cloud Storage Manager: Successfully saved ${key}`);
        } catch (err) {
            console.error(`Cloud Storage Manager: Failed to save ${key}:`, err);
            setError(`Failed to save ${key}: ${err.message}`);
        }
    }, [getFileId]);

    // Debounced save function
    const debouncedSave = useCallback((key, data) => {
        const existingTimeout = saveTimeoutsRef.current.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeoutId = setTimeout(() => {
            writeToDrive(key, data);
            saveTimeoutsRef.current.delete(key);
        }, DEBOUNCE_DELAY);

        saveTimeoutsRef.current.set(key, timeoutId);
    }, [writeToDrive]);

    // Initialize on mount
    useEffect(() => {
        const initialize = async () => {
            if (initPromiseRef.current) return initPromiseRef.current;

            initPromiseRef.current = (async () => {
                console.log('Cloud Storage Manager: Starting initialization...');
                setIsLoading(true);
                setError(null);

                try {
                    const hasAuth = checkAuthState();

                    if (hasAuth) {
                        await initializeGapi();
                        console.log('Cloud Storage Manager: Initialization complete');
                    } else {
                        console.log('Cloud Storage Manager: Not authenticated');
                    }
                } catch (err) {
                    console.error('Cloud Storage Manager: Initialization failed:', err);
                    setError(`Initialization failed: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            })();

            return initPromiseRef.current;
        };

        initialize();
    }, [checkAuthState, initializeGapi]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            saveTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
            saveTimeoutsRef.current.clear();
        };
    }, []);

    const value = {
        isAuthenticated,
        isLoading,
        error,
        readFromDrive,
        debouncedSave,
        checkAuthState
    };

    return (
        <CloudStorageContext.Provider value={value}>
            {children}
        </CloudStorageContext.Provider>
    );
};

// Hook to use cloud storage manager
export const useCloudStorageManager = () => {
    const context = useContext(CloudStorageContext);
    if (!context) {
        throw new Error('useCloudStorageManager must be used within CloudStorageProvider');
    }
    return context;
};