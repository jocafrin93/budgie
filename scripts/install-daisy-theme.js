#!/usr/bin/env node

/**
 * DaisyUI Theme Installation Script
 * 
 * This script automatically installs DaisyUI themes with full integration:
 * - Adds theme definition to daisy-themes.css
 * - Updates theme switcher component
 * - Adds all necessary CSS overrides to bridge file
 * - Handles both RGB and OKLCH color formats
 * - Ensures theme previews work correctly
 * 
 * Usage:
 * node scripts/install-daisy-theme.js <theme-name> <theme-config-file>
 * 
 * Example:
 * node scripts/install-daisy-theme.js midnight ./themes/midnight.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const THEMES_CSS_PATH = 'src/styles/daisy-themes.css';
const BRIDGE_CSS_PATH = 'src/styles/daisy-tailux-bridge.css';
const THEME_SWITCHER_PATH = 'src/components/shared/DaisyThemeSwitcher.jsx';

/**
 * Detects if a theme uses OKLCH colors
 */
function isOklchTheme(themeColors) {
    return Object.values(themeColors).some(color =>
        typeof color === 'string' && color.includes('oklch(')
    );
}

/**
 * Converts RGB values to space-separated format
 */
function convertRgbToSpaceSeparated(rgbString) {
    if (rgbString.includes('oklch(')) {
        return rgbString; // Return OKLCH as-is
    }

    // Handle rgb(r, g, b) format
    const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return `${rgbMatch[1]} ${rgbMatch[2]} ${rgbMatch[3]}`;
    }

    // Handle hex colors
    if (rgbString.startsWith('#')) {
        const hex = rgbString.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r} ${g} ${b}`;
    }

    return rgbString;
}

/**
 * Generates theme CSS definition
 */
function generateThemeCSS(themeName, themeConfig) {
    const { colors, description } = themeConfig;
    const isOklch = isOklchTheme(colors);

    let css = `\n/* ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme`;
    if (description) {
        css += ` (${description})`;
    }
    css += isOklch ? ' - OKLCH Colors' : ' - RGB Colors';
    css += ` */\n[data-theme="${themeName}"] {\n`;

    // Generate color variables
    Object.entries(colors).forEach(([colorName, colorValue]) => {
        const convertedValue = convertRgbToSpaceSeparated(colorValue);
        css += `    --color-${colorName}: ${convertedValue};\n`;

        // Add focus variants for primary, secondary, accent, neutral
        if (['primary', 'secondary', 'accent', 'neutral'].includes(colorName)) {
            if (isOklch && colorValue.includes('oklch(')) {
                // For OKLCH, reduce lightness by 5%
                const oklchMatch = colorValue.match(/oklch\(([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)\)/);
                if (oklchMatch) {
                    const lightness = Math.max(0, parseFloat(oklchMatch[1]) - 5);
                    const focusValue = `oklch(${lightness}% ${oklchMatch[2]} ${oklchMatch[3]})`;
                    css += `    --color-${colorName}-focus: ${focusValue};\n`;
                }
            } else {
                // For RGB, darken by reducing each component
                const rgbValues = convertedValue.split(' ').map(v => Math.max(0, parseInt(v) - 20));
                css += `    --color-${colorName}-focus: ${rgbValues.join(' ')};\n`;
            }
        }
    });

    css += `}\n`;
    return css;
}

/**
 * Updates the theme switcher component
 */
function updateThemeSwitcher(themeName, themeConfig) {
    const switcherPath = path.resolve(THEME_SWITCHER_PATH);
    let content = fs.readFileSync(switcherPath, 'utf8');

    const { label, description } = themeConfig;
    const themeEntry = `    { name: '${themeName}', label: '${label}', description: '${description}' },`;

    // Check if theme already exists
    if (content.includes(`name: '${themeName}'`)) {
        console.log(`⚠️  Theme ${themeName} already exists in switcher, skipping...`);
        return;
    }

    // Find the DAISY_THEMES array and add the new theme before the closing bracket
    const themesArrayMatch = content.match(/(const DAISY_THEMES = \[[\s\S]*?)\];/);
    if (themesArrayMatch) {
        const arrayContent = themesArrayMatch[1];
        const newArrayContent = arrayContent + `\n${themeEntry}`;
        content = content.replace(themesArrayMatch[0], newArrayContent + '\n];');

        fs.writeFileSync(switcherPath, content);
        console.log(`✅ Updated theme switcher with ${themeName} theme`);
    } else {
        console.log(`⚠️  Could not find DAISY_THEMES array in ${THEME_SWITCHER_PATH}`);
    }
}

/**
 * Updates the CSS bridge file with theme overrides
 */
function updateCssBridge(themeName, isOklch) {
    const bridgePath = path.resolve(BRIDGE_CSS_PATH);
    let content = fs.readFileSync(bridgePath, 'utf8');

    // Check if theme already has overrides
    if (content.includes(`[data-theme="${themeName}"]`)) {
        console.log(`⚠️  Theme ${themeName} already has CSS overrides, skipping...`);
        return;
    }

    if (isOklch) {
        // Add explicit theme preview overrides for OKLCH themes
        const explicitOverrides = `
/* ${themeName} theme - explicit overrides */
[data-theme="${themeName}"] .bg-primary {
    background-color: var(--color-primary) !important;
}

[data-theme="${themeName}"] .bg-secondary {
    background-color: var(--color-secondary) !important;
}

[data-theme="${themeName}"] .bg-accent {
    background-color: var(--color-accent) !important;
}
`;

        // Add before the closing comment
        content = content.replace(
            /\/\*\s*TO ADD MORE OKLCH THEMES/,
            explicitOverrides + '\n/*\nTO ADD MORE OKLCH THEMES'
        );

    } else {
        // Add to RGB theme overrides
        const rgbOverrides = `
/* ${themeName} theme - RGB overrides */
[data-theme="${themeName}"] .bg-primary {
    background-color: rgb(var(--color-primary)) !important;
}

[data-theme="${themeName}"] .bg-secondary {
    background-color: rgb(var(--color-secondary)) !important;
}

[data-theme="${themeName}"] .bg-accent {
    background-color: rgb(var(--color-accent)) !important;
}
`;

        // Add RGB overrides before OKLCH section
        content = content.replace(
            /\/\* OKLCH theme overrides/,
            rgbOverrides + '\n/* OKLCH theme overrides'
        );
    }

    fs.writeFileSync(bridgePath, content);
    console.log(`✅ Updated CSS bridge with ${themeName} theme overrides`);
}

/**
 * Main installation function
 */
function installTheme(themeName, configPath) {
    try {
        // Validate inputs
        if (!themeName || !configPath) {
            console.error('❌ Usage: node install-daisy-theme.js <theme-name> <config-file>');
            process.exit(1);
        }

        // Read theme configuration
        const fullConfigPath = path.resolve(configPath);
        if (!fs.existsSync(fullConfigPath)) {
            console.error(`❌ Theme config file not found: ${fullConfigPath}`);
            process.exit(1);
        }

        const themeConfig = JSON.parse(fs.readFileSync(fullConfigPath, 'utf8'));

        // Validate theme config
        if (!themeConfig.colors || !themeConfig.label) {
            console.error('❌ Theme config must include "colors" and "label" properties');
            process.exit(1);
        }

        console.log(`🎨 Installing theme: ${themeName}`);
        console.log(`📝 Label: ${themeConfig.label}`);
        console.log(`📄 Description: ${themeConfig.description || 'No description'}`);

        const isOklch = isOklchTheme(themeConfig.colors);
        console.log(`🎯 Color format: ${isOklch ? 'OKLCH' : 'RGB'}`);

        // Generate and add theme CSS
        const themeCSS = generateThemeCSS(themeName, themeConfig);
        const themesPath = path.resolve(THEMES_CSS_PATH);
        let themesContent = fs.readFileSync(themesPath, 'utf8');
        themesContent += themeCSS;
        fs.writeFileSync(themesPath, themesContent);
        console.log(`✅ Added theme definition to ${THEMES_CSS_PATH}`);

        // Update theme switcher
        updateThemeSwitcher(themeName, themeConfig);

        // Update CSS bridge
        updateCssBridge(themeName, isOklch);

        console.log(`\n🎉 Successfully installed ${themeName} theme!`);
        console.log(`\n📋 Next steps:`);
        console.log(`   1. Restart your development server`);
        console.log(`   2. Open the theme switcher to see your new theme`);
        console.log(`   3. Test the theme preview circles in the dropdown`);

    } catch (error) {
        console.error(`❌ Error installing theme: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
const [, , themeName, configPath] = process.argv;
installTheme(themeName, configPath);
