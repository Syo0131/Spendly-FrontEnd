import { describe, it, expect } from 'vitest';
import { resolveIcon, resolveIconGlyph, FALLBACK_ICON } from './icon-map';

describe('icon-map', () => {
  it('resolves known category icon "restaurant"', () => {
    expect(resolveIcon('restaurant')).toBe('restaurant');
  });

  it('passes through any well-formed Material ligature name', () => {
    for (const name of ['lock', 'person', 'visibility', 'visibility_off', 'check_circle', 'filter_list', 'local_bar', 'looks_3']) {
      expect(resolveIcon(name)).toBe(name);
    }
  });

  it('normalizes case and surrounding whitespace', () => {
    expect(resolveIcon('  Restaurant ')).toBe('restaurant');
  });

  it('resolves malformed names to FALLBACK_ICON', () => {
    for (const name of ['Comida rápida', '🍔', '<b>x</b>', '3d_rotation_x y', '_lock', 'a'.repeat(65)]) {
      expect(resolveIcon(name)).toBe(FALLBACK_ICON);
    }
  });

  it('resolves empty or null icon to FALLBACK_ICON', () => {
    expect(resolveIcon('')).toBe(FALLBACK_ICON);
    expect(resolveIcon('   ')).toBe(FALLBACK_ICON);
    expect(resolveIcon(null)).toBe(FALLBACK_ICON);
    expect(resolveIcon(undefined)).toBe(FALLBACK_ICON);
  });

  describe('resolveIconGlyph', () => {
    it('keeps category emojis stored by the API as emoji glyphs', () => {
      for (const emoji of ['🍔', '🚗', '🏠', '🛠️', '🍺', '👨‍👩‍👧', '🇩🇴']) {
        expect(resolveIconGlyph(emoji)).toEqual({ kind: 'emoji', value: emoji });
      }
    });

    it('trims surrounding whitespace around an emoji', () => {
      expect(resolveIconGlyph(' 🍔 ')).toEqual({ kind: 'emoji', value: '🍔' });
    });

    it('resolves Material names as ligatures', () => {
      expect(resolveIconGlyph('restaurant')).toEqual({ kind: 'ligature', value: 'restaurant' });
    });

    it('falls back to the Material fallback for text, mixed or empty values', () => {
      for (const value of ['Comida rápida', '🍔 food', '', null, undefined]) {
        expect(resolveIconGlyph(value)).toEqual({ kind: 'ligature', value: FALLBACK_ICON });
      }
    });
  });
});
