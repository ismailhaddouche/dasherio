import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorCode } from '@disherio/shared';
import { authStore } from '../../store/auth.store';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Send cookies automatically with every request (HttpOnly auth_token cookie)
  req = req.clone({ withCredentials: true });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors
      const errorCode = error.error?.errorCode;
      if (
        error.status === 401 ||
        errorCode === ErrorCode.UNAUTHORIZED ||
        errorCode === ErrorCode.INVALID_TOKEN ||
        errorCode === ErrorCode.SESSION_EXPIRED
      ) {
        authStore.clearAuth();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
