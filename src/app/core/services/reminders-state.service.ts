import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { RemindersResponseDto, CreateRemindersDto, UpdateRemindersDto } from '../models/api.models';
import { firstValueFrom, Subject, combineLatest, of } from 'rxjs';
import { switchMap, tap, finalize, startWith, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RemindersStateService {
  private api = inject(ApiService);

  // Pagination Signals
  currentPage = signal(0);
  pageSize = signal(10);

  // Triggers
  private refresh$ = new Subject<void>();

  // Loading State
  private _isLoading = signal(false);
  isLoading = this._isLoading.asReadonly();

  error = signal<any>(null);

  // Writable Local State for Optimistic UI
  private _localData = signal<{ content: RemindersResponseDto[]; page: any } | null>(null);

  // Data Source
  private resource$ = combineLatest([
    toObservable(this.currentPage),
    toObservable(this.pageSize),
    this.refresh$.pipe(startWith(undefined)),
  ]).pipe(
    tap(() => {
      if (!this._localData()) {
        this._isLoading.set(true);
      }
      this.error.set(null);
    }),
    switchMap(([page, size]) =>
      this.api.getReminders(page, size).pipe(
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

  // Public Signals
  reminders = computed(() => this._localData()?.content || []);

  totalElements = computed(() => {
    const res = this.serverState();
    if (!res) return 0;
    return res.page?.totalElements ?? (res as any).totalElements ?? 0;
  });

  totalPages = computed(() => {
    const res = this.serverState();
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
  add(dto: CreateRemindersDto) {
    // Optimistic Update
    const tempId = -Date.now();
    const current = this._localData();
    let tempItem: RemindersResponseDto | null = null;

    if (current) {
      tempItem = {
        id: tempId,
        message: dto.message,
        remindAt: dto.remindAt,
        amount: dto.amount,
        expenseId: dto.expenseId,
        createdAt: new Date().toISOString(),
      } as RemindersResponseDto;

      this._localData.set({
        ...current,
        content: [tempItem, ...current.content],
        page: { ...current.page, totalElements: (current.page?.totalElements || 0) + 1 },
      });
    }

    return firstValueFrom(
      this.api.createReminder(dto).pipe(
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

  update(id: number, dto: UpdateRemindersDto) {
    // Optimistic Update
    const current = this._localData();
    if (current) {
      const index = current.content.findIndex((x) => x.id === id);
      if (index !== -1) {
        const item = current.content[index];
        const updated = { ...item, ...dto } as RemindersResponseDto;
        const newContent = [...current.content];
        newContent[index] = updated;
        this._localData.set({ ...current, content: newContent });
      }
    }

    return firstValueFrom(
      this.api.updateReminder(id, dto).pipe(
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
      this.api.deleteReminder(id).pipe(
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
