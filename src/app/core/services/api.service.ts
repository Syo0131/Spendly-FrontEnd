import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  PremiumStatusDto,
  CreateSavingGoalsDto,
  UpdateSavingGoals,
  SavingGoalsResponse,
  PagedModelSavingGoalsResponse,
  ContributionResponse,
} from '../models/api.models';
import { CacheService } from './cache.service';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private cache: CacheService) {}

  // Helper for Cache-First Strategy
  private getWithCache<T>(key: string, url: string, params?: HttpParams): Observable<T> {
    const cached = this.cache.get(key);
    const network$ = this.http
      .get<T>(url, { params })
      .pipe(tap((data) => this.cache.set(key, data)));
    return cached ? of(cached) : network$;
    // Note: For true "Stale-While-Revalidate" where we show cache THEN update,
    // we would use concat(of(cached), network$).
    // However, concat awaits completion.
    // To emit both, we need merge or startWith.
    // For simplicity in this step to fix "white screen", returning cached if available is huge win.
    // Ideally: return cached ? concat(of(cached), network$) : network$;
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
    return this.http.post<MessageResponse>(`${this.baseUrl}/incomes/create`, data).pipe(
      tap(() => this.cache.clear()) // Invalidate all cache to ensure consistency
    );
  }

  deleteIncome(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/incomes/${id}/delete`)
      .pipe(tap(() => this.cache.clear()));
  }

  updateIncome(id: number, data: UpdateIncome): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/incomes/${id}/update`, data)
      .pipe(tap(() => this.cache.clear()));
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
      .pipe(tap(() => this.cache.clear()));
  }

  updateExpense(id: number, data: UpdateExpense): Observable<MessageResponse> {
    return this.http
      .put<MessageResponse>(`${this.baseUrl}/expenses/${id}/update`, data)
      .pipe(tap(() => this.cache.clear()));
  }

  deleteExpense(id: number): Observable<MessageResponse> {
    return this.http
      .delete<MessageResponse>(`${this.baseUrl}/expenses/${id}/delete`)
      .pipe(tap(() => this.cache.clear()));
  }

  getExpensesMonthTotal(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/expenses/month/${year}/${month}/total`);
  }

  getExpensesByCategory(year: number, month: number): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(
      `${this.baseUrl}/expenses/month/${year}/${month}/by-category`
    );
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

  disconnectBank(bankName: string): Observable<MessageResponse> {
    const params = new HttpParams().set('bank', bankName);
    return this.http.delete<MessageResponse>(`${this.baseUrl}/banks/disconnect`, { params });
  }

  getBankStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/banks/status`);
  }
  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
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
}
