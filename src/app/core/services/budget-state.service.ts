import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { Budget, CreateBudgetDto } from '../models/api.models';
import { tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BudgetStateService {
  private api = inject(ApiService);

  // State Signals
  private _budgets = signal<Budget[]>([]);
  private _isLoading = signal<boolean>(false);
  private _loaded = signal<boolean>(false); // Track if we've fetched initially
  private _currentDate = signal<Date>(new Date());

  // Session-scoped notification tracking (resets on app reload)
  private notifiedBudgetIds = new Set<number>();

  hasNotified(id: number): boolean {
    return this.notifiedBudgetIds.has(id);
  }

  markNotified(id: number) {
    this.notifiedBudgetIds.add(id);
  }

  // Public Read-only Signals
  budgets = this._budgets.asReadonly();
  isLoading = this._isLoading.asReadonly();
  currentDate = this._currentDate.asReadonly();

  // Computed: Filter budgets by current date
  filteredBudgets = computed(() => {
    const all = this._budgets();
    const date = this._currentDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return all.filter((b) => (b.month === month && b.year === year) || (!b.month && !b.year));
  });

  constructor() {}

  // Actions
  setDate(date: Date) {
    this._currentDate.set(new Date(date));
  }

  load(force = false) {
    if (this._loaded() && !force) return;

    this._isLoading.set(true);
    // Fetch a large page to get "all" for client-side filtering
    // In a real large-scale app, we would fetch by month from backend.
    this.api
      .getBudgets(0, 300)
      .pipe(
        tap((res) => {
          this._budgets.set(res.content);
          this._loaded.set(true);
        }),
        finalize(() => this._isLoading.set(false))
      )
      .subscribe();
  }

  refresh() {
    this.load(true);
  }

  // Optimistic Updates
  addBudget(dto: CreateBudgetDto) {
    return this.api.createBudget(dto).pipe(
      tap(() => this.refresh()) // Simplest strategy: refresh all to get generated fields/IDs
    );
  }

  removeBudget(id: number) {
    // Optimistic
    const prev = this._budgets();
    this._budgets.update((list) => list.filter((b) => b.id !== id));

    return this.api.deleteBudget(id).pipe(
      tap({
        error: () => this._budgets.set(prev), // Revert on failure
      })
    );
  }
}
