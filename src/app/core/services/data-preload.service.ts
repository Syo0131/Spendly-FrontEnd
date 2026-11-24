import { Injectable, inject } from '@angular/core';
import { ExpenseStateService } from './expense-state.service';
import { IncomeStateService } from './income-state.service';
import { BudgetStateService } from './budget-state.service';
import { RecurringStateService } from './recurring-state.service';
import { GoalStateService } from './goal-state.service';
import { RemindersStateService } from './reminders-state.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DataPreloadService {
  private api = inject(ApiService);
  private expenseState = inject(ExpenseStateService);
  private incomeState = inject(IncomeStateService);
  private budgetState = inject(BudgetStateService);
  private recurringState = inject(RecurringStateService);
  private goalState = inject(GoalStateService);
  private remindersState = inject(RemindersStateService);

  preloadAll() {
    // Heavy Sections: Load only first page (6 items)
    // This allows instant display without waiting for the full "Download All" forkJoin logic
    this.expenseState.preload();
    this.incomeState.preload();

    // Light Sections: Load normally
    // These defaults usually load fast enough or don't have massive data
    this.budgetState.refresh();
    this.recurringState.refresh();
    this.goalState.refresh();
    this.remindersState.refresh();

    // Prefetch Dashboard specific stats
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    this.api.getExpensesMonthTotal(year, month).subscribe({
      error: () => {},
    });

    this.api.getExpensesByCategory(year, month).subscribe({
      error: () => {},
    });
  }
}
