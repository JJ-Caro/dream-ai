/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0D0D12',
        surface: '#1A1A24',
        'surface-elevated': '#252532',
        primary: '#8B7CF7',
        secondary: '#5B9CF7',
        'text-primary': '#EEEEF0',
        'text-secondary': '#9999A8',
        positive: '#7CD7A8',
        negative: '#E57373',
        border: '#2A2A3A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrainsMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
