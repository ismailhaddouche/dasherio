import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotifyService } from '../services/notify.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notify = inject(NotifyService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ha ocurrido un error inesperado';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                // Our backend now uses { message, status } in standardized error responses
                errorMessage = error.error?.message || error.message || errorMessage;
            }

            notify.error(errorMessage);
            return throwError(() => error);
        })
    );
};
