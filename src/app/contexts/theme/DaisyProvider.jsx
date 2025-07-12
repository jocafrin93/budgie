// Import Dependencies
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

// Local Imports
import { defaultTheme } from "configs/theme.config";
import { colors } from "constants/colors.constant";
import { useIsomorphicEffect, useLocalStorage, useMediaQuery } from "hooks";
import { ThemeContext } from "./context";

// ----------------------------------------------------------------------

// DaisyUI Theme Configuration
const DAISY_THEMES = [
    // Light themes
    { name: "light", label: "Light", type: "light" },
    { name: "corporate", label: "Corporate", type: "light" },
    { name: "emerald", label: "Emerald", type: "light" },
    { name: "fantasy", label: "Fantasy", type: "light" },
    { name: "lofi", label: "Lo-Fi", type: "light" },
    { name: "pastel", label: "Pastel", type: "light" },
    { name: "cupcake", label: "Cupcake", type: "light" },
    { name: "bumblebee", label: "Bumblebee", type: "light" },
    { name: "garden", label: "Garden", type: "light" },
    { name: "retro", label: "Retro", type: "light" },
    { name: "valentine", label: "Valentine", type: "light" },
    { name: "aqua", label: "Aqua", type: "light" },
    { name: "cmyk", label: "CMYK", type: "light" },
    { name: "autumn", label: "Autumn", type: "light" },
    { name: "acid", label: "Acid", type: "light" },
    { name: "lemonade", label: "Lemonade", type: "light" },
    { name: "winter", label: "Winter", type: "light" },
    { name: "budgie-light", label: "Budgie Light", type: "light" },

    // Dark themes
    { name: "dark", label: "Dark", type: "dark" },
    { name: "synthwave", label: "Synthwave", type: "dark" },
    { name: "forest", label: "Forest", type: "dark" },
    { name: "black", label: "Black", type: "dark" },
    { name: "night", label: "Night", type: "dark" },
    { name: "coffee", label: "Coffee", type: "dark" },
    { name: "dim", label: "Dim", type: "dark" },
    { name: "nord", label: "Nord", type: "dark" },
    { name: "sunset", label: "Sunset", type: "dark" },
    { name: "cyberpunk", label: "Cyberpunk", type: "dark" },
    { name: "halloween", label: "Halloween", type: "dark" },
    { name: "luxury", label: "Luxury", type: "dark" },
    { name: "dracula", label: "Dracula", type: "dark" },
    { name: "business", label: "Business", type: "dark" },
    { name: "budgie-dark", label: "Budgie Dark", type: "dark" },
];

const DEFAULT_LIGHT_THEME = "budgie-light";
const DEFAULT_DARK_THEME = "budgie-dark";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const _html = document?.documentElement;

export function DaisyThemeProvider({ children }) {
    const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);

    // DaisyUI specific settings
    const [daisySettings, setDaisySettings] = useLocalStorage("daisy-theme-settings", {
        themeMode: "system",
        lightTheme: DEFAULT_LIGHT_THEME,
        darkTheme: DEFAULT_DARK_THEME,
    });

    // Legacy settings for backward compatibility
    const [legacySettings, setLegacySettings] = useLocalStorage("settings", {
        themeMode: defaultTheme.themeMode,
        themeLayout: defaultTheme.themeLayout,
        cardSkin: defaultTheme.cardSkin,
        isMonochrome: defaultTheme.isMonochrome,
        darkColorScheme: defaultTheme.darkColorScheme,
        lightColorScheme: defaultTheme.lightColorScheme,
        primaryColorScheme: defaultTheme.primaryColorScheme,
        notification: { ...defaultTheme.notification },
    });

    const [currentTheme, setCurrentTheme] = useState(DEFAULT_LIGHT_THEME);

    // Determine if we should use dark mode
    const isDark =
        (daisySettings.themeMode === "system" && isDarkOS) ||
        daisySettings.themeMode === "dark";

    // Update current theme based on dark/light mode
    useEffect(() => {
        const newTheme = isDark ? daisySettings.darkTheme : daisySettings.lightTheme;
        setCurrentTheme(newTheme);
    }, [isDark, daisySettings.lightTheme, daisySettings.darkTheme]);

    // Apply DaisyUI theme to document
    useEffect(() => {
        if (document?.documentElement) {
            console.log('🎨 Applying DaisyUI theme:', currentTheme, 'isDark:', isDark);
            document.documentElement.setAttribute('data-theme', currentTheme);

            // Also maintain the old dark class for backward compatibility
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            console.log('🎨 data-theme attribute set to:', document.documentElement.getAttribute('data-theme'));
        }
    }, [currentTheme, isDark]);

    // Legacy theme effects for backward compatibility
    useIsomorphicEffect(() => {
        legacySettings.isMonochrome
            ? document.body.classList.add("is-monochrome")
            : document.body.classList.remove("is-monochrome");
    }, [legacySettings.isMonochrome]);

    // DISABLED: These legacy data attributes conflict with DaisyUI theming
    // useIsomorphicEffect(() => {
    //     if (_html) _html.dataset.themeLight = legacySettings.lightColorScheme.name;
    // }, [legacySettings.lightColorScheme]);

    // useIsomorphicEffect(() => {
    //     if (_html) _html.dataset.themeDark = legacySettings.darkColorScheme.name;
    // }, [legacySettings.darkColorScheme]);

    // useIsomorphicEffect(() => {
    //     if (_html) _html.dataset.themePrimary = legacySettings.primaryColorScheme.name;
    // }, [legacySettings.primaryColorScheme]);

    useIsomorphicEffect(() => {
        if (_html) _html.dataset.cardSkin = legacySettings.cardSkin;
    }, [legacySettings.cardSkin]);

    useIsomorphicEffect(() => {
        if (document) document.body.dataset.layout = legacySettings.themeLayout;
    }, [legacySettings.themeLayout]);

    // DaisyUI theme functions
    const setThemeMode = (mode) => {
        console.log('🎨 setThemeMode called with:', mode);
        console.log('🎨 Current daisySettings:', daisySettings);
        setDaisySettings(prev => {
            const newSettings = {
                ...prev,
                themeMode: mode
            };
            console.log('🎨 New daisySettings will be:', newSettings);
            return newSettings;
        });
        // Also update legacy settings for compatibility
        setLegacySettings(prev => ({
            ...prev,
            themeMode: mode
        }));
    };

    const setTheme = (themeName, themeType = null) => {
        console.log('🎨 setTheme called:', { themeName, themeType });
        console.log('🎨 Current isDark:', isDark);
        console.log('🎨 Current daisySettings:', daisySettings);

        if (themeType === 'light') {
            console.log('🎨 Setting light theme to:', themeName);
            setDaisySettings(prev => {
                const newSettings = {
                    ...prev,
                    lightTheme: themeName,
                    // Auto-switch to light mode when selecting a light theme
                    themeMode: 'light'
                };
                console.log('🎨 New daisySettings after light theme change:', newSettings);
                return newSettings;
            });
            // Also update legacy settings
            setLegacySettings(prev => ({
                ...prev,
                themeMode: 'light'
            }));
        } else if (themeType === 'dark') {
            console.log('🎨 Setting dark theme to:', themeName);
            setDaisySettings(prev => {
                const newSettings = {
                    ...prev,
                    darkTheme: themeName,
                    // Auto-switch to dark mode when selecting a dark theme
                    themeMode: 'dark'
                };
                console.log('🎨 New daisySettings after dark theme change:', newSettings);
                return newSettings;
            });
            // Also update legacy settings
            setLegacySettings(prev => ({
                ...prev,
                themeMode: 'dark'
            }));
        } else {
            const theme = DAISY_THEMES.find(t => t.name === themeName);
            if (theme) {
                if (theme.type === 'light') {
                    console.log('🎨 Auto-setting light theme to:', themeName);
                    setDaisySettings(prev => ({
                        ...prev,
                        lightTheme: themeName,
                        themeMode: 'light'
                    }));
                    setLegacySettings(prev => ({
                        ...prev,
                        themeMode: 'light'
                    }));
                } else {
                    console.log('🎨 Auto-setting dark theme to:', themeName);
                    setDaisySettings(prev => ({
                        ...prev,
                        darkTheme: themeName,
                        themeMode: 'dark'
                    }));
                    setLegacySettings(prev => ({
                        ...prev,
                        themeMode: 'dark'
                    }));
                }
            }
        }
    };

    // Legacy theme functions for backward compatibility
    const setThemeLayout = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            themeLayout: val,
        }));
    };

    const setMonochromeMode = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            isMonochrome: val,
        }));
    };

    const setDarkColorScheme = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            darkColorScheme: {
                name: val,
                ...colors[val],
            },
        }));
    };

    const setLightColorScheme = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            lightColorScheme: {
                name: val,
                ...colors[val],
            },
        }));
    };

    const setPrimaryColorScheme = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            primaryColorScheme: {
                name: val,
                ...colors[val],
            },
        }));
    };

    const setNotificationPosition = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            notification: {
                ...prev.notification,
                position: val,
            },
        }));
    };

    const setNotificationExpand = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            notification: {
                ...prev.notification,
                isExpanded: val,
            },
        }));
    };

    const setNotificationMaxCount = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            notification: {
                ...prev.notification,
                visibleToasts: val,
            },
        }));
    };

    const setCardSkin = (val) => {
        setLegacySettings(prev => ({
            ...prev,
            cardSkin: val
        }));
    };

    const resetTheme = () => {
        setDaisySettings({
            themeMode: "system",
            lightTheme: DEFAULT_LIGHT_THEME,
            darkTheme: DEFAULT_DARK_THEME,
        });
        setLegacySettings({
            themeMode: defaultTheme.themeMode,
            themeLayout: defaultTheme.themeLayout,
            isMonochrome: defaultTheme.isMonochrome,
            darkColorScheme: defaultTheme.darkColorScheme,
            lightColorScheme: defaultTheme.lightColorScheme,
            primaryColorScheme: defaultTheme.primaryColorScheme,
            cardSkin: defaultTheme.cardSkin,
            notification: { ...defaultTheme.notification },
        });
    };

    // Get themes by type for UI
    const lightThemes = DAISY_THEMES.filter(t => t.type === 'light');
    const darkThemes = DAISY_THEMES.filter(t => t.type === 'dark');

    if (!children) {
        return null;
    }

    return (
        <ThemeContext
            value={{
                // Legacy properties for backward compatibility (spread first)
                ...legacySettings,

                // DaisyUI specific properties (override legacy where needed)
                themeMode: daisySettings.themeMode, // Override legacy themeMode
                currentTheme,
                lightTheme: daisySettings.lightTheme,
                darkTheme: daisySettings.darkTheme,
                availableThemes: DAISY_THEMES,
                lightThemes,
                darkThemes,
                isDark,

                // Functions
                setTheme,
                setThemeMode,
                setThemeLayout,
                setMonochromeMode,
                setLightColorScheme,
                setDarkColorScheme,
                setPrimaryColorScheme,
                setNotificationPosition,
                setNotificationExpand,
                setNotificationMaxCount,
                setCardSkin,
                resetTheme,

                // Legacy setSettings function for backward compatibility
                setSettings: (newSettings) => {
                    if (typeof newSettings === 'function') {
                        setLegacySettings(newSettings);
                    } else {
                        setLegacySettings(prev => ({ ...prev, ...newSettings }));
                    }
                },
            }}
        >
            {children}
        </ThemeContext>
    );
}

DaisyThemeProvider.propTypes = {
    children: PropTypes.node,
};
