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

  ideas(): Observable<Schemas['IdeaChatPage']> {
    return this.http.get<Schemas['IdeaChatPage']>('/api/v1/ideas');
  }

  idea(id: string): Observable<Schemas['IdeaReading']> {
    return this.http.get<Schemas['IdeaReading']>(`/api/v1/ideas/${id}`);
  }

  deleteIdea(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/ideas/${id}`);
  }

  researchIdea(prompt: string): Observable<Schemas['IdeaReading']> {
    return this.http.post<Schemas['IdeaReading']>('/api/v1/ideas', { prompt });
  }

  continueIdea(id: string, prompt: string): Observable<Schemas['IdeaReading']> {
    return this.http.post<Schemas['IdeaReading']>(`/api/v1/ideas/${id}/turns`, { prompt });
  }

  model(): Observable<Schemas['ModelResponse']> {
    return this.http.get<Schemas['ModelResponse']>('/api/v1/model');
  }
}
