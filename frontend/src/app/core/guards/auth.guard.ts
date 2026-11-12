import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionApi } from '../api/session-api.service';

export const authGuard: CanActivateFn = () => {
  const sessions = inject(SessionApi);
  const router = inject(Router);
  return sessions.current().pipe(
    map(() => true),
    catchError((error: unknown) =>
      of(
        router.createUrlTree(['/login'], {
          queryParams: error instanceof HttpErrorResponse && error.status === 403 ? { denied: '1' } : {},
        }),
      ),
    ),
  );
};
