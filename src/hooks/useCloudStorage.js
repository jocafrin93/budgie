// src/hooks/useCloudStorage.js
import { useCallback, useEffect, useRef, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Rate limiting and debouncing
const DEBOUNCE_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let gapi = null;
let isInitialized = false;
let initializationPromise = null;

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Refs for debouncing and preventing infinite loops
    const saveTimeoutRef = useRef(null);
    const lastSavedValueRef = useRef(null);
    const isSavingRef = useRef(false);
    const retryCountRef = useRef(0);
    const circuitBreakerRef = useRef(false);

    // Check for existing authentication
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

    // Get file ID with retry logic using OAuth token
    const getFileId = useCallback(async (fileName, retryCount = 0) => {
        if (circuitBreakerRef.current) {
            throw new Error('Circuit breaker open - too many failures');
        }

        try {
            const storedToken = localStorage.getItem('google_access_token');
            if (!storedToken) {
                throw new Error('No access token available for Drive access');
            }

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const files = data.files;
            return files && files.length > 0 ? files[0].id : null;
        } catch (err) {
            console.error(`Error getting file ID (attempt ${retryCount + 1}):`, err);

            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
                return getFileId(fileName, retryCount + 1);
            }

            // Open circuit breaker after max retries
            if (retryCount >= MAX_RETRIES) {
                circuitBreakerRef.current = true;
                setTimeout(() => {
                    circuitBreakerRef.current = false;
                }, 30000); // Reset after 30 seconds
            }

            throw err;
        }
    }, []);

    // Read data from Google Drive with error handling using OAuth token
    const readFromDrive = useCallback(async () => {
        if (!isAuthenticated || circuitBreakerRef.current) return defaultValue;

        try {
            const fileName = `budgie_${key}.json`;
            const fileId = await getFileId(fileName);

            if (!fileId) {
                console.log(`No existing file found for ${fileName}`);
                return defaultValue;
            }

            const storedToken = localStorage.getItem('google_access_token');
            if (!storedToken) {
                throw new Error('No access token available for Drive read');
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const content = await response.text();
            const data = JSON.parse(content);
            console.log(`Successfully loaded data from Google Drive: ${fileName}`);
            return data;
        } catch (err) {
            console.error('Error reading from Drive:', err);
            setError(`Failed to load from Drive: ${err.message}`);
            return defaultValue;
        }
    }, [key, defaultValue, isAuthenticated, getFileId]);

    // Write data to Google Drive with debouncing and deduplication
    const writeToDrive = useCallback(async (data) => {
        if (!isAuthenticated || isSavingRef.current || circuitBreakerRef.current) return;

        // Prevent saving the same data multiple times
        const dataString = JSON.stringify(data);
        if (lastSavedValueRef.current === dataString) {
            console.log('Data unchanged, skipping save to Drive');
            return;
        }

        isSavingRef.current = true;

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

            lastSavedValueRef.current = dataString;
            retryCountRef.current = 0; // Reset retry count on success
            console.log('Successfully saved to Google Drive:', fileName);
            setError(null);
        } catch (err) {
            console.error('Error saving to Drive:', err);
            setError(`Failed to save to Drive: ${err.message}`);

            retryCountRef.current++;
            if (retryCountRef.current >= MAX_RETRIES) {
                circuitBreakerRef.current = true;
                setTimeout(() => {
                    circuitBreakerRef.current = false;
                    retryCountRef.current = 0;
                }, 30000);
            }
        } finally {
            isSavingRef.current = false;
        }
    }, [key, isAuthenticated, getFileId]);

    // Debounced save function
    const debouncedSave = useCallback((data) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            writeToDrive(data);
        }, DEBOUNCE_DELAY);
    }, [writeToDrive]);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);

            // Check for existing authentication first
            const hasAuth = checkAuthState();

            if (hasAuth) {
                await initializeGapi();

                if (isAuthenticated) {
                    console.log('Loading data from Google Drive...');
                    const data = await readFromDrive();
                    setValue(data);
                } else {
                    console.log('Not authenticated, using default value');
                    setValue(defaultValue);
                }
            } else {
                setValue(defaultValue);
            }

            setIsLoading(false);
        };

        loadData();
    }, [checkAuthState, initializeGapi, readFromDrive, isAuthenticated, defaultValue]);

    // Save data when value changes (with debouncing)
    useEffect(() => {
        if (!isLoading && isAuthenticated && value !== defaultValue) {
            debouncedSave(value);
        }

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [value, isLoading, isAuthenticated, debouncedSave, defaultValue]);

    const updateValue = useCallback((newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
    }, [value]);

    // Minimal signIn function (authentication handled by useCloudStorageStatus)
    const signIn = useCallback(async () => {
        console.log('Please use the Google Sign-In button in settings');
        setError('Please sign in through the settings page');
    }, []);

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
