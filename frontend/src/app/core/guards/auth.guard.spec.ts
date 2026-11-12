import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('sends an anonymous founder to login', async () => {
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const outcome = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as Observable<
      boolean | UrlTree
    >;
    const pending = firstValueFrom(outcome);
    const request = http.expectOne('/api/v1/session');
    request.flush({ message: 'Authentication is required.' }, { status: 401, statusText: 'Unauthorized' });
    const result = await pending;
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    http.verify();
  });
});
