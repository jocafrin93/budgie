// src/hooks/useCloudStorageStatus.js
import { useCallback, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapi = null;
let isInitialized = false;
let initializationPromise = null;

export const useCloudStorageStatus = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Google API (only called when user wants to sign in)
    const initializeGapi = useCallback(async () => {
        if (isInitialized) {
            // If already initialized, just check auth status
            const authInstance = gapi.auth2.getAuthInstance();
            setIsAuthenticated(authInstance.isSignedIn.get());
            return;
        }

        if (initializationPromise) return initializationPromise;

        setIsLoading(true);
        setError(null);

        initializationPromise = (async () => {
            try {
                console.log('Initializing Google API...');
                console.log('CLIENT_ID:', CLIENT_ID ? 'Set' : 'Not set');
                console.log('API_KEY:', API_KEY ? 'Set' : 'Not set');

                // Load gapi if not already loaded
                if (!window.gapi) {
                    console.log('Loading Google API script...');
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://apis.google.com/js/api.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                gapi = window.gapi;
                console.log('Loading gapi client and auth2...');

                await new Promise((resolve, reject) => {
                    gapi.load('client:auth2', async () => {
                        try {
                            console.log('Initializing gapi client...');
                            await gapi.client.init({
                                apiKey: API_KEY,
                                clientId: CLIENT_ID,
                                discoveryDocs: [DISCOVERY_DOC],
                                scope: SCOPES
                            });

                            console.log('Getting auth instance...');
                            const authInstance = gapi.auth2.getAuthInstance();
                            if (!authInstance) {
                                throw new Error('Failed to get auth instance');
                            }

                            setIsAuthenticated(authInstance.isSignedIn.get());

                            // Listen for sign-in state changes
                            authInstance.isSignedIn.listen(setIsAuthenticated);

                            isInitialized = true;
                            console.log('Google API initialized successfully');
                            resolve();
                        } catch (initError) {
                            console.error('Error during gapi client init:', initError);
                            reject(initError);
                        }
                    });
                });
            } catch (err) {
                console.error('Google API initialization error:', err);
                const errorMessage = err?.message || err || 'Unknown error';
                setError(`Failed to initialize Google API: ${errorMessage}`);
                throw err;
            } finally {
                setIsLoading(false);
                initializationPromise = null;
            }
        })();

        return initializationPromise;
    }, []);

    // Sign in to Google
    const signIn = useCallback(async () => {
        try {
            // Initialize if not already done
            await initializeGapi();

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
    }, [initializeGapi]);

    return {
        isLoading,
        isAuthenticated,
        error,
        signIn
    };
};
