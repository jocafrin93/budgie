import { useState } from 'react';
import { useGoogleDriveSync } from '../../hooks/useGoogleDriveSync';

/**
 * Simple Google Drive sync component for backing up and restoring data
 * Much simpler than the previous complex cloud storage system
 */
export const GoogleDriveSync = () => {
    const {
        isSignedIn,
        isLoading,
        error,
        signIn,
        signOut,
        backupToCloud,
        restoreFromCloud
    } = useGoogleDriveSync();

    const [lastBackup, setLastBackup] = useState(() => {
        return localStorage.getItem('lastBackupTime') || null;
    });

    const [lastRestore, setLastRestore] = useState(() => {
        return localStorage.getItem('lastRestoreTime') || null;
    });

    const handleBackup = async () => {
        try {
            await backupToCloud();
            const now = new Date().toISOString();
            setLastBackup(now);
            localStorage.setItem('lastBackupTime', now);
        } catch (err) {
            console.error('Backup failed:', err);
        }
    };

    const handleRestore = async () => {
        if (window.confirm('This will replace all your current data with the backup from Google Drive. Are you sure?')) {
            try {
                await restoreFromCloud();
                const now = new Date().toISOString();
                setLastRestore(now);
                localStorage.setItem('lastRestoreTime', now);

                // Refresh the page to reload all data
                window.location.reload();
            } catch (err) {
                console.error('Restore failed:', err);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
                <h3 className="card-title text-base-content">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.28 3l5.24 9.07L15.76 3h2.95l-7.11 12.28L18.72 21H15.76l-3.24-5.61L9.28 21H6.33l7.11-12.28L6.28 3z" />
                    </svg>
                    Google Drive Sync
                </h3>

                <p className="text-base-content/70 text-sm">
                    Backup your budget data to Google Drive for access across devices
                </p>

                {error && (
                    <div className="alert alert-error">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    {!isSignedIn ? (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={signIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-base-content/70">
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                                Connected to Google Drive
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="btn btn-primary btn-sm flex-1"
                                    onClick={handleBackup}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Backing up...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                            Backup
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-secondary btn-sm flex-1"
                                    onClick={handleRestore}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Restoring...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Restore
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-xs text-base-content/60 space-y-1">
                                <div>Last backup: {formatDate(lastBackup)}</div>
                                <div>Last restore: {formatDate(lastRestore)}</div>
                            </div>

                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={signOut}
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
