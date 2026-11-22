import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, switchMap, tap } from 'rxjs';
import type { components } from './generated/schema';

type SessionWire = components['schemas']['SessionResponse'];

export interface SessionView {
  founderId: string;
  email: string;
  name: string;
  workspaceId: string;
  role: string;
  pictureUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);
  private readonly signedIn = signal<SessionView | null>(null);
  readonly account = this.signedIn.asReadonly();

  current(): Observable<SessionView> {
    return this.http.get<SessionWire>('/api/v1/session').pipe(
      map((wire) => toSessionView(wire)),
      tap((view) => this.signedIn.set(view)),
    );
  }

  login(username: string, password: string): Observable<void> {
    const body = new HttpParams().set('username', username).set('password', password);
    return this.http.post('/api/v1/login', body, { responseType: 'text' }).pipe(
      switchMap(() => this.current()),
      map(() => undefined),
    );
  }

  logout(): Observable<void> {
    return this.http.post('/logout', null, { responseType: 'text' }).pipe(
      tap(() => this.signedIn.set(null)),
      map(() => undefined),
    );
  }
}

function toSessionView(wire: SessionWire): SessionView {
  if (!wire.founderId || !wire.email || !wire.name || !wire.workspaceId || !wire.role) {
    throw new Error('Session response is missing a required field.');
  }
  return {
    founderId: wire.founderId,
    email: wire.email,
    name: wire.name,
    workspaceId: wire.workspaceId,
    role: wire.role,
    pictureUrl: wire.pictureUrl?.startsWith('https://') ? wire.pictureUrl : null,
  };
}
