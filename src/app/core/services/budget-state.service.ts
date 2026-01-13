import { Injectable, inject, signal, computed } from '@angular/core';
import { CacheService } from './cache.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { Budget, CreateBudgetDto } from '../models/api.models';
import { firstValueFrom, Subject, combineLatest, of } from 'rxjs';
import { switchMap, tap, finalize, startWith, catchError, shareReplay } from 'rxjs/operators';

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
  private resource$ = combineLatest([this.refresh$.pipe(startWith(undefined))]).pipe(
    tap(() => this._isLoading.set(true)),
    switchMap(() => {
      const key = 'budgets_all';
      const cached = this.cache.get(key);
      if (cached) {
        return of(cached).pipe(finalize(() => this._isLoading.set(false)));
      }

      return this.api.getBudgets(0, 300).pipe(
        tap((data) => this.cache.set(key, data)),
        catchError((err) => {
          console.error('Failed to load budgets', err);
          return of({ content: [] as Budget[] });
        }),
        finalize(() => this._isLoading.set(false))
      );
    }),
    shareReplay(1)
  );

  private resourceState = toSignal(this.resource$, { initialValue: null });

  // Helper to maintain compatibility
  private _budgets = computed(() => this.resourceState()?.content || []);

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
  loaded = computed(() => !!this.resourceState());

  // Computed: Filter budgets by current date
  filteredBudgets = computed(() => {
    const all = this._budgets();
    const date = this._currentDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return all.filter(
      (b: Budget) => (b.month === month && b.year === year) || (!b.month && !b.year)
    );
  });

  constructor() {}

  // Actions
  setDate(date: Date) {
    this._currentDate.set(new Date(date));
  }

  load(force = false) {
    if (force) {
      this.refresh();
    }
  }

  refresh() {
    this.refresh$.next();
  }

  addBudget(dto: CreateBudgetDto) {
    return this.api.createBudget(dto).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      })
    );
  }

  updateBudget(id: number, dto: any) {
    return this.api.updateBudget(id, dto).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      })
    );
  }

  removeBudget(id: number) {
    return this.api.deleteBudget(id).pipe(
      tap(() => {
        this.cache.invalidate('budgets');
        this.refresh();
      })
    );
  }
}
