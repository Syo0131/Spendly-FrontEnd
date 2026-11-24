import { describe, it, expect } from 'vitest';
import {
  budgetPercent,
  budgetStatus,
  DEFAULT_WARNING_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD,
} from './budget-status';

describe('budget-status logic', () => {
  describe('budgetPercent', () => {
    it('calculates rounded percentage for positive limit', () => {
      expect(budgetPercent(740, 1000)).toBe(74);
      expect(budgetPercent(750, 1000)).toBe(75);
      expect(budgetPercent(900, 1000)).toBe(90);
      expect(budgetPercent(1300, 1000)).toBe(130);
    });

    it('handles limit <= 0 safely', () => {
      expect(budgetPercent(10, 0)).toBe(100);
      expect(budgetPercent(0, 0)).toBe(0);
      expect(budgetPercent(10, -500)).toBe(100);
      expect(budgetPercent(0, -500)).toBe(0);
    });
  });

  describe('budgetStatus', () => {
    it('returns ok, warning, critical for default thresholds (75, 90)', () => {
      expect(budgetStatus(740, 1000)).toBe('ok');
      expect(budgetStatus(750, 1000)).toBe('warning');
      expect(budgetStatus(900, 1000)).toBe('critical');
      expect(budgetStatus(1300, 1000)).toBe('critical');
    });

    it('respects custom thresholds (50, 80)', () => {
      expect(budgetStatus(600, 1000, 50, 80)).toBe('warning');
      expect(budgetStatus(450, 1000, 50, 80)).toBe('ok');
      expect(budgetStatus(850, 1000, 50, 80)).toBe('critical');
    });

    it('handles zero or negative limits', () => {
      expect(budgetStatus(10, 0)).toBe('critical');
      expect(budgetStatus(0, 0)).toBe('ok');
    });

    it('exposes default threshold constants', () => {
      expect(DEFAULT_WARNING_THRESHOLD).toBe(75);
      expect(DEFAULT_CRITICAL_THRESHOLD).toBe(90);
    });
  });
});
