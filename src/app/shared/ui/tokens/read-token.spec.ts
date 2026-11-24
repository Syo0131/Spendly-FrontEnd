import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readToken } from './read-token';

describe('readToken', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--color-accent', '1 2 3');
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--color-accent');
  });

  it('reads rgb triplet from documentElement and returns rgb(...)', () => {
    expect(readToken('accent')).toBe('rgb(1 2 3)');
  });

  it('returns empty string if variable is missing', () => {
    expect(readToken('nope')).toBe('');
  });
});
