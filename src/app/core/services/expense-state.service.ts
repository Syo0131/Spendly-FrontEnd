import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CacheService } from './cache.service';
import { ApiService } from './api.service';
import { ExpenseResponse, CreateExpense, UpdateExpense, Category } from '../models/api.models';
import { Observable, Subject, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { BudgetStateService } from './budget-state.service';

/**
 * How the current view is fetched. The backend list endpoint has no filters, so:
 * - no filters: server-side paging, one request per page;
 * - month filter: one request for that month, category filtered and paged locally;
 * - category filter over all time: full history download (only case that needs it).
 */
export type ExpenseQuery =
  | { mode: 'page'; page: number; size: number }
  | { mode: 'month'; year: number; month: number }
  | { mode: 'all' };

export function planExpenseQuery(
  categoryId: number | null,
  date: { month: number; year: number } | null,
  page: number,
  size: number,
): ExpenseQuery {
  if (date) return { mode: 'month', year: date.year, month: date.month };
  if (categoryId) return { mode: 'all' };
  return { mode: 'page', page, size };
}

const sameQuery = (a: ExpenseQuery, b: ExpenseQuery) => JSON.stringify(a) === JSON.stringify(b);

interface ExpenseView {
  /** Server page items (mode 'page') or every candidate item (local paging). */
  items: ExpenseResponse[];
  /** Server total for mode 'page'; ignored when paging locally. */
  total: number;
  localPaging: boolean;
}

const FULL_HISTORY_PAGE_SIZE = 100;
const FULL_HISTORY_CACHE_KEY = 'expenses_all_forkjoin_v1';

@Injectable({
  providedIn: 'root',
})
export class ExpenseStateService {
  private api = inject(ApiService);
  private budgetState = inject(BudgetStateService);
  private cache = inject(CacheService);

  // Params
  currentPage = signal(0);
  pageSize = signal(6);
  categoryFilter = signal<number | null>(null);
  dateFilter = signal<{ month: number; year: number } | null>(null);

  private query = computed(() =>
    planExpenseQuery(this.categoryFilter(), this.dateFilter(), this.currentPage(), this.pageSize()),
  );

  private refresh$ = new Subject<void>();
  private _isLoading = signal(false);
  private _view = signal<ExpenseView | null>(null);

  constructor() {
    // Nothing is fetched until the first refresh(); afterwards every query change or refresh
    // fetches only what the current view needs.
    combineLatest([toObservable(this.query).pipe(distinctUntilChanged(sameQuery)), this.refresh$])
      .pipe(
        tap(() => {
          // Only show global loading when there is nothing to show yet.
          if (!this._view()) this._isLoading.set(true);
        }),
        switchMap(([query]) =>
          this.fetch(query).pipe(
            catchError((err) => {
              console.error('Failed to load expenses', err);
              return of<ExpenseView>({ items: [], total: 0, localPaging: query.mode !== 'page' });
            }),
            finalize(() => this._isLoading.set(false)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((view) => this._view.set(view));
  }

  private fetch(query: ExpenseQuery): Observable<ExpenseView> {
    switch (query.mode) {
      case 'page':
        return this.api.getExpenses(query.page, query.size).pipe(
          map((res) => ({
            items: res.content || [],
            total: res.page?.totalElements ?? (res.content || []).length,
            localPaging: false,
          })),
        );
      case 'month':
        return this.api
          .getExpensesForMonth(query.year, query.month)
          .pipe(map((items) => ({ items: items || [], total: 0, localPaging: true })));
      case 'all':
        return this.fetchFullHistory().pipe(
          map((items) => ({ items, total: 0, localPaging: true })),
        );
    }
  }

  private fetchFullHistory(): Observable<ExpenseResponse[]> {
    const cached = this.cache.get(FULL_HISTORY_CACHE_KEY) as ExpenseResponse[] | null;
    if (cached) return of(cached);

    return this.api.getExpenses(0, FULL_HISTORY_PAGE_SIZE).pipe(
      switchMap((first) => {
        const totalPages = first.page?.totalPages ?? 1;
        if (totalPages <= 1) return of(first.content || []);
        const rest = [];
        for (let i = 1; i < totalPages; i++) {
          rest.push(this.api.getExpenses(i, FULL_HISTORY_PAGE_SIZE));
        }
        return forkJoin(rest).pipe(
          map((pages) => (first.content || []).concat(...pages.map((p) => p.content || []))),
        );
      }),
      tap((items) => this.cache.set(FULL_HISTORY_CACHE_KEY, items)),
    );
  }

  // Public read-only signals
  private matching = computed(() => {
    const view = this._view();
    if (!view) return [];
    if (!view.localPaging) return view.items;
    const catId = this.categoryFilter();
    return catId ? view.items.filter((e) => e.category?.id === catId) : view.items;
  });

  expenses = computed(() => {
    const view = this._view();
    const items = this.matching();
    if (!view?.localPaging) return items;
    const p = this.currentPage();
    const s = this.pageSize();
    return items.slice(p * s, (p + 1) * s);
  });

  totalElements = computed(() => {
    const view = this._view();
    if (!view) return 0;
    return view.localPaging ? this.matching().length : view.total;
  });

  totalPages = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.ceil(this.totalElements() / size) : 0;
  });

  isLoading = this._isLoading.asReadonly();
  loaded = computed(() => !!this._view());

  /** Warms the first page at app start; the default view is server-paged so it is one request. */
  preload() {
    if (this._view()) return;
    this.refresh();
  }

  setFilter(categoryId: number | null) {
    this.categoryFilter.set(categoryId);
    this.currentPage.set(0);
  }

  setDateFilter(month: number | null, year: number | null) {
    this.dateFilter.set(month === null || year === null ? null : { month, year });
    this.currentPage.set(0);
  }

  load(page = 0, size = 6, force = false) {
    const isSame = page === this.currentPage() && size === this.pageSize();
    if (isSame && !force) return;

    // In 'page' mode this changes the query and fetches that page; otherwise it only re-slices.
    this.currentPage.set(page);
    this.pageSize.set(size);

    if (force) this.refresh();
  }

  refresh() {
    this.refresh$.next();
  }

  /** Applies an optimistic change to the current view; `totalDelta` adjusts the server total. */
  private patchView(fn: (items: ExpenseResponse[]) => ExpenseResponse[], totalDelta = 0) {
    const view = this._view();
    if (!view) return;
    this._view.set({ ...view, items: fn(view.items), total: Math.max(0, view.total + totalDelta) });
  }

  private afterMutation() {
    this.cache.invalidate('expenses');
    this.budgetState.refresh();
    // Background refresh replaces optimistic items with server data (current view only).
    this.refresh();
  }

  add(dto: CreateExpense, optimisticCategory?: Category) {
    const tempId = -Date.now(); // Negative ID for temp items
    const tempItem = {
      id: tempId,
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date).toISOString().split('T')[0],
      currency: dto.currency,
      category: optimisticCategory || {
        id: dto.categoryId,
        name: 'Loading...',
        icons: 'hourglass_empty',
        color: 'gray',
      },
      userId: 0,
    } as ExpenseResponse;

    this.patchView((items) => [tempItem, ...items], 1);

    return this.api.createExpense(dto).pipe(
      tap(() => this.afterMutation()),
      catchError((err) => {
        this.patchView((items) => items.filter((x) => x.id !== tempId), -1);
        throw err;
      }),
    );
  }

  update(id: number, dto: UpdateExpense, optimisticCategory?: Category) {
    const before = this._view();
    this.patchView((items) =>
      items.map((item) =>
        item.id === id
          ? ({
              ...item,
              ...dto,
              category: optimisticCategory || item.category,
              date: new Date(dto.date).toISOString().split('T')[0],
            } as ExpenseResponse)
          : item,
      ),
    );

    return this.api.updateExpense(id, dto).pipe(
      tap(() => this.afterMutation()),
      catchError((err) => {
        if (before) this._view.set(before);
        throw err;
      }),
    );
  }

  delete(id: number) {
    const before = this._view();
    this.patchView((items) => items.filter((e) => e.id !== id), -1);

    return this.api.deleteExpense(id).pipe(
      tap(() => this.afterMutation()),
      catchError((err) => {
        if (before) this._view.set(before);
        throw err;
      }),
    );
  }
}
