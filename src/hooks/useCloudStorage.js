// src/hooks/useCloudStorage.js
import { useEffect, useRef, useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Configuration constants
const DEBOUNCE_DELAY = 1500; // Reduced to 1.5 seconds for better responsiveness
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;
const CIRCUIT_BREAKER_TIMEOUT = 30000;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

let gapi = null;
let isInitialized = false;

export const useCloudStorage = (key, defaultValue) => {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Refs for state management
    const saveTimeoutRef = useRef(null);
    const lastSavedValueRef = useRef(null);
    const isSavingRef = useRef(false);
    const isLoadingRef = useRef(false);
    const retryCountRef = useRef(0);
    const circuitBreakerRef = useRef(false);
    const hasInitializedRef = useRef(false);
    const saveQueueRef = useRef([]);
    const isProcessingQueueRef = useRef(false);
    const pendingOperationsRef = useRef(new Set());

    // Stable function references
    const checkAuthStateRef = useRef();
    const initializeGapiRef = useRef();
    const getFileIdRef = useRef();
    const readFromDriveRef = useRef();
    const writeToDriveRef = useRef();
    const refreshTokenIfNeededRef = useRef();

    // Utility: Check if error is retryable
    const isRetryableError = (error) => {
        const status = error.status || error.code;
        return (
            status >= 500 ||
            status === 429 ||
            status === 408 ||
            !navigator.onLine ||
            error.message?.includes('network') ||
            error.message?.includes('timeout')
        );
    };

    // Utility: Exponential backoff retry
    const retryWithBackoff = async (fn, maxRetries = MAX_RETRIES, operation = 'operation') => {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (!isRetryableError(error) || attempt === maxRetries - 1) {
                    throw error;
                }

                const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
                console.warn(`${operation} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    };

    // Check and refresh token if needed
    refreshTokenIfNeededRef.current = () => {
        const tokenExpiry = localStorage.getItem('google_token_expiry');

        if (tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry);
            const now = Date.now();

            if (now > (expiryTime - TOKEN_REFRESH_BUFFER)) {
                console.log('Token is expiring soon, marking as unauthenticated');
                setIsAuthenticated(false);
                setError('Authentication token expired. Please sign in again.');
                return false;
            }
        }

        return true;
    };

    // Enhanced authentication state check
    checkAuthStateRef.current = () => {
        try {
            const storedToken = localStorage.getItem('google_access_token');
            const tokenExpiry = localStorage.getItem('google_token_expiry');

            if (!storedToken || !tokenExpiry) {
                setIsAuthenticated(false);
                return false;
            }

            const now = Date.now();
            const expiry = parseInt(tokenExpiry);

            if (now < expiry) {
                setIsAuthenticated(true);
                return true;
            } else {
                console.log('Google token expired, clearing storage');
                localStorage.removeItem('google_access_token');
                localStorage.removeItem('google_token_expiry');
                setIsAuthenticated(false);
                return false;
            }
        } catch (err) {
            console.error('Error checking auth state:', err);
            setIsAuthenticated(false);
            return false;
        }
    };

    // Initialize Google API with better error handling
    initializeGapiRef.current = async () => {
        if (isInitialized) return;

        try {
            // Load gapi if not already loaded
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
                        console.log('Google API initialized successfully');
                        resolve();
                    } catch (initError) {
                        clearTimeout(timeoutId);
                        reject(initError);
                    }
                });
            });
        } catch (err) {
            console.error('Google API initialization failed:', err);
            setError(`Failed to initialize Google API: ${err.message}`);
            throw err;
        }
    };

    // Enhanced file ID retrieval with better error handling
    getFileIdRef.current = async (fileName) => {
        const operationId = `getFileId-${fileName}-${Date.now()}`;

        if (circuitBreakerRef.current) {
            throw new Error('Service temporarily unavailable (circuit breaker open)');
        }

        if (pendingOperationsRef.current.has(operationId)) {
            throw new Error('Duplicate operation in progress');
        }

        pendingOperationsRef.current.add(operationId);

        try {
            return await retryWithBackoff(async () => {
                const storedToken = localStorage.getItem('google_access_token');
                if (!storedToken) {
                    throw new Error('No access token available');
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
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                return data.files?.length > 0 ? data.files[0].id : null;
            }, MAX_RETRIES, `Get file ID for ${fileName}`);
        } catch (err) {
            if (retryCountRef.current >= MAX_RETRIES) {
                circuitBreakerRef.current = true;
                setTimeout(() => {
                    circuitBreakerRef.current = false;
                    retryCountRef.current = 0;
                }, CIRCUIT_BREAKER_TIMEOUT);
            }
            throw err;
        } finally {
            pendingOperationsRef.current.delete(operationId);
        }
    };

    // Enhanced read from Drive with better error handling
    readFromDriveRef.current = async () => {
        if (isLoadingRef.current || circuitBreakerRef.current) {
            return defaultValue;
        }

        // Check token validity before proceeding
        if (!refreshTokenIfNeededRef.current()) {
            return defaultValue;
        }

        isLoadingRef.current = true;

        try {
            return await retryWithBackoff(async () => {
                const fileName = `budgie_${key}.json`;
                const fileId = await getFileIdRef.current(fileName);

                if (!fileId) {
                    console.log(`No existing file found for ${fileName}`);
                    return defaultValue;
                }

                const storedToken = localStorage.getItem('google_access_token');
                if (!storedToken) {
                    throw new Error('No access token available for read operation');
                }

                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const content = await response.text();
                const data = JSON.parse(content);

                console.log(`Successfully loaded data from Google Drive: ${fileName}`);
                return data;
            }, MAX_RETRIES, `Read from Drive (${key})`);
        } catch (err) {
            console.error('Error reading from Drive:', err);
            setError(`Failed to load from Drive: ${err.message}`);
            return defaultValue;
        } finally {
            isLoadingRef.current = false;
        }
    };

    // Enhanced write to Drive with queue management
    writeToDriveRef.current = async (data) => {
        if (!isAuthenticated || isSavingRef.current || circuitBreakerRef.current) {
            return;
        }

        // Check token validity before proceeding
        if (!refreshTokenIfNeededRef.current()) {
            return;
        }

        const dataString = JSON.stringify(data);
        if (lastSavedValueRef.current === dataString) {
            return; // No changes to save
        }

        isSavingRef.current = true;

        try {
            await retryWithBackoff(async () => {
                const storedToken = localStorage.getItem('google_access_token');
                if (!storedToken) {
                    throw new Error('No access token available for write operation');
                }

                const fileName = `budgie_${key}.json`;
                const fileId = await getFileIdRef.current(fileName);
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

                const method = fileId ? 'PATCH' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${storedToken}`
                    },
                    body: form
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                lastSavedValueRef.current = dataString;
                retryCountRef.current = 0;
                setError(null);

                console.log(`Successfully saved to Google Drive: ${fileName}`);
            }, MAX_RETRIES, `Write to Drive (${key})`);
        } catch (err) {
            console.error('Error saving to Drive:', err);
            setError(`Failed to save to Drive: ${err.message}`);

            retryCountRef.current++;
            if (retryCountRef.current >= MAX_RETRIES) {
                circuitBreakerRef.current = true;
                setTimeout(() => {
                    circuitBreakerRef.current = false;
                    retryCountRef.current = 0;
                }, CIRCUIT_BREAKER_TIMEOUT);
            }
        } finally {
            isSavingRef.current = false;
        }
    };

    // Enhanced initialization with better state management
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const initialize = async () => {
            console.log(`Starting cloud storage initialization for key: ${key}`);
            setIsLoading(true);
            setError(null);

            try {
                const hasAuth = checkAuthStateRef.current();

                if (hasAuth) {
                    await initializeGapiRef.current();

                    // Load data from cloud
                    const cloudData = await readFromDriveRef.current();

                    // Handle data migration and priority
                    const localData = localStorage.getItem(key);
                    const hasLocalData = localData &&
                        localData !== 'undefined' &&
                        localData !== JSON.stringify(defaultValue);
                    const hasCloudData = JSON.stringify(cloudData) !== JSON.stringify(defaultValue);

                    // Priority: Current state > Local data > Cloud data > Default
                    const currentStateString = JSON.stringify(value);
                    const defaultString = JSON.stringify(defaultValue);
                    const hasCurrentData = currentStateString !== defaultString;

                    if (hasCurrentData) {
                        console.log('Keeping current state (has data)');
                        // Keep current value
                    } else if (hasLocalData && !hasCloudData) {
                        console.log(`Migrating localStorage data to cloud storage for ${key}`);
                        const parsedLocalData = JSON.parse(localData);
                        setValue(parsedLocalData);
                        // Migration will be saved automatically via the save effect
                    } else if (hasCloudData) {
                        console.log('Using cloud data');
                        setValue(cloudData);
                    } else {
                        console.log('No data found, using default value');
                        setValue(defaultValue);
                    }
                } else {
                    console.log('Not authenticated, using default value');
                    setValue(defaultValue);
                }
            } catch (err) {
                console.error('Cloud storage initialization failed:', err);
                setError(`Initialization failed: ${err.message}`);
                setValue(defaultValue);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
    }, []); // Empty dependencies to prevent loops

    // Enhanced save effect with better debouncing
    useEffect(() => {
        // Skip if still loading or not authenticated
        if (isLoading || !refreshTokenIfNeededRef.current()) {
            return;
        }

        const valueString = JSON.stringify(value);
        const defaultString = JSON.stringify(defaultValue);

        // Skip saving if this is the initial default state
        if (valueString === defaultString && lastSavedValueRef.current === null) {
            return;
        }

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounced save
        saveTimeoutRef.current = setTimeout(() => {
            writeToDriveRef.current(value);
        }, DEBOUNCE_DELAY);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [value, isLoading, defaultValue, key]);

    // Network state monitoring
    useEffect(() => {
        const handleOnline = () => {
            console.log('Network back online, resetting circuit breaker');
            circuitBreakerRef.current = false;
            retryCountRef.current = 0;
            setError(null);
        };

        const handleOffline = () => {
            console.log('Network offline, cloud storage operations paused');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            pendingOperationsRef.current.clear();
        };
    }, []);

    // Enhanced update value function
    const updateValue = useCallback((newValue) => {
        const finalValue = typeof newValue === 'function' ? newValue(value) : newValue;
        setValue(finalValue);
    }, [value]);

    // Sign in function (placeholder)
    const signIn = useCallback(async () => {
        setError('Please use the Google Sign-In button in settings');
    }, []);

    // Enhanced sign out function
    const signOut = useCallback(async () => {
        try {
            console.log('Signing out of Google Drive...');

            // Clear pending operations
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            pendingOperationsRef.current.clear();

            // Clear stored tokens
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');

            // Reset all state
            setIsAuthenticated(false);
            setError(null);
            circuitBreakerRef.current = false;
            retryCountRef.current = 0;
            isSavingRef.current = false;
            isLoadingRef.current = false;

            console.log('Successfully signed out of Google Drive');
            return { success: true };
        } catch (err) {
            console.error('Error signing out:', err);
            setError(`Failed to sign out: ${err.message}`);
            return { success: false, error: err.message };
        }
    }, []);

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