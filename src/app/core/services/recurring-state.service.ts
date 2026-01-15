import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Category } from '../models/api.models'; // Import Category
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

  // Writable Local State for Optimistic UI
  private _localData = signal<{ content: RecurringExpense[]; page: any } | null>(null);

  // Data Source
  private resource$ = combineLatest([
    toObservable(this.currentPage),
    toObservable(this.pageSize),
    this.refresh$.pipe(startWith(undefined)),
  ]).pipe(
    tap(() => {
      // Hide loading if we have local data to prevent flash
      if (!this._localData()) {
        this._isLoading.set(true);
      }
      this.error.set(null);
    }),
    switchMap(([page, size]) =>
      this.api.getRecurringExpenses(page, size).pipe(
        catchError((err) => {
          this.error.set(err);
          return of({ content: [], page: { totalElements: 0, totalPages: 0 } });
        }),
        finalize(() => this._isLoading.set(false))
      )
    ),
    shareReplay(1)
  );

  // Read-only server state
  private serverState = toSignal(this.resource$, { initialValue: null });
  // private resourceState removed

  // State Signals
  private resourceState = toSignal(this.resource$, { initialValue: null });

  // Public Signals
  recurringExpenses = computed(() => this._localData()?.content || []);

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

  constructor() {
    // Sync Server Data
    effect(() => {
      const data = this.serverState();
      if (data) {
        this._localData.set(data);
      }
    });
  }

  refresh() {
    this.refresh$.next();
  }

  // Mutations
  add(dto: CreateRecurringExpenseDto, optimisticCategory?: Category) {
    // Optimistic Update
    const tempId = -Date.now();
    const current = this._localData();
    let tempItem: RecurringExpense | null = null;

    if (current) {
      tempItem = {
        id: tempId,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency || 'DOP',
        category: optimisticCategory || {
          id: dto.categoryId,
          name: 'Loading...',
          icons: 'hourglass_empty',
          color: 'gray',
        },
        frequency: dto.frequency,
        occurrencesCreated: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        nextExecutionDate: dto.startDate || new Date().toISOString(),
      } as RecurringExpense;

      this._localData.set({
        ...current,
        content: [tempItem, ...current.content],
        page: { ...current.page, totalElements: (current.page?.totalElements || 0) + 1 },
      });
    }

    return firstValueFrom(
      this.api.createRecurringExpense(dto).pipe(
        tap(() => this.refresh()),
        catchError((err) => {
          const nowCurrent = this._localData();
          if (nowCurrent && tempItem) {
            this._localData.set({
              ...nowCurrent,
              content: nowCurrent.content.filter((x) => x.id !== tempId),
              page: {
                ...nowCurrent.page,
                totalElements: (nowCurrent.page?.totalElements || 1) - 1,
              },
            });
          }
          throw err;
        })
      )
    );
  }

  update(id: number, dto: UpdateRecurringExpenseDto) {
    // Optimistic Update
    const current = this._localData();
    if (current) {
      const index = current.content.findIndex((x) => x.id === id);
      if (index !== -1) {
        const item = current.content[index];
        const updated = { ...item, ...dto };
        const newContent = [...current.content];
        newContent[index] = updated;
        this._localData.set({ ...current, content: newContent });
      }
    }

    return firstValueFrom(
      this.api.updateRecurringExpense(id, dto).pipe(
        tap(() => this.refresh()),
        catchError((err) => {
          if (current) this._localData.set(current);
          throw err;
        })
      )
    );
  }

  delete(id: number) {
    // Optimistic Update
    const current = this._localData();
    if (current) {
      this._localData.set({
        ...current,
        content: current.content.filter((x) => x.id !== id),
        page: { ...current.page, totalElements: (current.page?.totalElements || 1) - 1 },
      });
    }

    return firstValueFrom(
      this.api.deleteRecurringExpense(id).pipe(
        tap(() => this.refresh()),
        catchError((err) => {
          if (current) this._localData.set(current);
          throw err;
        })
      )
    );
  }

  // Pagination Actions
  setPage(page: number) {
    this.currentPage.set(page);
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
  }
}
