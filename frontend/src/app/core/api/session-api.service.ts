import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
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

  current(): Observable<SessionView> {
    return this.http.get<SessionWire>('/api/v1/session').pipe(map((wire) => toSessionView(wire)));
  }

  logout(): Observable<void> {
    return this.http.post('/logout', null, { responseType: 'text' }).pipe(map(() => undefined));
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
