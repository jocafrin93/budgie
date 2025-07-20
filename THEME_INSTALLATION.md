# DaisyUI Theme Installation System

This system provides automated installation of DaisyUI themes with full integration into the Tailux application, supporting both RGB and OKLCH color formats with proper theme previews.

## 🚀 Quick Start

### Install a Theme

```bash
# Method 1: Direct script
node scripts/install-daisy-theme.js midnight themes/midnight.json

# Method 2: NPM script (recommended)
npm run install-theme midnight themes/midnight.json

# Install OKLCH theme
npm run install-theme aurora themes/aurora.json
```

### Create Theme Directory

```bash
mkdir -p themes
```

## 📁 File Structure

```
budgie-tailux/
├── scripts/
│   └── install-daisy-theme.js     # Installation script
├── themes/
│   ├── midnight.json              # RGB theme example
│   └── aurora.json                # OKLCH theme example
├── src/
│   ├── styles/
│   │   ├── daisy-themes.css       # Theme definitions
│   │   └── daisy-tailux-bridge.css # CSS overrides
│   └── components/shared/
│       └── DaisyThemeSwitcher.jsx # Theme switcher component
└── THEME_INSTALLATION.md          # This documentation
```

## 🎨 Theme Configuration Format

### Basic Structure

```json
{
    "label": "Theme Display Name",
    "description": "Brief description of the theme",
    "colors": {
        "base-100": "color-value",
        "base-200": "color-value",
        "base-300": "color-value",
        "base-content": "color-value",
        "primary": "color-value",
        "primary-content": "color-value",
        "secondary": "color-value",
        "secondary-content": "color-value",
        "accent": "color-value",
        "accent-content": "color-value",
        "neutral": "color-value",
        "neutral-content": "color-value",
        "info": "color-value",
        "info-content": "color-value",
        "success": "color-value",
        "success-content": "color-value",
        "warning": "color-value",
        "warning-content": "color-value",
        "error": "color-value",
        "error-content": "color-value"
    }
}
```

### Required Fields

- `label`: Display name shown in theme switcher
- `colors`: Object containing all theme colors
- `colors.base-100`: Main background color
- `colors.base-content`: Main text color
- `colors.primary`: Primary accent color

### Optional Fields

- `description`: Brief description shown in theme switcher

## 🎯 Color Formats

### RGB Format (Space-Separated)

```json
{
    "colors": {
        "base-100": "255 255 255",
        "primary": "59 130 246",
        "secondary": "139 92 246"
    }
}
```

### OKLCH Format

```json
{
    "colors": {
        "base-100": "oklch(95% 0.01 180)",
        "primary": "oklch(65% 0.25 300)",
        "secondary": "oklch(70% 0.20 200)"
    }
}
```

### Hex Format (Auto-converted)

```json
{
    "colors": {
        "base-100": "#ffffff",
        "primary": "#3b82f6",
        "secondary": "#8b5cf6"
    }
}
```

## 🔧 What the Script Does

### 1. Theme Definition
- Adds CSS variables to `src/styles/daisy-themes.css`
- Generates focus states automatically
- Handles both RGB and OKLCH formats

### 2. Theme Switcher Integration
- Updates `src/components/shared/DaisyThemeSwitcher.jsx`
- Adds theme to dropdown list
- Ensures proper theme previews

### 3. CSS Bridge Updates
- Updates `src/styles/daisy-tailux-bridge.css`
- Adds comprehensive CSS overrides
- Ensures theme previews work correctly
- Handles both RGB and OKLCH color systems

### 4. Automatic Detection
- Detects RGB vs OKLCH format automatically
- Applies appropriate CSS overrides
- Generates proper focus states

## 📋 Installation Process

### Step 1: Create Theme Configuration

Create a JSON file in the `themes/` directory:

```json
{
    "label": "My Custom Theme",
    "description": "A beautiful custom theme",
    "colors": {
        "base-100": "oklch(98% 0.002 180)",
        "base-200": "oklch(96% 0.004 180)",
        "base-300": "oklch(94% 0.006 180)",
        "base-content": "oklch(20% 0.008 180)",
        "primary": "oklch(60% 0.20 280)",
        "primary-content": "oklch(98% 0.002 280)",
        "secondary": "oklch(65% 0.15 320)",
        "secondary-content": "oklch(98% 0.002 320)",
        "accent": "oklch(70% 0.18 120)",
        "accent-content": "oklch(20% 0.008 120)",
        "neutral": "oklch(30% 0.01 180)",
        "neutral-content": "oklch(90% 0.002 180)",
        "info": "oklch(65% 0.15 240)",
        "info-content": "oklch(20% 0.008 240)",
        "success": "oklch(70% 0.18 140)",
        "success-content": "oklch(20% 0.008 140)",
        "warning": "oklch(75% 0.15 80)",
        "warning-content": "oklch(25% 0.008 80)",
        "error": "oklch(65% 0.20 20)",
        "error-content": "oklch(95% 0.002 20)"
    }
}
```

### Step 2: Run Installation Script

```bash
node scripts/install-daisy-theme.js my-custom-theme themes/my-custom-theme.json
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 4: Test Theme

1. Open the application
2. Click the theme switcher
3. Select your new theme
4. Verify theme previews show correctly
5. Test theme switching functionality

## 🎨 Theme Preview System

The script ensures theme previews work correctly by:

### RGB Themes
- Uses `rgb(var(--color-primary))` format
- Adds explicit overrides for each theme
- Ensures previews work regardless of active theme

### OKLCH Themes  
- Uses direct `var(--color-primary)` format
- Adds to OKLCH override selectors
- Handles opacity and focus states properly

### Preview Circles
The theme switcher shows three preview circles:
- **Circle 1**: Primary color
- **Circle 2**: Secondary color  
- **Circle 3**: Accent color

## 🔍 Troubleshooting

### Theme Not Showing in Switcher
- Check theme configuration JSON syntax
- Verify all required fields are present
- Restart development server

### Preview Circles Not Working
- Ensure theme was installed with the script
- Check browser console for CSS errors
- Verify CSS bridge file was updated

### Colors Not Applying
- Check color format (RGB vs OKLCH)
- Verify CSS variable names match DaisyUI spec
- Clear browser cache

### Script Errors
- Verify Node.js is installed
- Check file paths are correct
- Ensure write permissions on target files

## 📚 Examples

### Minimal RGB Theme

```json
{
    "label": "Simple Blue",
    "description": "Clean blue theme",
    "colors": {
        "base-100": "255 255 255",
        "base-200": "249 250 251", 
        "base-300": "229 231 235",
        "base-content": "31 41 55",
        "primary": "59 130 246",
        "primary-content": "255 255 255",
        "secondary": "107 114 128",
        "secondary-content": "255 255 255",
        "accent": "34 197 94",
        "accent-content": "255 255 255",
        "neutral": "75 85 99",
        "neutral-content": "255 255 255",
        "info": "14 165 233",
        "info-content": "255 255 255",
        "success": "34 197 94", 
        "success-content": "255 255 255",
        "warning": "245 158 11",
        "warning-content": "255 255 255",
        "error": "239 68 68",
        "error-content": "255 255 255"
    }
}
```

### Advanced OKLCH Theme

```json
{
    "label": "Cosmic Purple",
    "description": "Deep space theme with purple gradients",
    "colors": {
        "base-100": "oklch(12% 0.02 280)",
        "base-200": "oklch(16% 0.03 280)",
        "base-300": "oklch(20% 0.04 280)",
        "base-content": "oklch(92% 0.01 280)",
        "primary": "oklch(70% 0.25 290)",
        "primary-content": "oklch(95% 0.01 290)",
        "secondary": "oklch(65% 0.20 320)",
        "secondary-content": "oklch(95% 0.01 320)",
        "accent": "oklch(75% 0.18 200)",
        "accent-content": "oklch(15% 0.02 200)",
        "neutral": "oklch(35% 0.05 280)",
        "neutral-content": "oklch(85% 0.01 280)",
        "info": "oklch(70% 0.15 240)",
        "info-content": "oklch(15% 0.02 240)",
        "success": "oklch(75% 0.20 140)",
        "success-content": "oklch(15% 0.02 140)",
        "warning": "oklch(80% 0.18 80)",
        "warning-content": "oklch(20% 0.02 80)",
        "error": "oklch(70% 0.22 20)",
        "error-content": "oklch(95% 0.01 20)"
    }
}
```

## 🚀 Advanced Usage

### Batch Installation

```bash
# Install multiple themes
for theme in themes/*.json; do
    name=$(basename "$theme" .json)
    node scripts/install-daisy-theme.js "$name" "$theme"
done
```

### Theme Validation

The script automatically validates:
- JSON syntax
- Required fields presence
- Color format detection
- File permissions

### Custom Integration

You can extend the script to:
- Add custom CSS properties
- Generate additional color variants
- Integrate with design systems
- Export themes to other formats

## 📝 Notes

- Always backup your files before running the script
- Test themes in different browsers
- Consider accessibility when choosing colors
- Use semantic color names for better maintainability
- OKLCH themes provide better color consistency
- RGB themes have wider browser support

## 🔗 Resources

- [DaisyUI Theme Documentation](https://daisyui.com/docs/themes/)
- [OKLCH Color Space](https://oklch.com/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Color Accessibility Guidelines](https://webaim.org/articles/contrast/)
