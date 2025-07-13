import { useCloudStorageStatus } from '../../hooks/useCloudStorageStatus';

const CloudStorageStatus = () => {
    const { isLoading, isAuthenticated, error, signIn, signOut } = useCloudStorageStatus();

    const isDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('localhost');

    if (isDevelopment) {
        return (
            <div className="bg-info/10 border border-info rounded-lg p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-info">
                            Development Mode
                        </h3>
                        <div className="mt-1 text-sm text-info">
                            Using local storage. Cloud sync will be available in production.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-base-200 border border-base-300 rounded-lg p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="animate-spin h-5 w-5 text-base-content/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-base-content">
                            Initializing Cloud Storage
                        </h3>
                        <div className="mt-1 text-sm text-base-content/60">
                            Setting up Google Drive integration...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        const errorMessage = typeof error === 'string' ? error :
            error?.message ? error.message :
                'Unknown error occurred';

        return (
            <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-error">
                            Cloud Storage Error
                        </h3>
                        <div className="mt-1 text-sm text-error">
                            {errorMessage}
                        </div>
                        <details className="mt-2">
                            <summary className="text-xs text-error cursor-pointer hover">
                                Debug Information
                            </summary>
                            <div className="mt-1 text-xs text-error font-mono bg-error/20 p-2 rounded">
                                <div>Error Type: {typeof error}</div>
                                <div>Error Object: {JSON.stringify(error, null, 2)}</div>
                                <div>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}</div>
                                <div>API Key: {import.meta.env.VITE_GOOGLE_API_KEY ? 'Set' : 'Missing'}</div>
                                <div>Domain: {window.location.hostname}</div>
                            </div>
                        </details>
                        <div className="mt-3 space-x-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-error btn-outline btn-sm"
                            >
                                Retry
                            </button>
                            <button
                                onClick={() => console.log('Google API Debug:', { error, gapi: window.gapi, env: import.meta.env })}
                                className="btn btn-error btn-outline btn-sm"
                            >
                                Log Debug Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="bg-warning/10 border border-warning rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-warning">
                                Cloud Storage Not Connected
                            </h3>
                            <div className="mt-1 text-sm text-warning">
                                Sign in with Google to sync your data across devices
                            </div>
                        </div>
                    </div>
                    <div className="ml-4">
                        <button
                            onClick={signIn}
                            className="btn btn-info flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Sign in with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-success">
                            Cloud Storage Connected
                        </h3>
                        <div className="mt-1 text-sm text-success">
                            Your data is automatically syncing with Google Drive
                        </div>
                    </div>
                </div>
                <div className="ml-4">
                    <button
                        onClick={signOut}
                        className="btn btn-error btn-sm flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Disconnect</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CloudStorageStatus;
