import { describe, it, expect } from 'vitest';
import { resolveIcon, FALLBACK_ICON } from './icon-map';

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
});
