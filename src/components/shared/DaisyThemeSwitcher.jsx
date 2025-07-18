import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useDaisyThemeContext } from '../../app/contexts/theme/DaisyContext';

const DAISY_THEMES = [
    { name: 'light', label: 'Light', description: 'Clean and bright' },
    { name: 'dark', label: 'Dark', description: 'Easy on the eyes' },
    { name: 'cupcake', label: 'Cupcake', description: 'Sweet and pastel' },
    { name: 'corporate', label: 'Corporate', description: 'Professional blue' },
    { name: 'synthwave', label: 'Synthwave', description: 'Neon and retro' },
    { name: 'retro', label: 'Retro', description: 'Warm and nostalgic' },
    { name: 'cyberpunk', label: 'Cyberpunk', description: 'Neon green future' },
    { name: 'valentine', label: 'Valentine', description: 'Romantic pink' },
    { name: 'forest', label: 'Forest', description: 'Natural green' },
    { name: 'aqua', label: 'Aqua', description: 'Ocean blue' },
    { name: 'dracula', label: 'Dracula', description: 'Classic dark with vibrant colors' },
    { name: 'abyss', label: 'Abyss', description: 'Deep blue with green accents' },
    { name: 'vscode-dark', label: 'VSCode Dark', description: 'Editor-inspired purple theme' },
    { name: 'silk', label: 'Silk', description: 'Elegant light with soft purple accents' },
];

export default function DaisyThemeSwitcher({ className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const { currentTheme, changeTheme } = useDaisyThemeContext();

    const currentThemeData = DAISY_THEMES.find(theme => theme.name === currentTheme) || DAISY_THEMES[0];

    const handleThemeSelect = (themeName) => {
        changeTheme(themeName);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Theme Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-base-100 border border-base-300 rounded-lg hover:bg-base-200 focus:outline-none focus:border-primary transition-colors"
            >
                <div className="flex items-center space-x-3">
                    {/* Theme Preview Circle */}
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                        <div className="w-3 h-3 rounded-full bg-accent"></div>
                    </div>
                    <div className="text-left">
                        <div className="text-base-content font-medium">{currentThemeData.label}</div>
                        <div className="text-base-content/60 text-xs">{currentThemeData.description}</div>
                    </div>
                </div>
                <ChevronDownIcon
                    className={`w-4 h-4 text-base-content/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-2">
                        <div className="text-xs font-medium text-base-content/60 px-2 py-1 mb-2">
                            Choose Theme
                        </div>
                        {DAISY_THEMES.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => handleThemeSelect(theme.name)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left hover transition-colors ${currentTheme === theme.name ? 'bg-primary/10 border border-primary/20' : ''
                                    }`}
                            >
                                {/* Theme Preview */}
                                <div
                                    className="flex space-x-1 flex-shrink-0"
                                    data-theme={theme.name}
                                >
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-base-content">
                                        {theme.label}
                                    </div>
                                    <div className="text-xs text-base-content/60">
                                        {theme.description}
                                    </div>
                                </div>

                                {currentTheme === theme.name && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay to close dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}
        </div>
    );
}
