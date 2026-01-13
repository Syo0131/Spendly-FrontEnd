import { Injectable, inject, signal, computed } from '@angular/core';
import { CacheService } from './cache.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { ExpenseResponse, CreateExpense, UpdateExpense } from '../models/api.models';
import { firstValueFrom, Subject, combineLatest, of, Observable, EMPTY, forkJoin } from 'rxjs';
import { tap, finalize, switchMap, startWith, catchError, shareReplay, map } from 'rxjs/operators';
import { BudgetStateService } from './budget-state.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseStateService {
  private api = inject(ApiService);
  private budgetState = inject(BudgetStateService);
  private cache = inject(CacheService);

  // State Signals (Params)
  currentPage = signal(0);
  pageSize = signal(6);

  // Triggers
  private refresh$ = new Subject<void>();

  // Loading State
  private _isLoading = signal<boolean>(false);

  // Data Source (Robust Fetch ALL - ForkJoin)
  private resource$ = combineLatest([this.refresh$.pipe(startWith(undefined))]).pipe(
    tap(() => this._isLoading.set(true)),
    switchMap(() => {
      const key = `expenses_all_forkjoin_v1`;
      const cached = this.cache.get(key);
      if (cached) {
        return of(cached).pipe(finalize(() => this._isLoading.set(false)));
      }

      // Initial fetch to get metadata
      return this.api.getExpenses(0, 100).pipe(
        switchMap((firstPage) => {
          const totalPages = firstPage.page.totalPages;
          if (totalPages <= 1) {
            return of({ content: firstPage.content, page: firstPage.page });
          }

          // Generate requests for remaining pages
          const requests = [];
          for (let i = 1; i < totalPages; i++) {
            requests.push(this.api.getExpenses(i, 100));
          }

          return forkJoin(requests).pipe(
            map((responses) => {
              // Combine first page with rest
              const allContent = firstPage.content.concat(...responses.map((r) => r.content));
              return {
                content: allContent,
                page: {
                  ...firstPage.page,
                  totalElements: allContent.length,
                  totalPages: Math.ceil(allContent.length / 100), // Approximate
                },
              };
            })
          );
        }),
        tap((data) => {
          console.log('[ExpenseService] Loaded all items:', data.content.length);
          this.cache.set(key, data);
        }),
        catchError((err) => {
          console.error('Failed to load expenses', err);
          return of({ content: [], page: { totalElements: 0, totalPages: 0 } });
        }),
        finalize(() => this._isLoading.set(false))
      );
    }),
    shareReplay(1)
  );

  private resourceState = toSignal(this.resource$, { initialValue: null });

  // Filters
  categoryFilter = signal<number | null>(null);

  // Public Read-only Signals
  private filteredContent = computed(() => {
    const all = this.resourceState()?.content || [];
    const catId = this.categoryFilter();
    if (catId) {
      return all.filter((e: ExpenseResponse) => e.category?.id === catId);
    }
    return all;
  });

  expenses = computed(() => {
    const all = this.filteredContent();
    const p = this.currentPage();
    const s = this.pageSize();
    // Slice the filtered items
    return all.slice(p * s, (p + 1) * s);
  });

  totalElements = computed(() => this.filteredContent().length);

  totalPages = computed(() => {
    const total = this.totalElements();
    const size = this.pageSize();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  isLoading = this._isLoading.asReadonly();
  loaded = computed(() => !!this.resourceState());

  setFilter(categoryId: number | null) {
    this.categoryFilter.set(categoryId);
    this.currentPage.set(0); // Reset to first page on filter change
  }

  constructor() {}

  // Actions
  load(page = 0, size = 6, force = false) {
    const isSame = page === this.currentPage() && size === this.pageSize();
    if (isSame && !force) return;

    // Setting signals triggers UI update (pagination), NOT network fetch
    this.currentPage.set(page);
    this.pageSize.set(size);

    if (force) {
      this.refresh();
    }
  }

  refresh() {
    this.refresh$.next();
  }

  add(dto: CreateExpense) {
    return this.api.createExpense(dto).pipe(
      tap(() => {
        this.cache.invalidate('expenses');
        this.refresh();
        this.budgetState.refresh();
      })
    );
  }

  update(id: number, dto: UpdateExpense) {
    return this.api.updateExpense(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('expenses');
        this.refresh();
        this.budgetState.refresh();
      })
    );
  }

  delete(id: number) {
    return this.api.deleteExpense(id).pipe(
      tap(() => {
        this.cache.invalidate('expenses');
        this.refresh();
        this.budgetState.refresh();
      })
    );
  }
}
