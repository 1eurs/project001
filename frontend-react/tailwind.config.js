/** @type {import('tailwindcss').Config} */
// Tailwind is used ONLY by the marketing landing page (features/site). The rest of
// the app is hand-written plain CSS with its own theme tokens (src/styles/theme.css).
// To keep the two worlds from colliding:
//   • preflight is OFF  -> Tailwind never resets the existing app's base styles.
//   • important:'#neo'  -> every utility is generated as a descendant of #neo, so
//                          utilities only take effect inside the landing's root and
//                          can never leak onto the customer / dashboard / admin pages.
export default {
  content: ['./src/features/site/**/*.{ts,tsx}'],
  important: '#neo',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        // Matched to the app's theme tokens (src/styles/theme.css) so the
        // landing reads as the same product: green-accented on warm off-white.
        neo: {
          bg: '#FAFAF7',      // app --bg (warm off-white canvas)
          ink: '#15181C',     // app --text (structural near-black)
          accent: '#10b981',  // app --accent (emerald green — primary)
          secondary: '#F5B83D', // app --amber (warm highlight)
          muted: '#B08CFF',   // app --violet (soft accent)
        },
      },
      fontFamily: {
        // English display + UI; Arabic gets a heavy geometric face that can carry 900.
        display: ["'Space Grotesk'", 'system-ui', 'sans-serif'],
        ar: ["'Tajawal'", "'IBM Plex Sans Arabic'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neo-sm': '4px 4px 0px 0px #000',
        neo: '8px 8px 0px 0px #000',
        'neo-lg': '12px 12px 0px 0px #000',
        'neo-xl': '16px 16px 0px 0px #000',
        'neo-white': '8px 8px 0px 0px #fff',
        'neo-white-lg': '12px 12px 0px 0px #fff',
      },
      keyframes: {
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'spin-slow': 'spin-slow 12s linear infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
