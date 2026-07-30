/** @type {import('tailwindcss').Config} */

/**
 * Helper: build a Tailwind color value from a CSS custom property that holds
 * space-separated RGB channels (e.g. `--surface: 255 255 255`). Using channels
 * keeps `/<alpha-value>` opacity modifiers working (bg-surface/50, etc.).
 */
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // ----- Brand: warm terracotta (accent is theme-aware via CSS vars) -----
        primary: {
          DEFAULT: withVar('--primary'), // lighter/warmer in dark so it glows
          ink: withVar('--primary-ink'), // accent text/links (adapts per theme)
          on: withVar('--on-primary'), // text/icon color ON a primary fill (AA both themes)
          light: '#d9744f', // gradient/hover-from lighter shade
          dark: withVar('--primary-hover'), // hover fill (darker in light, lighter in dark)
          50: '#fbf1ec',
          100: '#f6e0d5',
          200: '#eec2ad',
          300: '#e3a184',
          400: '#d1744f',
          500: '#bd5a34',
          600: '#a24d2c',
          700: '#853f24',
          800: '#6c3420',
          900: '#5a2d1d',
          950: '#31160e',
        },
        // Harmonious deeper terracotta for the (now monochromatic) brand gradients
        secondary: {
          DEFAULT: withVar('--secondary'), // theme-aware to stay luminous in dark
          light: '#d9744f',
          dark: '#853f24',
        },
        danger: '#ef4444', // reserved for hard-destructive actions

        // ----- Semantic design tokens (theme-aware via CSS vars in styles.css) -----
        surface: {
          DEFAULT: withVar('--surface'), // page canvas
          2: withVar('--surface-2'), // elevated (cards, sheets)
          3: withVar('--surface-3'), // sunken (inputs, wells)
        },
        content: {
          DEFAULT: withVar('--content'), // primary text (ink)
          muted: withVar('--content-muted'), // secondary text
          subtle: withVar('--content-subtle'), // eyebrows / faint labels
        },
        divider: withVar('--divider'), // borders / separators
        success: withVar('--success'), // income / positive
        expense: withVar('--expense'), // expense / negative (berry)
        warning: withVar('--warning'), // warnings (ochre)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // Editorial display serif (headings + large money figures)
        serif: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
