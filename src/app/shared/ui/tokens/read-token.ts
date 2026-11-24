/**
 * Reads an RGB triplet CSS variable from document.documentElement and returns 'rgb(<triplet>)'.
 * Returns '' if the variable is missing or empty.
 *
 * @param name Token name without '--color-' prefix (e.g. 'accent', 'income')
 */
export function readToken(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const varName = name.startsWith('--') ? name : `--color-${name}`;
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!rawValue) {
    return '';
  }
  if (rawValue.startsWith('rgb(') || rawValue.startsWith('#') || rawValue.startsWith('hsl(')) {
    return rawValue;
  }
  return `rgb(${rawValue})`;
}
