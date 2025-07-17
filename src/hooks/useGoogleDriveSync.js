import React, { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata';

/**
 * Google Drive sync hook using the new Google Identity Services (GIS)
 * Replaces the deprecated gapi.auth2 library
 */
export const useGoogleDriveSync = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [accessToken, setAccessToken] = useState(null);

    // Debug logging
    console.log('useGoogleDriveSync state:', { isSignedIn, isLoading, error, initialized });
    console.log('Google API credentials:', {
        API_KEY: API_KEY ? 'Set' : 'Missing',
        CLIENT_ID: CLIENT_ID ? 'Set' : 'Missing'
    });

    // Initialize Google API with new GIS
    const initializeGapi = useCallback(async () => {
        if (initialized) return;

        console.log('🔄 Initializing Google API with GIS...');

        try {
            setIsLoading(true);
            setError(null);

            // Load Google API client
            await new Promise((resolve, reject) => {
                if (!window.gapi) {
                    const script = document.createElement('script');
                    script.src = 'https://apis.google.com/js/api.js';
                    script.onload = () => {
                        window.gapi.load('client', resolve);
                    };
                    script.onerror = () => reject(new Error('Failed to load Google API'));
                    document.head.appendChild(script);
                } else {
                    window.gapi.load('client', resolve);
                }
            });

            // Initialize the API client
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC]
            });

            // Load Google Identity Services
            await new Promise((resolve, reject) => {
                if (!window.google) {
                    const script = document.createElement('script');
                    script.src = 'https://accounts.google.com/gsi/client';
                    script.onload = resolve;
                    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
                    document.head.appendChild(script);
                } else {
                    resolve();
                }
            });

            setInitialized(true);
            console.log('✅ Google API with GIS initialized successfully');

        } catch (err) {
            console.error('❌ Google API initialization failed:', err);
            setError(err.message || 'Failed to initialize Google API');
        } finally {
            setIsLoading(false);
        }
    }, [initialized]);

    // Auto-initialize on mount
    React.useEffect(() => {
        if (!initialized && !isLoading) {
            initializeGapi().catch(err => {
                console.error('Auto-initialization failed:', err);
            });
        }
    }, [initialized, isLoading, initializeGapi]);

    // Sign in using Google Identity Services
    const signIn = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await initializeGapi();

            if (!window.google?.accounts?.oauth2) {
                throw new Error('Google Identity Services not loaded');
            }

            // Request access token using the new GIS
            const tokenResponse = await new Promise((resolve, reject) => {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (response) => {
                        if (response.error) {
                            reject(new Error(response.error));
                        } else {
                            resolve(response);
                        }
                    },
                });
                tokenClient.requestAccessToken();
            });

            // Set the access token for API calls
            window.gapi.client.setToken({
                access_token: tokenResponse.access_token
            });

            setAccessToken(tokenResponse.access_token);
            setIsSignedIn(true);
            console.log('✅ Signed in to Google Drive with GIS');

        } catch (err) {
            console.error('❌ Sign in failed:', err);
            setError(err.message || 'Sign in failed');
        } finally {
            setIsLoading(false);
        }
    }, [initializeGapi]);

    // Sign out
    const signOut = useCallback(() => {
        try {
            if (window.google?.accounts?.oauth2) {
                window.google.accounts.oauth2.revoke(accessToken);
            }

            window.gapi.client.setToken(null);
            setAccessToken(null);
            setIsSignedIn(false);
            console.log('✅ Signed out of Google Drive');
        } catch (err) {
            console.error('❌ Sign out failed:', err);
            setError(err.message || 'Sign out failed');
        }
    }, [accessToken]);

    // Backup all localStorage data to Google Drive
    const backupToCloud = useCallback(async () => {
        if (!isSignedIn || !accessToken) {
            throw new Error('Not signed in to Google Drive');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get all localStorage data
            const allData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('budgetCalc_')) {
                    allData[key] = localStorage.getItem(key);
                }
            }

            const content = JSON.stringify({
                data: allData,
                timestamp: new Date().toISOString(),
                version: '1.0'
            }, null, 2);

            // Check if backup file already exists
            const fileName = 'budgie_backup.json';
            const response = await window.gapi.client.drive.files.list({
                q: `name='${fileName}' and parents in 'appDataFolder'`,
                spaces: 'appDataFolder'
            });

            const fileId = response.result.files?.[0]?.id;

            // Create or update the backup file
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

            const uploadResponse = await fetch(url, {
                method: fileId ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            console.log('✅ Data backed up to Google Drive');
            return true;
        } catch (err) {
            console.error('❌ Backup failed:', err);
            setError(err.message || 'Backup failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, accessToken]);

    // Restore data from Google Drive to localStorage
    const restoreFromCloud = useCallback(async () => {
        if (!isSignedIn || !accessToken) {
            throw new Error('Not signed in to Google Drive');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Find the backup file
            const fileName = 'budgie_backup.json';
            const response = await window.gapi.client.drive.files.list({
                q: `name='${fileName}' and parents in 'appDataFolder'`,
                spaces: 'appDataFolder'
            });

            const fileId = response.result.files?.[0]?.id;
            if (!fileId) {
                throw new Error('No backup found in Google Drive');
            }

            // Download the backup file
            const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!downloadResponse.ok) {
                throw new Error(`Download failed: ${downloadResponse.statusText}`);
            }

            const backupContent = await downloadResponse.text();
            const backup = JSON.parse(backupContent);

            // Restore data to localStorage
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Trigger storage events to update any listening components
            window.dispatchEvent(new Event('storage'));

            console.log('✅ Data restored from Google Drive');
            return backup;
        } catch (err) {
            console.error('❌ Restore failed:', err);
            setError(err.message || 'Restore failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, accessToken]);

    return {
        isSignedIn,
        isLoading,
        error,
        signIn,
        signOut,
        backupToCloud,
        restoreFromCloud
    };
};
