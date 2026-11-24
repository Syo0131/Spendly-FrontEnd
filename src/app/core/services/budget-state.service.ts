import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { CacheService } from './cache.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { Budget, CreateBudgetDto } from '../models/api.models';
import { firstValueFrom, Subject, combineLatest, of, forkJoin } from 'rxjs';
import { switchMap, tap, finalize, startWith, catchError, shareReplay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BudgetStateService {
  private api = inject(ApiService);
  private cache = inject(CacheService);

  // State Signals
  private _isLoading = signal<boolean>(false);
  private _currentDate = signal<Date>(new Date());

  // Triggers
  private refresh$ = new Subject<void>();

  // Data Source
  private resource$ = combineLatest([
    this.refresh$.pipe(startWith(undefined)),
    toObservable(this._currentDate),
  ]).pipe(
    tap(() => {
      this._isLoading.set(true);
    }),
    switchMap(([_, date]) => {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `budgets_${year}_${month}`;

      const cached = this.cache.get(key);
      if (cached) {
        return of({ content: cached }).pipe(finalize(() => this._isLoading.set(false)));
      }

      return this.api.getMonthlyBudgets(year, month).pipe(
        tap((data) => this.cache.set(key, data)),
        // Map array to object structure for consistency with _localData type
        switchMap((data) => of({ content: data })),
        catchError((err) => {
          console.error('Failed to load budgets', err);
          return of({ content: [] as Budget[] });
        }),
        finalize(() => this._isLoading.set(false)),
      );
    }),
    shareReplay(1),
  );

  // Writable Local State for Optimistic UI
  private _localData = signal<{ content: Budget[] } | null>(null);

  // Read-only server state
  private serverState = toSignal(this.resource$, { initialValue: null });

  // Helper to maintain compatibility
  private _budgets = computed(() => this._localData()?.content || []);

  // Session-scoped notification tracking
  private notifiedBudgetIds = new Set<number>();

  hasNotified(id: number): boolean {
    return this.notifiedBudgetIds.has(id);
  }

  markNotified(id: number) {
    this.notifiedBudgetIds.add(id);
  }

  // Public Read-only Signals
  budgets = this._budgets;
  isLoading = this._isLoading.asReadonly();
  currentDate = this._currentDate.asReadonly();
  loaded = computed(() => !!this._localData());

  // Computed: Filter budgets by current date (Now redundant but kept for interface compatibility)
  filteredBudgets = computed(() => {
    return this._budgets();
  });

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
  setDate(date: Date) {
    this._currentDate.set(new Date(date));
  }

  load(force = false) {
    this.refresh();
  }

  refresh() {
    this.refresh$.next();
  }

  addBudget(dto: CreateBudgetDto) {
    // 1. Optimistic Update (Prepend)
    const tempId = -Date.now();
    const current = this._localData();
    let tempItem: Budget | null = null;

    // We cannot easily guess the category object here without an argument or lookup,
    // but Budgets are less frequent. We'll try to just show it if possible,
    // or just rely on the super-fast refresh.
    // Actually, for Budgets, the list is small.
    // But for consistency:
    if (current) {
      tempItem = {
        id: tempId,
        limit: dto.limit,
        spent: 0,
        percentage: 0,
        period: dto.period,
        categoryId: dto.categoryId,
        category: {
          id: dto.categoryId,
          name: 'Loading...',
          icons: 'hourglass_empty',
          color: 'gray',
        }, // Placeholder
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      } as Budget;

      this._localData.set({
        ...current,
        content: [tempItem, ...current.content],
      });
    }

    return this.api.createBudget(dto).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      }),
      catchError((err) => {
        const nowCurrent = this._localData();
        if (nowCurrent && tempItem) {
          this._localData.set({
            ...nowCurrent,
            content: nowCurrent.content.filter((x) => x.id !== tempId),
          });
        }
        throw err;
      }),
    );
  }

  updateBudget(id: number, dto: any, optimisticCategory?: any) {
    // 1. Optimistic Update
    const current = this._localData();
    if (current) {
      const index = current.content.findIndex((b) => b.id === id);
      if (index !== -1) {
        const item = current.content[index];
        const updatedItem = {
          ...item,
          ...dto,
          // Best effort category update
          category:
            optimisticCategory ||
            (dto.categoryId === item.category?.id ? item.category : item.category),
          limit: dto.limit || item.limit, // Ensure limit updates
          spent: item.spent, // Keep spent same on update usually
        } as Budget;

        const newContent = [...current.content];
        newContent[index] = updatedItem;

        this._localData.set({
          ...current,
          content: newContent,
        });
      }
    }

    // 2. API Call
    return this.api.updateBudget(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      }),
      catchError((err) => {
        if (current) this._localData.set(current);
        throw err;
      }),
    );
  }

  removeBudget(id: number) {
    // 1. Optimistic Update
    const current = this._localData();
    if (current) {
      this._localData.set({
        ...current,
        content: current.content.filter((b) => b.id !== id),
      });
    }

    // 2. API Call
    return this.api.deleteBudget(id).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      }),
      catchError((err) => {
        if (current) this._localData.set(current);
        throw err;
      }),
    );
  }
}
