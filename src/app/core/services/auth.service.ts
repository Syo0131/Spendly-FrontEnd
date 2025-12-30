import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, CreateUser, TokenResponse, MessageResponse } from '../models/api.models';
import { Router } from '@angular/router';

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
  isAuthenticated = signal<boolean>(!!localStorage.getItem(this.tokenKey));

  constructor(private http: HttpClient, private router: Router) {}

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
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('spendly_user');
    this.isAuthenticated.set(false);
    this.currentUserStr.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private handleAuthSuccess(response: TokenResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    this.isAuthenticated.set(true);
    if (response.username) {
      localStorage.setItem('spendly_user', response.username);
      this.currentUserStr.set(response.username);

      // Mock Premium check for now (random or hardcoded)
      // In real app this comes from response.isPremium
      // For testing locking, let's assume 'admin' is premium, others not?
      // Or just hardcode to false initially so user sees the lock screen.
      const isPrem = response.username === 'admin';
      localStorage.setItem('spendly_premium', String(isPrem));
      this.isPremium.set(isPrem);
    }
  }
}
