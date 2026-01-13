import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import {
  RecurringExpense,
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
  PagedModelRecurringExpenseResponse,
} from '../models/api.models';
import { firstValueFrom, Subject, combineLatest, of } from 'rxjs';
import { switchMap, tap, finalize, startWith, map, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RecurringStateService {
  private api = inject(ApiService);

  // Pagination Signals
  currentPage = signal(0);
  pageSize = signal(10);

  // Triggers
  private refresh$ = new Subject<void>();

  // Loading State (Managed manually since we use observables)
  private _isLoading = signal(false);
  isLoading = this._isLoading.asReadonly();

  error = signal<any>(null);

  // Data Source
  private resource$ = combineLatest([
    toObservable(this.currentPage),
    toObservable(this.pageSize),
    this.refresh$.pipe(startWith(undefined)),
  ]).pipe(
    tap(() => {
      this._isLoading.set(true);
      this.error.set(null);
    }),
    switchMap(([page, size]) =>
      this.api.getRecurringExpenses(page, size).pipe(
        catchError((err) => {
          this.error.set(err);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false))
      )
    ),
    shareReplay(1)
  );

  // State Signals
  private resourceState = toSignal(this.resource$, { initialValue: null });

  // Public Signals
  recurringExpenses = computed(() => this.resourceState()?.content || []);

  totalElements = computed(() => {
    const res = this.resourceState();
    if (!res) return 0;
    return res.page?.totalElements ?? (res as any).totalElements ?? 0;
  });

  totalPages = computed(() => {
    const res = this.resourceState();
    if (!res) return 0;
    return res.page?.totalPages ?? (res as any).totalPages ?? 0;
  });

  constructor() {}

  refresh() {
    this.refresh$.next();
  }

  // Mutations
  async add(dto: CreateRecurringExpenseDto) {
    try {
      await firstValueFrom(this.api.createRecurringExpense(dto));
      this.refresh();
      return true;
    } catch (err) {
      throw err;
    }
  }

  async update(id: number, dto: UpdateRecurringExpenseDto) {
    try {
      await firstValueFrom(this.api.updateRecurringExpense(id, dto));
      this.refresh();
      return true;
    } catch (err) {
      throw err;
    }
  }

  async delete(id: number) {
    try {
      await firstValueFrom(this.api.deleteRecurringExpense(id));
      this.refresh();
      return true;
    } catch (err) {
      this.refresh();
      throw err;
    }
  }

  // Pagination Actions
  setPage(page: number) {
    this.currentPage.set(page);
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
  }
}
