export const FALLBACK_ICON = 'category';

/**
 * Material Symbols ligature names are lowercase snake_case (e.g. `visibility_off`, `looks_3`).
 * Any well-formed name is passed through: the font ships ~2000 glyphs, so an allowlist
 * would silently replace valid icons (including category icons stored in the API).
 */
const LIGATURE_NAME = /^[a-z][a-z0-9_]{0,63}$/;

/**
 * Resolves an icon name to a well-formed Material ligature name, or FALLBACK_ICON
 * when the value is empty or malformed.
 */
export function resolveIcon(name: string | null | undefined): string {
  if (typeof name !== 'string') {
    return FALLBACK_ICON;
  }
  const normalized = name.trim().toLowerCase();
  return LIGATURE_NAME.test(normalized) ? normalized : FALLBACK_ICON;
}
