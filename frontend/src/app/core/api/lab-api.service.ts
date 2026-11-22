import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { components } from './generated/schema';

export type Schemas = components['schemas'];

@Injectable({ providedIn: 'root' })
export class LabApi {
  private readonly http = inject(HttpClient);

  job(id: string): Observable<Schemas['JobResponse']> {
    return this.http.get<Schemas['JobResponse']>(`/api/v1/research-jobs/${id}`);
  }

  findings(directionId: string): Observable<Schemas['FindingsPage']> {
    return this.http.get<Schemas['FindingsPage']>(`/api/v1/directions/${directionId}/findings`);
  }
}
