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
} from '../models/api.models';
import { CacheService } from './cache.service';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://backend.daybeldiaz.dev/api';

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
    const params = new HttpParams().set('page', page).set('size', size);
    const key = `incomes-p${page}-s${size}`;
    // Using simple approach first: if cache exists, use it. Background update is complex without component changes.
    // Let's do simple read-through cache for now to solve "offline".
    return this.getWithCache(key, `${this.baseUrl}/incomes`, params);
  }

  createIncome(data: CreateIncome): Observable<MessageResponse> {
    this.cache.clear(); // Invalidate cache on mutation
    return this.http.post<MessageResponse>(`${this.baseUrl}/incomes/create`, data);
  }

  deleteIncome(id: number): Observable<MessageResponse> {
    this.cache.clear();
    return this.http.delete<MessageResponse>(`${this.baseUrl}/incomes/${id}/delete`);
  }

  updateIncome(id: number, data: UpdateIncome): Observable<MessageResponse> {
    this.cache.clear();
    return this.http.put<MessageResponse>(`${this.baseUrl}/incomes/${id}/update`, data);
  }

  // Expenses
  getExpenses(page = 0, size = 20): Observable<PagedResponse<ExpenseResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    const key = `expenses-p${page}-s${size}`;
    return this.getWithCache(key, `${this.baseUrl}/expenses`, params);
  }

  createExpense(data: CreateExpense): Observable<MessageResponse> {
    this.cache.clear();
    return this.http.post<MessageResponse>(`${this.baseUrl}/expenses`, data);
  }

  updateExpense(id: number, data: UpdateExpense): Observable<MessageResponse> {
    this.cache.clear();
    return this.http.put<MessageResponse>(`${this.baseUrl}/expenses/${id}/update`, data);
  }

  deleteExpense(id: number): Observable<MessageResponse> {
    this.cache.clear();
    return this.http.delete<MessageResponse>(`${this.baseUrl}/expenses/${id}/delete`);
  }

  getExpensesMonthTotal(year: number, month: number): Observable<any> {
    const key = `expenses-total-${year}-${month}`;
    return this.getWithCache(key, `${this.baseUrl}/expenses/month/${year}/${month}/total`);
  }

  getExpensesByCategory(year: number, month: number): Observable<MonthlyStats> {
    const key = `expenses-cat-${year}-${month}`;
    return this.getWithCache(key, `${this.baseUrl}/expenses/month/${year}/${month}/by-category`);
  }

  // Get Last 6 Months Income vs Expense
  getIncomeVsExpenseStats(): Observable<any[]> {
    // This one was failing/mocked anyway, but let's cache it if it works
    return this.http.get<any[]>(`${this.baseUrl}/stats/income-expense-history`);
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
}
