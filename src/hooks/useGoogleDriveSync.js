import { useState, useCallback } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

/**
 * Simple Google Drive sync hook for backing up/restoring localStorage data
 * Much simpler than the previous complex cloud storage system
 */
export const useGoogleDriveSync = () => {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Google API
    const initializeGapi = useCallback(async () => {
        if (window.gapi?.client) return; // Already initialized

        return new Promise((resolve, reject) => {
            if (!window.gapi) {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    window.gapi.load('client:auth2', async () => {
                        try {
                            await window.gapi.client.init({
                                apiKey: API_KEY,
                                clientId: CLIENT_ID,
                                discoveryDocs: [DISCOVERY_DOC],
                                scope: SCOPES
                            });

                            const authInstance = window.gapi.auth2.getAuthInstance();
                            setIsSignedIn(authInstance.isSignedIn.get());

                            // Listen for sign-in state changes
                            authInstance.isSignedIn.listen(setIsSignedIn);

                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    });
                };
                script.onerror = () => reject(new Error('Failed to load Google API'));
                document.head.appendChild(script);
            } else {
                window.gapi.load('client:auth2', resolve);
            }
        });
    }, []);

    // Sign in to Google
    const signIn = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await initializeGapi();
            const authInstance = window.gapi.auth2.getAuthInstance();
            await authInstance.signIn();

            console.log('✅ Signed in to Google Drive');
        } catch (err) {
            console.error('❌ Sign in failed:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [initializeGapi]);

    // Sign out of Google
    const signOut = useCallback(async () => {
        try {
            const authInstance = window.gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            console.log('✅ Signed out of Google Drive');
        } catch (err) {
            console.error('❌ Sign out failed:', err);
            setError(err.message);
        }
    }, []);

    // Backup all localStorage data to Google Drive
    const backupToCloud = useCallback(async () => {
        if (!isSignedIn) {
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
                    'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
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
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn]);

    // Restore data from Google Drive to localStorage
    const restoreFromCloud = useCallback(async () => {
        if (!isSignedIn) {
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
                    'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
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
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn]);

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
