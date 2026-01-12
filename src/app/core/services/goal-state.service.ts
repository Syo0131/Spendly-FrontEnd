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

    this._isLoading.set(true);
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
    return this.api.createSavingGoal(dto).pipe(tap(() => this.refresh()));
  }

  update(id: number, dto: UpdateSavingGoals) {
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
  // Contributions
  addContribution(id: number, amount: number, description?: string) {
    return this.api.addContribution(id, amount, description).pipe(
      tap((updatedGoal) => {
        // Update specific goal in list without full reload
        this._goals.update((list) => list.map((g) => (g.id === id ? updatedGoal : g)));
      })
    );
  }

  deleteContribution(goalId: number, contributionId: number) {
    return this.api.deleteContribution(goalId, contributionId).pipe(tap(() => this.refresh()));
  }
}
