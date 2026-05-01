const { colors } = require('./constants/colors.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        purple: colors.purple,
        teal: colors.teal,
        coral: colors.coral,
        pink: colors.pink,
        amber: colors.amber,
        gray: colors.gray,
        bg: colors.bg,
        surface: colors.surface,
        border: colors.border,
      },
    },
  },
  plugins: [],
};
