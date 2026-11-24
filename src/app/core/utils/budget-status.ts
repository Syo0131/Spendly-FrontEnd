export type BudgetStatus = 'ok' | 'warning' | 'critical';

export const DEFAULT_WARNING_THRESHOLD = 75;
export const DEFAULT_CRITICAL_THRESHOLD = 90;

/**
 * Calculates percentage of budget spent: Math.round(spent / limit * 100).
 * If limit <= 0, returns 100 when spent > 0, else 0.
 */
export function budgetPercent(spent: number, limit: number): number {
  if (limit <= 0) {
    return spent > 0 ? 100 : 0;
  }
  return Math.round((spent / limit) * 100);
}

/**
 * Determines budget status based on spent, limit, and thresholds.
 * Status is:
 * - 'critical' if percent >= criticalThreshold or percent > 100
 * - 'warning' if percent >= warningThreshold
 * - 'ok' otherwise
 */
export function budgetStatus(
  spent: number,
  limit: number,
  warningThreshold?: number | null,
  criticalThreshold?: number | null,
): BudgetStatus {
  const warn = warningThreshold ?? DEFAULT_WARNING_THRESHOLD;
  const crit = criticalThreshold ?? DEFAULT_CRITICAL_THRESHOLD;

  if (limit <= 0) {
    return spent > 0 ? 'critical' : 'ok';
  }

  const pct = budgetPercent(spent, limit);
  if (pct >= crit || pct > 100) {
    return 'critical';
  }
  if (pct >= warn) {
    return 'warning';
  }
  return 'ok';
}
