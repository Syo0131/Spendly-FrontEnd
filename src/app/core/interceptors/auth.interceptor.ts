import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // const authService = inject(AuthService); // Removed to prevent Circular Dependency
  const token = localStorage.getItem('spendly_token'); // Access directly
  const router: Router = inject(Router);

  let authReq = req;
  if (token) {
    // console.log('AuthInterceptor: Attaching token', token.substring(0, 10) + '...');
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    // console.warn('AuthInterceptor: No token found in localStorage!');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized (Token expired/invalid)
      if (error.status === 401) {
        console.warn('Session expired. Logging out...');
        // authService.logout(); // Avoid circular dep
        localStorage.removeItem('spendly_token');
        localStorage.removeItem('spendly_user');
        localStorage.removeItem('spendly_premium');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
