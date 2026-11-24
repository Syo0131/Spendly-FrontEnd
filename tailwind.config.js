function withAlpha(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Semantic Tokens from DESIGN.md
        canvas: withAlpha('--color-surface-canvas'),
        surface: {
          DEFAULT: withAlpha('--color-surface'),
          raised: withAlpha('--color-surface-raised'),
          sunken: withAlpha('--color-surface-sunken'),
        },
        border: {
          DEFAULT: withAlpha('--color-border'),
          subtle: withAlpha('--color-border-subtle'),
        },
        ink: {
          DEFAULT: withAlpha('--color-ink'),
          muted: withAlpha('--color-ink-muted'),
          subtle: withAlpha('--color-ink-subtle'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent'),
          contrast: withAlpha('--color-accent-contrast'),
        },
        income: withAlpha('--color-income'),
        expense: withAlpha('--color-expense'),
        status: {
          ok: withAlpha('--color-status-ok'),
          warning: withAlpha('--color-status-warning'),
          critical: withAlpha('--color-status-critical'),
        },
        track: withAlpha('--color-track'),
        'bar-neutral': withAlpha('--color-bar-neutral'),
        'focus-ring': withAlpha('--color-focus-ring'),
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans Variable"',
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
