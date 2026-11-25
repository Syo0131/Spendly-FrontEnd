import { describe, it, expect } from 'vitest';
import { isFutureMonth, shiftMonth, lastTwelveMonths } from './month';

describe('month utils', () => {
  describe('isFutureMonth', () => {
    it('returns true when candidate month is in the future', () => {
      const today = new Date(2026, 10, 24); // Nov 24, 2026
      expect(isFutureMonth(2026, 12, today)).toBe(true);
      expect(isFutureMonth(2027, 1, today)).toBe(true);
    });

    it('returns false for current or past months', () => {
      const today = new Date(2026, 10, 24); // Nov 24, 2026
      expect(isFutureMonth(2026, 11, today)).toBe(false);
      expect(isFutureMonth(2026, 10, today)).toBe(false);
      expect(isFutureMonth(2025, 12, today)).toBe(false);
    });
  });

  describe('shiftMonth', () => {
    it('returns first day of target month without month-end drift', () => {
      const jan31 = new Date(2026, 0, 31);
      const prev = shiftMonth(jan31, -1);
      expect(prev.getFullYear()).toBe(2025);
      expect(prev.getMonth()).toBe(11);
      expect(prev.getDate()).toBe(1);

      const next = shiftMonth(jan31, 1);
      expect(next.getFullYear()).toBe(2026);
      expect(next.getMonth()).toBe(1);
      expect(next.getDate()).toBe(1);
    });
  });

  describe('lastTwelveMonths', () => {
    it('returns the 12 months ending at the anchor month, oldest first, across a year boundary', () => {
      const months = lastTwelveMonths(new Date(2026, 1, 15)); // Feb 15, 2026
      expect(months).toHaveLength(12);
      expect(months[0]).toEqual({ year: 2025, month: 3 });
      expect(months[10]).toEqual({ year: 2026, month: 1 });
      expect(months[11]).toEqual({ year: 2026, month: 2 });
    });
  });
});
