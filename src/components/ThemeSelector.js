// In src/components/ThemeSelector.js - replace with this version
import React from 'react';
import { Palette } from 'lucide-react';

const ThemeSelector = ({ currentTheme, setCurrentTheme, darkMode }) => {
    if (darkMode) return null;

    const themes = [
        { id: 'light', name: 'Light', emoji: '☀️' },
        { id: 'spring', name: 'Spring', emoji: '🌸' },
        { id: 'summer', name: 'Summer', emoji: '☀️' },
        { id: 'autumn', name: 'Autumn', emoji: '🍂' },
        { id: 'winter', name: 'Winter', emoji: '❄️' }
    ];

    return (
        <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-gray-600" />
            <select
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value)}
                className="p-2 rounded border bg-white border-gray-300 text-gray-900 text-sm hover:bg-gray-50 transition-colors"
                title="Choose theme"
            >
                {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                        {theme.emoji} {theme.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;