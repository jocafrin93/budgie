// src/hooks/useCloudStorage.js
import { useEffect, useRef, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Rate limiting and debouncing
const DEBOUNCE_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

let gapi = null;
let isInitialized = false;

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Refs to prevent infinite loops
    const saveTimeoutRef = useRef(null);
    const lastSavedValueRef = useRef(null);
    const isSavingRef = useRef(false);
    const isLoadingRef = useRef(false);
    const retryCountRef = useRef(0);
    const circuitBreakerRef = useRef(false);
    const hasInitializedRef = useRef(false);

    // Stable function references using refs
    const checkAuthStateRef = useRef();
    const initializeGapiRef = useRef();
    const getFileIdRef = useRef();
    const readFromDriveRef = useRef();
    const writeToDriveRef = useRef();

    // Check authentication state
    checkAuthStateRef.current = () => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');

            console.log('DEBUG - Checking auth state:');
            console.log('- Token exists:', !!storedToken);
            console.log('- Token expiry:', tokenExpiry);
            console.log('- Current time:', Date.now());

            if (storedToken && tokenExpiry) {
                const now = Date.now();
                const expiry = parseInt(tokenExpiry);

                console.log('- Token valid:', now < expiry);

                if (now < expiry) {
                    console.log('Found valid Google token for cloud storage');
                    setIsAuthenticated(true);
                    return true;
                } else {
                    console.log('Google token expired for cloud storage');
                    localStorage.removeItem('google_access_token');
                    localStorage.removeItem('google_token_expiry');
                    setIsAuthenticated(false);
                }
            } else {
                console.log('No valid token found - cloud storage disabled');
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('Error checking auth state:', err);
            setIsAuthenticated(false);
        }
        return false;
    };

    // Initialize Google API
    initializeGapiRef.current = async () => {
        if (isInitialized) return;

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
        }
    };

    // Get file ID using OAuth token
    getFileIdRef.current = async (fileName, retryCount = 0) => {
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
                return getFileIdRef.current(fileName, retryCount + 1);
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
    };

    // Read data from Google Drive
    readFromDriveRef.current = async () => {
        if (!isAuthenticated || circuitBreakerRef.current || isLoadingRef.current) {
            return defaultValue;
        }

        isLoadingRef.current = true;

        try {
            const fileName = `budgie_${key}.json`;
            const fileId = await getFileIdRef.current(fileName);

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
            console.log('Loaded data content:', data);
            return data;
        } catch (err) {
            console.error('Error reading from Drive:', err);
            setError(`Failed to load from Drive: ${err.message}`);
            return defaultValue;
        } finally {
            isLoadingRef.current = false;
        }
    };

    // Write data to Google Drive
    writeToDriveRef.current = async (data) => {
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
            const fileId = await getFileIdRef.current(fileName);
            const content = JSON.stringify(data, null, 2);

            // Different metadata for create vs update
            const fileMetadata = fileId
                ? { name: fileName } // Update: only name, no parents
                : { name: fileName, parents: ['appDataFolder'] }; // Create: include parents

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
    };

    // Initialize on mount - NO DEPENDENCIES TO PREVENT LOOPS
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const initialize = async () => {
            console.log('DEBUG: Starting cloud storage initialization for key:', key);
            setIsLoading(true);

            // Check authentication
            const hasAuth = checkAuthStateRef.current();
            console.log('DEBUG: Has auth?', hasAuth);

            if (hasAuth) {
                try {
                    await initializeGapiRef.current();
                    console.log('DEBUG: GAPI initialized, isAuthenticated:', isAuthenticated);

                    if (isAuthenticated) {
                        console.log('Loading data from Google Drive...');
                        const data = await readFromDriveRef.current();
                        console.log('DEBUG: Data loaded, setting value:', data);
                        setValue(data);
                    } else {
                        console.log('DEBUG: Not authenticated, using default value');
                        setValue(defaultValue);
                    }
                } catch (err) {
                    console.error('Initialization error:', err);
                    console.log('DEBUG: Error occurred, using default value');
                    setValue(defaultValue);
                }
            } else {
                console.log('DEBUG: No auth, using default value');
                setValue(defaultValue);
            }

            console.log('DEBUG: Initialization complete, setting loading to false');
            setIsLoading(false);
        };

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // EMPTY DEPENDENCIES - CRITICAL FOR PREVENTING LOOPS

    // Save data when value changes (debounced)
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;

        // Don't save if value is exactly the same as defaultValue (deep comparison for arrays/objects)
        if (JSON.stringify(value) === JSON.stringify(defaultValue)) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounced save
        saveTimeoutRef.current = setTimeout(() => {
            writeToDriveRef.current(value);
        }, DEBOUNCE_DELAY);

        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [value, isLoading, isAuthenticated, defaultValue]);

    // Update value function
    const updateValue = (newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
    };

    // Sign in function
    const signIn = async () => {
        console.log('Please use the Google Sign-In button in settings');
        setError('Please sign in through the settings page');
    };

    // Sign out function
    const signOut = async () => {
        try {
            console.log('Signing out of Google Drive...');

            // Clear stored tokens
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');

            // Reset state
            setIsAuthenticated(false);
            setError(null);

            // Reset circuit breaker
            circuitBreakerRef.current = false;
            retryCountRef.current = 0;

            console.log('Successfully signed out of Google Drive');

            return { success: true };
        } catch (err) {
            console.error('Error signing out:', err);
            setError(`Failed to sign out: ${err.message}`);
            return { success: false, error: err.message };
        }
    };

    return [
        value,
        updateValue,
        {
            isLoading,
            isAuthenticated,
            error,
            signIn,
            signOut
        }
    ];
};
