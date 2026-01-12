import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  RecurringExpense,
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
} from '../models/api.models';
import { tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RecurringStateService {
  private api = inject(ApiService);

  // State Signals
  private _recurringExpenses = signal<RecurringExpense[]>([]);
  private _totalElements = signal<number>(0);
  private _totalPages = signal<number>(0);
  private _currentPage = signal<number>(0);
  private _pageSize = signal<number>(10);

  private _isLoading = signal<boolean>(false);
  private _loaded = signal<boolean>(false);

  // Public Read-only Signals
  recurringExpenses = this._recurringExpenses.asReadonly();
  totalElements = this._totalElements.asReadonly();
  totalPages = this._totalPages.asReadonly();
  currentPage = this._currentPage.asReadonly();
  pageSize = this._pageSize.asReadonly();
  isLoading = this._isLoading.asReadonly();
  loaded = this._loaded.asReadonly();

  constructor() {}

  // Actions
  load(page = 0, size = 10, force = false) {
    if (this._loaded() && this._currentPage() === page && this._pageSize() === size && !force)
      return;

    this._isLoading.set(true);
    this.api
      .getRecurringExpenses(page, size)
      .pipe(
        tap((res: any) => {
          this._recurringExpenses.set(res.content);
          // Handle both nested page object (Project Standard) and flat structure (Spec)
          if (res.page) {
            this._totalElements.set(res.page.totalElements);
            this._totalPages.set(res.page.totalPages);
            this._currentPage.set(res.page.number);
          } else {
            this._totalElements.set(res.totalElements || 0);
            this._totalPages.set(res.totalPages || 0);
            this._currentPage.set(page);
          }
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

  add(dto: CreateRecurringExpenseDto) {
    return this.api.createRecurringExpense(dto).pipe(
      tap(() => {
        this.refresh();
      })
    );
  }

  update(id: number, dto: UpdateRecurringExpenseDto) {
    return this.api.updateRecurringExpense(id, dto).pipe(
      tap(() => {
        this.refresh();
      })
    );
  }

  delete(id: number) {
    const prev = this._recurringExpenses();
    // Optimistic update
    this._recurringExpenses.update((list) => list.filter((i) => i.id !== id));

    return this.api.deleteRecurringExpense(id).pipe(
      tap({
        error: () => this._recurringExpenses.set(prev),
        next: () => {
          this.refresh();
        },
      })
    );
  }
}
