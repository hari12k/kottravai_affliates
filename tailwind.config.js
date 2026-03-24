module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#8E2A8B', // Brand Purple (Keep for legacy compatibility)
                brandPurple: '#4B1C71', // New Dark Purple
                brandPink: '#8E2A8B',  // Updated to Brand Purple as requested
                brandBlack: '#2D2D2D',  // New Soft Black
                deepGrey: '#4A4A4A',   // New Deep Grey
                secondary: '#1a1a1a',
                dark: '#000000',
            },
            fontFamily: {
                comfortaa: ['Comfortaa', 'cursive'],
                montserrat: ['Montserrat', 'sans-serif'],
                outfit: ['Outfit', 'sans-serif'],
                sans: ['Outfit', 'sans-serif'],
            },
            container: {
                center: true,
                padding: '1rem',
                screens: {
                    sm: '600px',
                    md: '728px',
                    lg: '984px',
                    xl: '1240px',
                    '2xl': '1280px',
                },
            }
        },
    },
    plugins: [],
}
