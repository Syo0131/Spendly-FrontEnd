/**
 * Utility functions for month navigation and boundaries.
 */

/**
 * Returns true if the given year and 1-based month is strictly after today's month.
 */
export function isFutureMonth(year: number, month1to12: number, today: Date = new Date()): boolean {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  if (year > currentYear) return true;
  if (year === currentYear && month1to12 > currentMonth) return true;
  return false;
}

/**
 * Shifts a date by delta months, returning the 1st day of the target month.
 * Avoids month-end overflow issues (e.g. Jan 31 + 1 month -> March).
 */
export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/**
 * The 12 months ending at the anchor's month (inclusive), oldest first. Months are 1-based.
 */
export function lastTwelveMonths(anchor: Date): { year: number; month: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = shiftMonth(anchor, i - 11);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
}
