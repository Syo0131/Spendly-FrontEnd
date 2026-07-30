/**
 * Shared chart theming helpers.
 *
 * Chart.js colors are plain strings, so they can't use Tailwind classes. To keep
 * charts consistent with the design tokens (and theme-aware), we read the CSS
 * custom properties defined in styles.css at runtime. Call the color helpers
 * whenever the theme changes (e.g. inside an effect that depends on the theme
 * signal) and reassign the chart data/options.
 */

/** Categorical palette — muted editorial tones that sit on warm cream/charcoal. */
export const CHART_PALETTE = [
  '#bd5a34', // terracotta (brand)
  '#6b7f4e', // olive
  '#c8892e', // ochre
  '#4f8a86', // muted teal
  '#8a5a7a', // plum
  '#9c6b3f', // sienna
  '#7a8a5a', // sage
  '#5f7a8a', // dusty blue
];

/** Slightly darker variants used for hover states. */
export const CHART_PALETTE_HOVER = [
  '#a24d2c',
  '#5a6b41',
  '#a97324',
  '#41726f',
  '#744b66',
  '#835932',
  '#66744b',
  '#4f6675',
];

/** Read a `--var` holding "R G B" channels and return an rgb()/rgba() string. */
function cssVarRgb(name: string, alpha = 1): string {
  const raw =
    typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      : '';
  if (!raw) return alpha === 1 ? 'rgb(100 116 139)' : `rgb(100 116 139 / ${alpha})`;
  return alpha === 1 ? `rgb(${raw})` : `rgb(${raw} / ${alpha})`;
}

/** Axis tick / legend label color (theme-aware). */
export const chartAxisColor = () => cssVarRgb('--chart-axis');

/** Grid line color (theme-aware, low alpha). */
export const chartGridColor = () => cssVarRgb('--chart-grid', 0.08);

/** Income / positive series color (maps to the `success` token). */
export const chartIncomeColor = () => cssVarRgb('--success');

/** Expense / negative series color (maps to the `expense` token). */
export const chartExpenseColor = () => cssVarRgb('--expense');

/** Editorial draw-in animation for bar/line charts. */
export const CHART_ANIMATION = { duration: 900, easing: 'easeOutQuart' as const };

/** Draw-in for doughnut/pie (scale + rotate). */
export const CHART_ANIMATION_RADIAL = {
  duration: 900,
  easing: 'easeOutQuart' as const,
  animateScale: true,
  animateRotate: true,
};
