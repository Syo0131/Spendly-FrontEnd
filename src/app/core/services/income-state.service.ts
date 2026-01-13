import { Injectable, inject, signal, computed } from '@angular/core';
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
  private resource$ = combineLatest([this.refresh$.pipe(startWith(undefined))]).pipe(
    tap(() => this._isLoading.set(true)),
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

  private resourceState = toSignal(this.resource$, { initialValue: null });

  // Public Read-only Signals (Client-Side Slicing)
  incomes = computed(() => {
    const all = this.resourceState()?.content || [];
    const p = this.currentPage();
    const s = this.pageSize();
    return all.slice(p * s, (p + 1) * s);
  });

  totalElements = computed(() => this.resourceState()?.content?.length || 0);

  totalPages = computed(() => {
    const total = this.totalElements();
    const size = this.pageSize();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  isLoading = this._isLoading.asReadonly();
  loaded = computed(() => !!this.resourceState());

  constructor() {}

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
    return this.api.createIncome(dto).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
        this.refresh();
      })
    );
  }

  update(id: number, dto: UpdateIncome) {
    return this.api.updateIncome(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
        this.refresh();
      })
    );
  }

  delete(id: number) {
    return this.api.deleteIncome(id).pipe(
      tap(() => {
        this.cache.invalidate('incomes');
        this.refresh();
      })
    );
  }
}
