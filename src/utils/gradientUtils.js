// Centralized gradient color definitions - SINGLE SOURCE OF TRUTH
// To change colors, only edit this file!
// Now using only hex codes for maximum compatibility and simplicity

export const GRADIENT_COLORS = [
    {
        id: 'lavender-mint',
        name: 'Lavender to Mint',
        style: { background: 'linear-gradient(to right, #c2c2f9ff, #d3fad3ff)' }
    },
    {
        id: 'peach-cream',
        name: 'Peach to Cream',
        style: { background: 'linear-gradient(to right, #ffdbcc, #fff8dc)' }
    },
    {
        id: 'powder-blue-white',
        name: 'Powder Blue to White',
        style: { background: 'linear-gradient(to right, #b0e0e6, #ffffff)' }
    },
    {
        id: 'blush-pearl',
        name: 'Blush to Pearl',
        style: { background: 'linear-gradient(to right, #ffc0cb, #f8f8ff)' }
    },
    {
        id: 'sage-cream',
        name: 'Sage to Cream',
        style: { background: 'linear-gradient(to right, #9caf88, #faf0e6)' }
    },
    {
        id: 'soft-lilac-sky',
        name: 'Soft Lilac to Sky',
        style: { background: 'linear-gradient(to right, #dda0dd, #e0f6ff)' }
    },
    {
        id: 'champagne-rose',
        name: 'Champagne to Rose',
        style: { background: 'linear-gradient(to right, #f7e7ce, #ffe4e1)' }
    },
    {
        id: 'mint-pearl',
        name: 'Mint to Pearl',
        style: { background: 'linear-gradient(to right, #98fb98, #f5f5dc)' }
    },
    {
        id: 'baby-blue-lavender',
        name: 'Baby Blue to Lavender',
        style: { background: 'linear-gradient(to right, #add8e6, #e6e6fa)' }
    },
    {
        id: 'coral-ivory',
        name: 'Coral to Ivory',
        style: { background: 'linear-gradient(to right, #ff7f7f, #fffff0)' }
    },
    {
        id: 'soft-yellow-pink',
        name: 'Soft Yellow to Pink',
        style: { background: 'linear-gradient(to right, #ffffe0, #ffe4e1)' }
    },
    {
        id: 'seafoam-white',
        name: 'Seafoam to White',
        style: { background: 'linear-gradient(to right, #98fb98, #f0f8ff)' }
    },
    {
        id: 'dusty-rose-cream',
        name: 'Dusty Rose to Cream',
        style: { background: 'linear-gradient(to right, #d3a3a4, #fdf5e6)' }
    },
    {
        id: 'pale-turquoise-white',
        name: 'Pale Turquoise to White',
        style: { background: 'linear-gradient(to right, #afeeee, #ffffff)' }
    },
    {
        id: 'soft-peach-lilac',
        name: 'Soft Peach to Lilac',
        style: { background: 'linear-gradient(to right, #ffcccb, #dda0dd)' }
    },
    // Brighter variety gradients
    {
        id: 'sunset-burst',
        name: 'Sunset Burst',
        style: { background: 'linear-gradient(to right, #ff6b6b, #ffd93d)' }
    },
    {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        style: { background: 'linear-gradient(to right, #0066cc, #00cccc)' }
    },
    {
        id: 'electric-magenta',
        name: 'Electric Magenta',
        style: { background: 'linear-gradient(to right, #ff006e, #8338ec)' }
    },
    {
        id: 'tropical-lime',
        name: 'Tropical Lime',
        style: { background: 'linear-gradient(to right, #32cd32, #00ff7f)' }
    },
    {
        id: 'fire-orange',
        name: 'Fire Orange',
        style: { background: 'linear-gradient(to right, #ff4500, #ff8c00)' }
    },
    {
        id: 'royal-purple',
        name: 'Royal Purple',
        style: { background: 'linear-gradient(to right, #4b0082, #9932cc)' }
    }
];

// Utility to get gradient style by ID
export const getGradientStyle = (identifier) => {
    const gradient = GRADIENT_COLORS.find(g => g.id === identifier);
    return gradient ? gradient.style : {};
};

// Utility to get all gradient options for forms
export const getGradientOptions = () => {
    return GRADIENT_COLORS;
};

// Utility to get a random gradient ID (for new categories)
export const getRandomGradientId = () => {
    const randomIndex = Math.floor(Math.random() * GRADIENT_COLORS.length);
    return GRADIENT_COLORS[randomIndex].id;
};
