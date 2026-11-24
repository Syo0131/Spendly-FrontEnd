import { describe, it, expect } from 'vitest';
import { resolveIcon, FALLBACK_ICON } from './icon-map';

describe('icon-map', () => {
  it('resolves known category icon "restaurant"', () => {
    expect(resolveIcon('restaurant')).toBe('restaurant');
  });

  it('resolves unknown icon to FALLBACK_ICON', () => {
    expect(resolveIcon('unknown_xyz')).toBe(FALLBACK_ICON);
  });

  it('resolves empty or null icon to FALLBACK_ICON', () => {
    expect(resolveIcon('')).toBe(FALLBACK_ICON);
    expect(resolveIcon(null)).toBe(FALLBACK_ICON);
    expect(resolveIcon(undefined)).toBe(FALLBACK_ICON);
  });
});
