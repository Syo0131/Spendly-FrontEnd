import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { IncomeResponse, CreateIncome, UpdateIncome } from '../models/api.models';
import { tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IncomeStateService {
  private api = inject(ApiService);

  // State Signals
  private _incomes = signal<IncomeResponse[]>([]);
  private _totalElements = signal<number>(0);
  private _totalPages = signal<number>(0);
  private _currentPage = signal<number>(0);
  private _pageSize = signal<number>(20);

  private _isLoading = signal<boolean>(false);
  private _loaded = signal<boolean>(false); // If we have loaded at least once

  // Public Read-only Signals
  incomes = this._incomes.asReadonly();
  totalElements = this._totalElements.asReadonly();
  totalPages = this._totalPages.asReadonly();
  currentPage = this._currentPage.asReadonly();
  pageSize = this._pageSize.asReadonly();
  isLoading = this._isLoading.asReadonly();
  loaded = this._loaded.asReadonly();

  constructor() {}

  // Actions
  load(page = 0, size = 20, force = false) {
    // If already loaded same page and not force, skip
    if (this._loaded() && this._currentPage() === page && this._pageSize() === size && !force)
      return;

    this._isLoading.set(true);
    this.api
      .getIncomes(page, size)
      .pipe(
        tap((res) => {
          this._incomes.set(res.content);
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
    // Refresh current page
    this.load(this._currentPage(), this._pageSize(), true);
  }

  add(dto: CreateIncome) {
    return this.api.createIncome(dto).pipe(tap(() => this.refresh()));
  }

  update(id: number, dto: UpdateIncome) {
    return this.api.updateIncome(id, dto).pipe(tap(() => this.refresh()));
  }

  delete(id: number) {
    // Optimistic delete could be complex with pagination (might leave empty page).
    // For now, simpler to refresh. A true optimistic approach would update _incomes array.

    // Low-risk optimistic update: remove from current view
    const prev = this._incomes();
    this._incomes.update((list) => list.filter((i) => i.id !== id));

    return this.api.deleteIncome(id).pipe(
      tap({
        error: () => {
          this._incomes.set(prev); // Revert
        },
        next: () => {
          this.refresh(); // Sync properly to get new page data if needed
        },
      })
    );
  }
}
