import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ExpenseResponse, CreateExpense, UpdateExpense } from '../models/api.models';
import { tap, finalize } from 'rxjs/operators';
import { BudgetStateService } from './budget-state.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseStateService {
  private api = inject(ApiService);
  private budgetState = inject(BudgetStateService);

  // State Signals
  private _expenses = signal<ExpenseResponse[]>([]);
  private _totalElements = signal<number>(0);
  private _totalPages = signal<number>(0);
  private _currentPage = signal<number>(0);
  private _pageSize = signal<number>(20);

  private _isLoading = signal<boolean>(false);
  private _loaded = signal<boolean>(false);

  // Public Read-only Signals
  expenses = this._expenses.asReadonly();
  totalElements = this._totalElements.asReadonly();
  totalPages = this._totalPages.asReadonly();
  currentPage = this._currentPage.asReadonly();
  pageSize = this._pageSize.asReadonly();
  isLoading = this._isLoading.asReadonly();
  loaded = this._loaded.asReadonly();

  constructor() {}

  // Actions
  load(page = 0, size = 20, force = false) {
    if (this._loaded() && this._currentPage() === page && this._pageSize() === size && !force)
      return;

    this._isLoading.set(true);
    this.api
      .getExpenses(page, size)
      .pipe(
        tap((res) => {
          this._expenses.set(res.content);
          this._totalElements.set(res.page.totalElements);
          this._totalPages.set(res.page.totalPages);
          this._currentPage.set(res.page.number);
          this._pageSize.set(size);
          this._loaded.set(true);
        }),
        finalize(() => this._isLoading.set(false))
      )
      .subscribe();
  }

  refresh() {
    this.load(this._currentPage(), this._pageSize(), true);
  }

  add(dto: CreateExpense) {
    return this.api.createExpense(dto).pipe(
      tap(() => {
        this.refresh();
        // Sync Budgets
        this.budgetState.refresh();
      })
    );
  }

  update(id: number, dto: UpdateExpense) {
    return this.api.updateExpense(id, dto).pipe(
      tap(() => {
        this.refresh();
        // Sync Budgets
        this.budgetState.refresh();
      })
    );
  }

  delete(id: number) {
    const prev = this._expenses();
    this._expenses.update((list) => list.filter((i) => i.id !== id));

    return this.api.deleteExpense(id).pipe(
      tap({
        error: () => this._expenses.set(prev),
        next: () => {
          this.refresh();
          // Sync Budgets
          this.budgetState.refresh();
        },
      })
    );
  }
}
