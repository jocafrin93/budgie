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
    const [accessToken, setAccessToken] = useState(() => {
        // Try to restore token from localStorage
        return localStorage.getItem('google_drive_token');
    });
    const [tokenClient, setTokenClient] = useState(null);

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

    // Refresh access token
    const refreshToken = useCallback(async () => {
        if (!tokenClient) {
            console.log('🔄 No token client available, signing in fresh...');
            // We can't call signIn here due to circular dependency, so throw error instead
            throw new Error('No token client available, please sign in again');
        }

        try {
            console.log('🔄 Refreshing access token...');

            const tokenResponse = await new Promise((resolve, reject) => {
                tokenClient.callback = (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                };
                tokenClient.requestAccessToken({ prompt: '' }); // Silent refresh
            });

            // Set the new access token
            window.gapi.client.setToken({
                access_token: tokenResponse.access_token
            });

            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('google_drive_token', tokenResponse.access_token);
            setIsSignedIn(true);
            console.log('✅ Access token refreshed');

            return tokenResponse.access_token;
        } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // If refresh fails, clear stored token and require fresh sign-in
            localStorage.removeItem('google_drive_token');
            setAccessToken(null);
            setIsSignedIn(false);
            throw refreshError;
        }
    }, [tokenClient]);

    // Sign in using Google Identity Services
    const signIn = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await initializeGapi();

            if (!window.google?.accounts?.oauth2) {
                throw new Error('Google Identity Services not loaded');
            }

            // Create token client
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: () => { }, // Will be set per request
            });

            setTokenClient(client);

            // Request access token using the new GIS
            const tokenResponse = await new Promise((resolve, reject) => {
                client.callback = (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response);
                    }
                };
                client.requestAccessToken({ prompt: 'consent' }); // Force consent for fresh token
            });

            // Set the access token for API calls
            window.gapi.client.setToken({
                access_token: tokenResponse.access_token
            });

            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('google_drive_token', tokenResponse.access_token);
            setIsSignedIn(true);
            console.log('✅ Signed in to Google Drive with GIS');

        } catch (err) {
            console.error('❌ Sign in failed:', err);
            setError(err.message || 'Sign in failed');
        } finally {
            setIsLoading(false);
        }
    }, [initializeGapi]);

    // Check if we have a stored token on initialization
    React.useEffect(() => {
        const storedToken = localStorage.getItem('google_drive_token');
        if (storedToken && initialized) {
            console.log('🔄 Found stored token, attempting to use it...');
            window.gapi.client.setToken({
                access_token: storedToken
            });
            setAccessToken(storedToken);
            setIsSignedIn(true);
        }
    }, [initialized]);

    // Sign out
    const signOut = useCallback(() => {
        try {
            if (window.google?.accounts?.oauth2 && accessToken) {
                window.google.accounts.oauth2.revoke(accessToken);
            }

            window.gapi.client.setToken(null);
            localStorage.removeItem('google_drive_token');
            setAccessToken(null);
            setIsSignedIn(false);
            setTokenClient(null);
            console.log('✅ Signed out of Google Drive');
        } catch (err) {
            console.error('❌ Sign out failed:', err);
            setError(err.message || 'Sign out failed');
        }
    }, [accessToken]);

    // Helper function to ensure we have a valid token
    const ensureValidToken = useCallback(async () => {
        if (!accessToken) {
            throw new Error('Not signed in to Google Drive');
        }

        // Test if current token is still valid
        try {
            await window.gapi.client.drive.files.list({
                pageSize: 1,
                spaces: 'appDataFolder'
            });
            return accessToken; // Token is still valid
        } catch (tokenError) {
            console.log('🔄 Current token invalid, attempting refresh...', tokenError.message);
            return await refreshToken();
        }
    }, [accessToken, refreshToken]);

    // Backup all localStorage data to Google Drive
    const backupToCloud = useCallback(async () => {
        if (!isSignedIn) {
            throw new Error('Not signed in to Google Drive');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Ensure we have a valid token
            const validToken = await ensureValidToken();

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

            console.log('📦 Backing up data...', { dataKeys: Object.keys(allData).length });

            // Check if backup file already exists
            const fileName = 'budgie_backup.json';
            const listResponse = await window.gapi.client.drive.files.list({
                q: `name='${fileName}' and parents in 'appDataFolder'`,
                spaces: 'appDataFolder'
            });

            const fileId = listResponse.result.files?.[0]?.id;
            console.log('📁 Existing file ID:', fileId || 'None found');

            if (fileId) {
                // Update existing file using simple upload
                const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${validToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: content
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error('Update response:', updateResponse.status, errorText);
                    throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
                }

                console.log('✅ Existing backup file updated');
            } else {
                // Create new file using the Drive API client
                const createResponse = await window.gapi.client.request({
                    path: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    method: 'POST',
                    params: {
                        uploadType: 'multipart'
                    },
                    headers: {
                        'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
                    },
                    body: [
                        '--foo_bar_baz',
                        'Content-Type: application/json; charset=UTF-8',
                        '',
                        JSON.stringify({
                            name: fileName,
                            parents: ['appDataFolder']
                        }),
                        '--foo_bar_baz',
                        'Content-Type: application/json',
                        '',
                        content,
                        '--foo_bar_baz--'
                    ].join('\r\n')
                });

                if (!createResponse || createResponse.status !== 200) {
                    console.error('Create response:', createResponse);
                    throw new Error(`Create failed: ${createResponse?.status || 'Unknown error'}`);
                }

                console.log('✅ New backup file created');
            }

            console.log('✅ Data backed up to Google Drive successfully');
            return true;
        } catch (err) {
            console.error('❌ Backup failed:', err);
            setError(err.message || 'Backup failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, ensureValidToken]);

    // Restore data from Google Drive to localStorage
    const restoreFromCloud = useCallback(async () => {
        if (!isSignedIn) {
            throw new Error('Not signed in to Google Drive');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Ensure we have a valid token
            const validToken = await ensureValidToken();

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
                    'Authorization': `Bearer ${validToken}`
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
    }, [isSignedIn, ensureValidToken]);

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
