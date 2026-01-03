import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('spendly_token');
  const router: Router = inject(Router);
  const injector = inject(Injector); // Inject Injector to lazily get AuthService

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Session expired. Logging out...');
        const authService = injector.get(AuthService); // Lazy injection
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
