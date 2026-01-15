import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import {
  PagedResponse,
  IncomeResponse,
  ExpenseResponse,
  CreateIncome,
  CreateExpense,
  UpdateIncome,
  UpdateExpense,
  MessageResponse,
  MonthlyStats,
  BankOption,
  UpdateUserDto,
  PagedModelSavingGoalsResponse,
  SavingGoalsResponse,
  TokenResponse,
  UpdateSavingGoals,
  UserResponse,
  CreateBudgetDto,
  PagedModelBudgetResponse,
  Budget,
  UpdateBudgetDto,
  PremiumStatusDto,
  CreateSavingGoalsDto,
  ContributionResponse,
  RecurringExpense,
  CreateRecurringExpenseDto,
  UpdateRecurringExpenseDto,
  PagedModelRecurringExpenseResponse,
  CreateRemindersDto,
  UpdateRemindersDto,
  RemindersResponseDto,
  PagedModelRemindersResponseDto,
} from '../models/api.models';
import { CacheService } from './cache.service';
import { of, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private cache: CacheService) {}

  // Helper for Cache-First Strategy with Offline Fallback
  private getWithCache<T>(key: string, url: string, params?: HttpParams): Observable<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return of(cached);
    }

    return this.http.get<T>(url, { params }).pipe(
      tap((data) => this.cache.set(key, data)),
      catchError((err) => {
        const stale = this.cache.get(key, true); // true = ignoreTTL
        if (stale) {
          console.warn(`[Offline] Returning stale cache for ${key}`, err);
          return of(stale);
        }
        throw err;
      })
    );
  }

  // Helper for Offline-First Strategy (Network -> Cache Fallback)
  private getWithOfflineSupport<T>(key: string, url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(url, { params }).pipe(
      tap((data) => this.cache.set(key, data)),
      catchError((err) => {
        const stale = this.cache.get(key, true); // true = ignoreTTL
        if (stale) {
          console.warn(`[Offline] Returning stale cache for ${key}`, err);
          return of(stale);
        }
        throw err;
      })
    );
  }

  // Public method to clear cache
  clearCache(key: string): void {
    this.cache.invalidate(key);
  }

  // Incomes
  getIncomes(page = 0, size = 20): Observable<PagedResponse<IncomeResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .append('sort', 'date,desc')
      .append('sort', 'id,desc');

    const url = `${this.baseUrl}/incomes`;
    if (page === 0) {
      return this.getWithCache<PagedResponse<IncomeResponse>>(
        `incomes_page_0_size_${size}`,
        url,
        params
      );
    }
    return this.http.get<PagedResponse<IncomeResponse>>(url, { params });
  }

  createIncome(data: CreateIncome): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/incomes/create`, data)
      .pipe(tap(() => this.cache.invalidate('incomes')));
  }

  deleteIncome(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/incomes/${id}/delete`)
      .pipe(tap(() => this.cache.invalidate('incomes')));
  }

  updateIncome(id: number, data: UpdateIncome): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/incomes/${id}/update`, data)
      .pipe(tap(() => this.cache.invalidate('incomes')));
  }

  // Expenses
  getExpenses(page = 0, size = 20): Observable<PagedResponse<ExpenseResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .append('sort', 'date,desc')
      .append('sort', 'id,desc');

    const url = `${this.baseUrl}/expenses`;
    if (page === 0) {
      return this.getWithCache<PagedResponse<ExpenseResponse>>(
        `expenses_page_0_size_${size}`,
        url,
        params
      );
    }
    return this.http.get<PagedResponse<ExpenseResponse>>(url, { params });
  }

  createExpense(data: CreateExpense): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/expenses/create`, data)
      .pipe(tap(() => this.cache.invalidate('expenses')));
  }

  updateExpense(id: number, data: UpdateExpense): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/expenses/${id}/update`, data)
      .pipe(tap(() => this.cache.invalidate('expenses')));
  }

  deleteExpense(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/expenses/${id}/delete`)
      .pipe(tap(() => this.cache.invalidate('expenses')));
  }

  getExpensesMonthTotal(year: number, month: number): Observable<any> {
    const key = `dashboard_total_${year}_${month}`;
    const url = `${this.baseUrl}/expenses/month/${year}/${month}/total`;
    return this.getWithOfflineSupport<any>(key, url);
  }

  getExpensesByCategory(year: number, month: number): Observable<MonthlyStats> {
    const key = `dashboard_category_${year}_${month}`;
    const url = `${this.baseUrl}/expenses/month/${year}/${month}/by-category`;
    return this.getWithOfflineSupport<MonthlyStats>(key, url);
  }

  // Saving Goals
  getSavingGoals(page = 0, size = 20): Observable<PagedModelSavingGoalsResponse> {
    const params = new HttpParams().set('page', page).set('size', size);
    const url = `${this.baseUrl}/saving-goals`;

    if (page === 0) {
      return this.getWithCache<PagedModelSavingGoalsResponse>(
        `saving_goals_page_0_size_${size}`,
        url,
        params
      );
    }
    return this.http.get<PagedModelSavingGoalsResponse>(url, { params });
  }

  getSavingGoalById(id: number): Observable<SavingGoalsResponse> {
    return this.http.get<SavingGoalsResponse>(`${this.baseUrl}/saving-goals/${id}`);
  }

  createSavingGoal(data: CreateSavingGoalsDto): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/saving-goals/create`, data)
      .pipe(tap(() => this.cache.clear()));
  }

  addContribution(
    id: number,
    amount: number,
    description?: string
  ): Observable<SavingGoalsResponse> {
    return this.http
      .patch<SavingGoalsResponse>(`${this.baseUrl}/saving-goals/${id}/add-contribution`, {
        amount,
        description,
      })
      .pipe(tap(() => this.cache.clear()));
  }

  updateSavingGoal(id: number, data: UpdateSavingGoals): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/saving-goals/${id}/update`, data)
      .pipe(tap(() => this.cache.clear()));
  }

  deleteSavingGoal(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/saving-goals/${id}/delete`)
      .pipe(tap(() => this.cache.clear()));
  }

  getGoalContributions(goalId: number): Observable<PagedResponse<ContributionResponse>> {
    return this.http.get<PagedResponse<ContributionResponse>>(
      `${this.baseUrl}/saving-goals/${goalId}/contributions`
    );
  }

  deleteContribution(goalId: number, contributionId: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(
        `${this.baseUrl}/saving-goals/${goalId}/contributions/${contributionId}`
      )
      .pipe(tap(() => this.cache.clear()));
  }

  // Banks
  getBanks(): Observable<BankOption[]> {
    return this.http.get<BankOption[]>(`${this.baseUrl}/banks`);
  }

  authorizeBank(bankName: string): Observable<{ authUrl: string }> {
    const params = new HttpParams().set('banks', bankName);
    return this.http.get<{ authUrl: string }>(`${this.baseUrl}/banks/authorize`, { params });
  }

  getBankStatus(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/banks/status`);
  }

  disconnectBank(bankCode: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/banks/disconnect`, {
      params: { bank: bankCode },
    });
  }

  // Categories
  getCategories(): Observable<any[]> {
    return this.getWithCache<any[]>('categories', `${this.baseUrl}/categories`);
  }

  // Users
  updateUser(id: number, data: UpdateUserDto): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/users/update/${id}`, data);
  }

  checkPremiumStatus(): Observable<PremiumStatusDto> {
    // Add timestamp to prevent browser caching
    const params = new HttpParams().set('t', Date.now().toString());
    return this.http.get<PremiumStatusDto>(`${this.baseUrl}/users/premium-status`, { params });
  }

  // Budgets
  getBudgets(page = 0, size = 20): Observable<PagedModelBudgetResponse> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedModelBudgetResponse>(`${this.baseUrl}/budgets`, { params });
  }

  getBudgetById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.baseUrl}/budgets/${id}`);
  }

  getMonthlyBudgets(year: number, month: number): Observable<Budget[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<Budget[]>(`${this.baseUrl}/budgets/monthly`, { params });
  }

  createBudget(data: CreateBudgetDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/budgets/create`, data);
  }

  updateBudget(id: number, data: UpdateBudgetDto): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.baseUrl}/budgets/${id}/update`, data);
  }

  cloneBudgetToNext(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/budgets/${id}/clone-to-next`, {});
  }

  deleteBudget(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/budgets/${id}/delete`);
  }

  // Recurring Expenses
  getRecurringExpenses(
    page = 0,
    size = 10,
    sortBy = 'nextExecutionDate'
  ): Observable<PagedModelRecurringExpenseResponse> {
    const params = new HttpParams().set('page', page).set('size', size).set('sortBy', sortBy);

    // We can cache the list, but cache key needs to include all params
    const url = `${this.baseUrl}/recurring-expenses`;
    if (page === 0) {
      return this.getWithCache<PagedModelRecurringExpenseResponse>(
        `recurring_expenses_page_0_size_${size}`,
        url,
        params
      );
    }
    return this.http.get<PagedModelRecurringExpenseResponse>(url, { params });
  }

  getRecurringExpenseById(id: number): Observable<RecurringExpense> {
    return this.http.get<RecurringExpense>(`${this.baseUrl}/recurring-expenses/${id}`);
  }

  createRecurringExpense(data: CreateRecurringExpenseDto): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/recurring-expenses`, data)
      .pipe(tap(() => this.cache.clear()));
  }

  updateRecurringExpense(id: number, data: UpdateRecurringExpenseDto): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/recurring-expenses/${id}/update`, data) // Note: Backend uses PUT /{id} directly based on specs
      .pipe(tap(() => this.cache.clear()));
  }

  deleteRecurringExpense(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/recurring-expenses/${id}/delete`)
      .pipe(tap(() => this.cache.clear()));
  }

  // Reminders
  getReminders(page = 0, size = 20): Observable<PagedModelRemindersResponseDto> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .append('sort', 'remindAt,asc');

    const url = `${this.baseUrl}/reminders`;
    if (page === 0) {
      return this.getWithCache<PagedModelRemindersResponseDto>(
        `reminders_page_0_size_${size}`,
        url,
        params
      );
    }
    return this.http.get<PagedModelRemindersResponseDto>(url, { params });
  }

  createReminder(data: CreateRemindersDto): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/reminders/create`, data)
      .pipe(tap(() => this.cache.invalidate('reminders')));
  }

  updateReminder(id: number, data: UpdateRemindersDto): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/reminders/${id}/update`, data)
      .pipe(tap(() => this.cache.invalidate('reminders')));
  }

  deleteReminder(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/reminders/${id}/delete`)
      .pipe(tap(() => this.cache.invalidate('reminders')));
  }
}
