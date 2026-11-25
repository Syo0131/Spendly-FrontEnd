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

export type IconGlyph = { kind: 'ligature' | 'emoji'; value: string };

/**
 * One emoji sequence: pictographs plus the joiners/modifiers that compose them
 * (ZWJ families, skin tones, variation selector, regional-indicator flags).
 * Category icons stored by the API are emojis (e.g. 🍔, 🚗, 🛠️).
 */
const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️)+$/u;

/**
 * Resolves an icon value to what `ui-icon` should draw: an emoji as text, or a Material ligature
 * (with FALLBACK_ICON for empty or malformed values).
 */
export function resolveIconGlyph(name: string | null | undefined): IconGlyph {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed.length > 0 && trimmed.length <= 32 && EMOJI.test(trimmed)) {
    return { kind: 'emoji', value: trimmed };
  }
  return { kind: 'ligature', value: resolveIcon(name) };
}
