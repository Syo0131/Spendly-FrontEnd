import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, CreateUser, TokenResponse, MessageResponse } from '../models/api.models';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'spendly_token';

  // Signal for auth state
  currentUserStr = signal<string | null>(localStorage.getItem('spendly_user'));
  isPremium = signal<boolean>(localStorage.getItem('spendly_premium') === 'true');
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService,
    private ns: NotificationService
  ) {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticated.set(true);
      this.validatePremiumStatus();
    } else if (token) {
      // Token exists but is expired
      this.logout();
    }
    console.log('AuthService: Initialized. Authenticated:', this.isAuthenticated());
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp is in seconds, Date.now() in ms
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true; // Treat invalid tokens as expired
    }
  }

  validatePremiumStatus(): void {
    if (!this.isAuthenticated()) return;
    this.apiService.checkPremiumStatus().subscribe({
      next: (res) => {
        console.log('AuthService: Premium status verified:', res.isPremium);
        this.isPremium.set(res.isPremium);
        localStorage.setItem('spendly_premium', String(res.isPremium));
      },
      error: (err) => console.error('AuthService: Failed to verify premium status', err),
    });
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    const url = `${this.apiUrl}/login`;
    console.log(`AuthService: calling POST ${url}`, credentials);
    return this.http
      .post<TokenResponse>(url, credentials)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  register(data: CreateUser): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    console.log('AuthService: Logout called. Clearing token.');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('spendly_user');
    localStorage.removeItem('spendly_premium');
    this.isAuthenticated.set(false);
    this.isPremium.set(false);
    this.currentUserStr.set(null);
    this.ns.clearHistory();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  readPremiumFromStorage(): string | null {
    return localStorage.getItem('spendly_premium');
  }

  private handleAuthSuccess(response: TokenResponse): void {
    console.log(
      'AuthService: Auth Success. Saving token:',
      response.token.substring(0, 10) + '...'
    );
    localStorage.setItem(this.tokenKey, response.token);
    this.isAuthenticated.set(true);
    if (response.username) {
      localStorage.setItem('spendly_user', response.username);
      this.currentUserStr.set(response.username);

      // Initial optimism from persisted value or default false, then verify
      this.validatePremiumStatus();
    }
  }
}
