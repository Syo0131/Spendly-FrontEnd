import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Helper to check token expiration without full library overhead
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() in ms
    // Add a small buffer (e.g., 5s) to avoid race conditions
    return payload.exp * 1000 < Date.now() + 5000;
  } catch (e) {
    return true; // Invalid token = expired
  }
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('spendly_token');
  const injector = inject(Injector); // Inject Injector to lazily get AuthService

  // 1. Proactive Logic: If token exists but is expired, logout IMMEDIATELY.
  // Don't wait for server 401 response (saves network RTT).
  if (token && isTokenExpired(token)) {
    console.warn('Interceptor: Token expired locally. Aborting request & logging out.');
    const authService = injector.get(AuthService);
    authService.logout();
    return EMPTY; // Cancel the request
  }

  // 2. Attach Token
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // 3. Handle 401 from Server (Fallback for issues not caught locally, e.g. revoked token)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Interceptor: Partial 401 received from server. Logging out...');
        const authService = injector.get(AuthService);
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
