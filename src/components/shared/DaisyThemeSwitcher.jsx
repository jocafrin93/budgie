import { useThemeContext } from 'app/contexts/theme/context';

export function DaisyThemeSwitcher() {
    const {
        themeMode,
        currentTheme,
        lightTheme,
        darkTheme,
        lightThemes,
        darkThemes,
        isDark,
        setThemeMode,
        setTheme,
        resetTheme,
    } = useThemeContext();

    const handleThemeModeChange = (mode) => {
        setThemeMode(mode);
    };

    const handleThemeChange = (themeName, themeType) => {
        console.log('🎨 Theme change button clicked:', { themeName, themeType });
        setTheme(themeName, themeType);
    };

    return (
        <div className="relative">
            {/* Theme Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Theme Mode:</span>
                <div className="flex gap-1">
                    {['light', 'dark', 'system'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => {
                                console.log('🎨 Theme mode button clicked:', mode);
                                handleThemeModeChange(mode);
                            }}
                            className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${themeMode === mode
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-200 hover:bg-base-300'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Theme Display */}
            <div className="mb-4 p-3 bg-base-200 rounded-lg">
                <div className="text-sm">
                    <div><strong>Current:</strong> {currentTheme}</div>
                    <div><strong>Mode:</strong> {isDark ? 'Dark' : 'Light'}</div>
                </div>
            </div>

            {/* Theme Selectors */}
            <div className="space-y-4">
                {/* Light Theme Selector */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Light Theme:</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {lightThemes.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => handleThemeChange(theme.name, 'light')}
                                className={`p-2 text-xs rounded border text-left transition-colors ${lightTheme === theme.name
                                    ? 'border-primary bg-primary/10'
                                    : 'border-base-300 hover:border-primary/50'
                                    }`}
                            >
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dark Theme Selector */}
                <div>
                    <h4 className="text-sm font-medium mb-2">Dark Theme:</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {darkThemes.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => handleThemeChange(theme.name, 'dark')}
                                className={`p-2 text-xs rounded border text-left transition-colors ${darkTheme === theme.name
                                    ? 'border-primary bg-primary/10'
                                    : 'border-base-300 hover:border-primary/50'
                                    }`}
                            >
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reset Button */}
            <button
                onClick={resetTheme}
                className="mt-4 w-full px-3 py-2 text-sm bg-base-300 hover:bg-base-400 rounded-md transition-colors"
            >
                Reset to Default
            </button>

            {/* Color Preview */}
            <div className="mt-4 p-3 bg-base-100 border border-base-300 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Color Preview:</h5>
                <div className="grid grid-cols-4 gap-2">
                    <div className="h-8 bg-primary rounded flex items-center justify-center">
                        <span className="text-xs text-primary-content">Primary</span>
                    </div>
                    <div className="h-8 bg-secondary rounded flex items-center justify-center">
                        <span className="text-xs text-secondary-content">Secondary</span>
                    </div>
                    <div className="h-8 bg-accent rounded flex items-center justify-center">
                        <span className="text-xs text-accent-content">Accent</span>
                    </div>
                    <div className="h-8 bg-neutral rounded flex items-center justify-center">
                        <span className="text-xs text-neutral-content">Neutral</span>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="h-6 bg-info rounded flex items-center justify-center">
                        <span className="text-xs text-info-content">Info</span>
                    </div>
                    <div className="h-6 bg-success rounded flex items-center justify-center">
                        <span className="text-xs text-success-content">Success</span>
                    </div>
                    <div className="h-6 bg-warning rounded flex items-center justify-center">
                        <span className="text-xs text-warning-content">Warning</span>
                    </div>
                    <div className="h-6 bg-error rounded flex items-center justify-center">
                        <span className="text-xs text-error-content">Error</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
