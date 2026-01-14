import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { SavingGoalsResponse, CreateSavingGoalsDto, UpdateSavingGoals } from '../models/api.models';
import { tap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GoalStateService {
  private api = inject(ApiService);

  // State
  private _goals = signal<SavingGoalsResponse[]>([]);
  private _totalElements = signal<number>(0);
  private _totalPages = signal<number>(0);
  private _currentPage = signal<number>(0);
  private _pageSize = signal<number>(20);

  private _isLoading = signal<boolean>(false);
  private _loaded = signal<boolean>(false);

  // Read-only
  goals = this._goals.asReadonly();
  totalElements = this._totalElements.asReadonly();
  totalPages = this._totalPages.asReadonly();
  currentPage = this._currentPage.asReadonly();
  pageSize = this._pageSize.asReadonly();
  isLoading = this._isLoading.asReadonly();
  loaded = this._loaded.asReadonly();

  load(page = 0, size = 20, force = false) {
    if (this._loaded() && this._currentPage() === page && this._pageSize() === size && !force)
      return;

    // Only set loading if we have no data to prevent flash
    if (this._goals().length === 0) {
      this._isLoading.set(true);
    }

    this.api
      .getSavingGoals(page, size)
      .pipe(
        tap((res) => {
          this._goals.set(res.content);
          this._totalElements.set(res.page.totalElements);
          this._totalPages.set(res.page.totalPages);
          this._currentPage.set(res.page.number);
          this._pageSize.set(size);
          this._loaded.set(true);
        }),
        finalize(() => this._isLoading.set(false))
      )
      .subscribe();
  }

  refresh() {
    this.load(this._currentPage(), this._pageSize(), true);
  }

  add(dto: CreateSavingGoalsDto) {
    // Optimistic Create
    const tempId = -Date.now();
    const tempItem: SavingGoalsResponse = {
      id: tempId,
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: 0,
      targetDate: dto.targetDate,
      enable: true,
      achieved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this._goals.update((list) => [tempItem, ...list]);

    return this.api.createSavingGoal(dto).pipe(
      tap(() => this.refresh()),
      tap({
        error: () => this._goals.update((list) => list.filter((g) => g.id !== tempId)),
      })
    );
  }

  update(id: number, dto: UpdateSavingGoals) {
    // Optimistic Update
    const currentList = this._goals();
    const index = currentList.findIndex((g) => g.id === id);
    if (index !== -1) {
      const original = currentList[index];
      const updated = { ...original, ...dto };
      this._goals.update((list) => {
        const newList = [...list];
        newList[index] = updated;
        return newList;
      });

      return this.api.updateSavingGoal(id, dto).pipe(
        tap(() => this.refresh()),
        tap({
          error: () => this._goals.set(currentList), // Revert
        })
      );
    }
    return this.api.updateSavingGoal(id, dto).pipe(tap(() => this.refresh()));
  }

  delete(id: number) {
    const prev = this._goals();
    this._goals.update((list) => list.filter((g) => g.id !== id));
    return this.api.deleteSavingGoal(id).pipe(
      tap({
        error: () => this._goals.set(prev),
        next: () => this.refresh(),
      })
    );
  }

  // Contributions
  addContribution(id: number, amount: number, description?: string) {
    // Optimistic Contribution
    const currentList = this._goals();
    const index = currentList.findIndex((g) => g.id === id);
    if (index !== -1) {
      const original = currentList[index];
      const updated = {
        ...original,
        currentAmount: original.currentAmount + amount,
        // Check if achieved? Simple logic for UI feedback
        achieved: original.currentAmount + amount >= original.targetAmount,
      };
      this._goals.update((list) => {
        const newList = [...list];
        newList[index] = updated;
        return newList;
      });

      return this.api.addContribution(id, amount, description).pipe(
        tap((updatedGoal) => {
          // Update specific goal in list without full reload
          this._goals.update((list) => list.map((g) => (g.id === id ? updatedGoal : g)));
        }),
        tap({
          error: () => this._goals.set(currentList),
        })
      );
    }

    return this.api.addContribution(id, amount, description).pipe(
      tap((updatedGoal) => {
        this._goals.update((list) => list.map((g) => (g.id === id ? updatedGoal : g)));
      })
    );
  }

  deleteContribution(goalId: number, contributionId: number) {
    // Hard to be optimistic here without knowing amount.
    // We will rely on fast refresh.
    return this.api.deleteContribution(goalId, contributionId).pipe(tap(() => this.refresh()));
  }
}
