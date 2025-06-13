// In src/components/ThemeSelector.js - replace with this version
import React from 'react';
import { Palette } from 'lucide-react';

const ThemeSelector = ({ currentTheme, setCurrentTheme }) => {

    const themes = [
        { id: 'light', name: 'Light', emoji: '☀️', category: 'Light' },
        { id: 'spring', name: 'Spring', emoji: '🌸', category: 'Light' },
        { id: 'summer', name: 'Summer', emoji: '🌞', category: 'Light' },
        { id: 'autumn', name: 'Autumn', emoji: '🍂', category: 'Light' },
        { id: 'winter', name: 'Winter', emoji: '❄️', category: 'Light' },

        // Dark themes
        { id: 'dark', name: 'Dark', emoji: '🌙', category: 'Dark' },
        { id: 'dark-spring', name: 'Dark Spring', emoji: '🌺', category: 'Dark' },
        { id: 'dark-summer', name: 'Dark Summer', emoji: '🌅', category: 'Dark' },
        { id: 'dark-autumn', name: 'Dark Autumn', emoji: '🍁', category: 'Dark' },
        { id: 'dark-winter', name: 'Dark Winter', emoji: '🌨️', category: 'Dark' }

    ];

    return (
        <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-theme-secondary" />
            <select
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value)}
                className="p-2 rounded border bg-theme-primary border-theme-primary text-theme-primary text-sm hover:bg-theme-hover transition-colors"
                title="Choose theme"
            >
                <optgroup label="☀️ Light Themes">
                    {themes.filter(theme => theme.category === 'Light').map(theme => (
                        <option key={theme.id} value={theme.id}>
                            {theme.emoji} {theme.name}
                        </option>
                    ))}
                </optgroup>
                <optgroup label="🌙 Dark Themes">
                    {themes.filter(theme => theme.category === 'Dark').map(theme => (
                        <option key={theme.id} value={theme.id}>
                            {theme.emoji} {theme.name}
                        </option>
                    ))}
                </optgroup>
            </select>
        </div>
    );
};

export default ThemeSelector;