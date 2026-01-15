import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CacheService } from './cache.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { IncomeResponse, CreateIncome, UpdateIncome } from '../models/api.models';
import { Subject, combineLatest, of, forkJoin } from 'rxjs';
import { tap, finalize, switchMap, startWith, catchError, shareReplay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IncomeStateService {
  private api = inject(ApiService);
  private cache = inject(CacheService);

  // State Signals (Params)
  currentPage = signal(0);
  pageSize = signal(6);

  // Triggers
  private refresh$ = new Subject<void>();

  // Loading State
  private _isLoading = signal<boolean>(false);

  // Data Source (Robust Fetch ALL - ForkJoin)
  private resource$ = combineLatest([this.refresh$]).pipe(
    tap(() => {
      if (!this._localData()) {
        this._isLoading.set(true);
      }
    }),
    switchMap(() => {
      const key = `incomes_all_forkjoin_v1`;
      const cached = this.cache.get(key);
      if (cached) {
        return of(cached).pipe(finalize(() => this._isLoading.set(false)));
      }

      // Initial fetch to get metadata
      return this.api.getIncomes(0, 100).pipe(
        switchMap((firstPage) => {
          const totalPages = firstPage.page.totalPages;
          if (totalPages <= 1) {
            return of({ content: firstPage.content, page: firstPage.page });
          }

          // Generate requests for remaining pages
          const requests = [];
          for (let i = 1; i < totalPages; i++) {
            requests.push(this.api.getIncomes(i, 100));
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
                  totalPages: Math.ceil(allContent.length / 100),
                },
              };
            })
          );
        }),
        tap((data) => {
          console.log('[IncomeService] Loaded all items:', data.content.length);
          this.cache.set(key, data);
        }),
        catchError((err) => {
          console.error('Failed to load incomes', err);
          return of({ content: [], page: { totalElements: 0, totalPages: 0 } });
        }),
        finalize(() => this._isLoading.set(false))
      );
    }),
    shareReplay(1)
  );

  // Preload Strategy
  preload() {
    if (this._localData()) return;

    this.api.getIncomes(0, 6).subscribe({
      next: (res) => {
        this._localData.set(res);
      },
    });
  }

  // Writable Local State for Optimistic UI
  private _localData = signal<{ content: IncomeResponse[]; page: any } | null>(null);

  // Read-only server state
  private serverState = toSignal(this.resource$, { initialValue: null });
  // private resourceState = ... removed

  // Public Read-only Signals (Client-Side Slicing)
  incomes = computed(() => {
    const all = this._localData()?.content || [];
    const p = this.currentPage();
    const s = this.pageSize();
    return all.slice(p * s, (p + 1) * s);
  });

  totalElements = computed(() => this._localData()?.content?.length || 0);

  totalPages = computed(() => {
    const total = this.totalElements();
    const size = this.pageSize();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  isLoading = this._isLoading.asReadonly();
  loaded = computed(() => !!this._localData());

  constructor() {
    // Sync Server Data
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

    this.currentPage.set(page);
    this.pageSize.set(size);
    if (force) this.refresh();
  }

  refresh() {
    this.refresh$.next();
  }

  add(dto: CreateIncome) {
    // 1. Optimistic Update (Prepend)
    const tempId = -Date.now();
    const current = this._localData();
    let tempItem: IncomeResponse | null = null;

    if (current) {
      tempItem = {
        id: tempId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date).toLocaleDateString(),
        currency: dto.currency,
        fixedSalary: dto.fixedSalary || false,
      } as IncomeResponse;

      this._localData.set({
        ...current,
        content: [tempItem, ...current.content],
        page: { ...current.page, totalElements: (current.page.totalElements || 0) + 1 },
      });
    }

    return this.api.createIncome(dto).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
        this.refresh();
      }),
      catchError((err) => {
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

  update(id: number, dto: UpdateIncome) {
    // 1. Optimistic Update
    const current = this._localData();
    if (current) {
      const index = current.content.findIndex((e) => e.id === id);
      if (index !== -1) {
        const item = current.content[index];
        const updatedItem = {
          ...item,
          ...dto,
          // Incomes usually strictly numeric/string, assuming no category object complex update needed for now
          // If Incomes have category object, we might need similar handling as Expenses
          date: new Date(dto.date).toISOString().split('T')[0],
        } as IncomeResponse;

        const newContent = [...current.content];
        newContent[index] = updatedItem;

        this._localData.set({
          ...current,
          content: newContent,
        });
      }
    }

    // 2. API Call
    return this.api.updateIncome(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
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
    return this.api.deleteIncome(id).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
        this.refresh(); // Bg refresh
      }),
      catchError((err) => {
        if (current) this._localData.set(current);
        throw err;
      })
    );
  }
}
