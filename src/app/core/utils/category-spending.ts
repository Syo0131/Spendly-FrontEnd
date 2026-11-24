import { Budget, Category, MonthlyStats } from '../models/api.models';
import { BudgetStatus, budgetPercent, budgetStatus } from './budget-status';

export interface CategorySpendingBudget {
  scope: 'month' | 'year';
  spent: number;   // the budget's own spent from the API (bugfix B9)
  limit: number;
  percent: number; // budgetPercent(spent, limit)
  status: BudgetStatus;
}

export interface CategorySpendingRow {
  categoryName: string;   // the MonthlyStats key
  categoryId: number | null;
  color: string | null;   // Category.color, or null when there is no match
  icon: string | null;    // Category.icons, or null when there is no match
  spent: number;          // this month
  shareOfTotal: number;   // Math.round(spent / monthTotal * 100)
  budget: CategorySpendingBudget | null;
}

/**
 * Builds and sorts category spending rows from monthly stats, budgets, and categories.
 * Rules:
 * - Only stats entries with spent > 0 are included.
 * - Rows are sorted by spent descending, then by categoryName ascending.
 * - Budgets are matched strictly on budget.category?.name === categoryName.
 *   - MONTHLY is preferred over YEARLY.
 *   - DAILY and WEEKLY periods are ignored.
 *   - Multiple candidates in the same scope are resolved by latest startDate.
 */
export function buildCategorySpendingRows(
  stats: MonthlyStats,
  budgets: Budget[],
  categories: Category[],
): CategorySpendingRow[] {
  if (!stats || typeof stats !== 'object') {
    return [];
  }

  // Filter positive spending entries
  const positiveEntries: { name: string; spent: number }[] = [];
  let monthTotal = 0;

  for (const [name, amount] of Object.entries(stats)) {
    if (typeof amount === 'number' && amount > 0) {
      positiveEntries.push({ name, spent: amount });
      monthTotal += amount;
    }
  }

  if (positiveEntries.length === 0) {
    return [];
  }

  // Sort descending by spent, then ascending by name
  positiveEntries.sort((a, b) => {
    if (b.spent !== a.spent) {
      return b.spent - a.spent;
    }
    return a.name.localeCompare(b.name);
  });

  return positiveEntries.map(({ name, spent }) => {
    // 1. Resolve matching category metadata
    const category = categories.find((c) => c.name === name);
    const categoryId = category?.id ?? null;
    const color = category?.color || null;
    const icon = category?.icons || null;

    // 2. Calculate share of month total
    const shareOfTotal = monthTotal > 0 ? Math.round((spent / monthTotal) * 100) : 0;

    // 3. Resolve budget candidate
    const candidates = budgets.filter((b) => b.category?.name === name);
    const monthlyBudgets = candidates.filter((b) => b.period === 'MONTHLY');
    const yearlyBudgets = candidates.filter((b) => b.period === 'YEARLY');

    let chosenBudget: Budget | null = null;
    let scope: 'month' | 'year' = 'month';

    if (monthlyBudgets.length > 0) {
      scope = 'month';
      chosenBudget = monthlyBudgets.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
    } else if (yearlyBudgets.length > 0) {
      scope = 'year';
      chosenBudget = yearlyBudgets.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];
    }

    let budgetData: CategorySpendingBudget | null = null;
    if (chosenBudget) {
      const bSpent = chosenBudget.spent;
      const bLimit = chosenBudget.limit;
      budgetData = {
        scope,
        spent: bSpent,
        limit: bLimit,
        percent: budgetPercent(bSpent, bLimit),
        status: budgetStatus(
          bSpent,
          bLimit,
          chosenBudget.warningThreshold,
          chosenBudget.criticalThreshold
        ),
      };
    }

    return {
      categoryName: name,
      categoryId,
      color,
      icon,
      spent,
      shareOfTotal,
      budget: budgetData,
    };
  });
}
