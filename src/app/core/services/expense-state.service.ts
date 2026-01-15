import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CacheService } from './cache.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { ExpenseResponse, CreateExpense, UpdateExpense, Category } from '../models/api.models';
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
  // Filters (Moved up to fix "used before initialization")
  categoryFilter = signal<number | null>(null);

  // Triggers
  private refresh$ = new Subject<void>();

  // Loading State
  private _isLoading = signal<boolean>(false);

  // Writable Local State for Optimistic UI (Moved up for access in resource$)
  private _localData = signal<{ content: ExpenseResponse[]; page: any } | null>(null);

  // Data Source (Robust Fetch ALL - ForkJoin)
  private resource$ = combineLatest([
    this.refresh$, // Removed startWith to prevent auto-load
    toObservable(this.categoryFilter),
  ]).pipe(
    tap(() => {
      // Only show global loading if we have no data yet.
      // This prevents "flashing" opacity during optimistic updates/background refreshes.
      if (!this._localData()) {
        this._isLoading.set(true);
      }
    }),
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

  // Read-only server state (via toSignal) to keep sync
  private serverState = toSignal(this.resource$, { initialValue: null });

  // Preload Strategy: Load only first page (6 items) immediately
  preload() {
    if (this._localData()) return; // Already data

    this.api.getExpenses(0, 6).subscribe({
      next: (res) => {
        this._localData.set(res);
        // Optionally cache this small chunk to prevent re-fetch if quick navigation
      },
    });
  }

  // Sync Server State -> Local State
  private syncEffect = computed(() => {
    const serverData = this.serverState();
    if (serverData) {
      // Use untracked to avoid loops if needed, though computed is fine here
      // as we are just setting a signal.
      // Note: We cannot set signals inside computed directly without allowSignalWrites.
      // Better to use effect() in constructor.
    }
  });

  // Filters
  // categoryFilter moved to top

  // Public Read-only Signals
  private filteredContent = computed(() => {
    const all = this._localData()?.content || [];
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
  loaded = computed(() => !!this._localData());

  setFilter(categoryId: number | null) {
    this.categoryFilter.set(categoryId);
    this.currentPage.set(0); // Reset to first page on filter change
  }

  constructor() {
    // Sync Server Data to Local Data
    effect(() => {
      const data = this.serverState();
      if (data) {
        this._localData.set(data);
      }
    });
  }

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
  add(dto: CreateExpense, optimisticCategory?: Category) {
    // 1. Optimistic Update (Prepend)
    const tempId = -Date.now(); // Negative ID for temp items
    const current = this._localData();
    let tempItem: ExpenseResponse | null = null;

    if (current) {
      tempItem = {
        id: tempId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date).toLocaleDateString(), // Approx format for UI
        currency: dto.currency,
        category: optimisticCategory || {
          id: dto.categoryId,
          name: 'Loading...',
          icons: 'hourglass_empty',
          color: 'gray',
        }, // Fallback
        userId: 0, // Dummy
      } as ExpenseResponse;

      this._localData.set({
        ...current,
        content: [tempItem, ...current.content],
        page: { ...current.page, totalElements: (current.page.totalElements || 0) + 1 },
      });
    }

    return this.api.createExpense(dto).pipe(
      tap(() => {
        // Success: The temp item is already visible.
        // Since API only returns a Message, we cannot update the ID immediately.
        // We rely on the refresh() below to fetch the real data and overwrite our local state.

        this.cache.invalidate('expenses');
        this.budgetState.refresh();
        // Background refresh which will replace the temp item with the real server item
        this.refresh();
      }),
      catchError((err) => {
        // Revert on error
        const nowCurrent = this._localData();
        if (nowCurrent && tempItem) {
          this._localData.set({
            ...nowCurrent,
            content: nowCurrent.content.filter((x) => x.id !== tempId),
            page: { ...nowCurrent.page, totalElements: (nowCurrent.page.totalElements || 1) - 1 },
          });
        }
        throw err;
      })
    );
  }

  update(id: number, dto: UpdateExpense, optimisticCategory?: Category) {
    // 1. Optimistic Update
    const current = this._localData();
    if (current) {
      const index = current.content.findIndex((e) => e.id === id);
      if (index !== -1) {
        const item = current.content[index];
        const updatedItem = {
          ...item,
          ...dto,
          // Use provided category or keep existing
          category:
            optimisticCategory ||
            (dto.categoryId === item.category.id ? item.category : item.category), // Best effort
          date: new Date(dto.date).toISOString().split('T')[0],
        } as ExpenseResponse;

        const newContent = [...current.content];
        newContent[index] = updatedItem;

        this._localData.set({
          ...current,
          content: newContent,
        });
      }
    }

    // 2. API Call
    return this.api.updateExpense(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('expenses');
        this.budgetState.refresh();
        this.refresh();
      }),
      catchError((err) => {
        if (current) this._localData.set(current);
        throw err;
      })
    );
  }

  delete(id: number) {
    // 1. Optimistic Update
    const current = this._localData();
    if (current) {
      this._localData.set({
        ...current,
        content: current.content.filter((e) => e.id !== id),
        page: { ...current.page, totalElements: (current.page.totalElements || 1) - 1 },
      });
    }

    // 2. API Call
    return this.api.deleteExpense(id).pipe(
      tap(() => {
        this.cache.invalidate('expenses');
        this.budgetState.refresh();
        // Background refresh to ensure consistency
        this.refresh();
      }),
      catchError((err) => {
        // Revert on error
        if (current) this._localData.set(current);
        throw err;
      })
    );
  }
}
