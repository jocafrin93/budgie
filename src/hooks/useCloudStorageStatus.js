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
            // If already initialized, just return
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

                // Load Google APIs
                console.log('Loading Google API scripts...');

                // Load gapi for Drive API
                if (!window.gapi) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://apis.google.com/js/api.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                // Load Google Identity Services for auth
                if (!window.google?.accounts) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://accounts.google.com/gsi/client';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                gapi = window.gapi;
                console.log('Loading gapi client...');

                await new Promise((resolve, reject) => {
                    gapi.load('client', async () => {
                        try {
                            console.log('Initializing gapi client...');
                            await gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: [DISCOVERY_DOC]
                            });

                            console.log('Initializing Google Identity Services...');
                            window.google.accounts.id.initialize({
                                client_id: CLIENT_ID,
                                callback: (response) => {
                                    console.log('Google Sign-In response:', response);
                                    setIsAuthenticated(true);
                                }
                            });

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

            if (!window.google?.accounts || !isInitialized) {
                throw new Error('Google Identity Services not initialized');
            }

            console.log('Requesting OAuth token...');

            // Use Google Identity Services OAuth 2.0 flow
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response) => {
                    if (response.error) {
                        console.error('OAuth error:', response.error);
                        setError(`OAuth error: ${response.error}`);
                        return;
                    }

                    console.log('OAuth token received:', response);
                    // Set the access token for gapi
                    gapi.client.setToken(response);
                    setIsAuthenticated(true);
                    setError(null);
                }
            });

            tokenClient.requestAccessToken();
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
