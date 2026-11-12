import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import type { components } from './generated/schema';

export type Schemas = components['schemas'];

export const TEMPLATE_ID = '00000000-0000-0000-0000-000000000003';
export const CENSUS_SOURCE_ID = '00000000-0000-0000-0000-000000000002';

export interface StartedJob {
  jobId: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class LabApi {
  private readonly http = inject(HttpClient);

  questionnaires(): Observable<Schemas['QuestionnairePage']> {
    return this.http.get<Schemas['QuestionnairePage']>('/api/v1/questionnaires');
  }

  submitQuestionnaire(answers: Record<string, string>): Observable<Schemas['QuestionnaireResponse']> {
    const body: Schemas['SubmitQuestionnaireRequest'] = { templateId: TEMPLATE_ID, answers };
    return this.http.post<Schemas['QuestionnaireResponse']>('/api/v1/questionnaires', body);
  }

  generateAlignment(questionnaireIds: string[]): Observable<Schemas['AlignmentResponse']> {
    const body: Schemas['GenerateAlignmentRequest'] = { questionnaireIds };
    return this.http.post<Schemas['AlignmentResponse']>('/api/v1/alignments/generate', body);
  }

  createDirection(alignmentId: string, title: string, description: string): Observable<Schemas['DirectionResponse']> {
    const body: Schemas['CreateDirectionRequest'] = { alignmentId, title, description, origin: 'FOUNDER' };
    return this.http.post<Schemas['DirectionResponse']>('/api/v1/directions', body);
  }

  startResearch(directionId: string, idempotencyKey: string): Observable<StartedJob> {
    const body: Schemas['StartResearchRequest'] = { approvedResearchSourceId: CENSUS_SOURCE_ID };
    return this.http
      .post<Record<string, string>>(`/api/v1/directions/${directionId}/research`, body, {
        headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }),
        observe: 'response',
      })
      .pipe(map((response) => startedJob(response)));
  }

  job(id: string): Observable<Schemas['JobResponse']> {
    return this.http.get<Schemas['JobResponse']>(`/api/v1/research-jobs/${id}`);
  }

  findings(directionId: string): Observable<Schemas['FindingsPage']> {
    return this.http.get<Schemas['FindingsPage']>(`/api/v1/directions/${directionId}/findings`);
  }

  createOpportunity(findingIds: string[], fields: {
    title: string;
    customerProblem: string;
    targetCustomer: string;
  }): Observable<Schemas['OpportunityResponse']> {
    const body: Schemas['CreateOpportunityRequest'] = { ...fields, findingIds };
    return this.http.post<Schemas['OpportunityResponse']>('/api/v1/opportunities', body);
  }

  opportunity(id: string): Observable<Schemas['OpportunityResponse']> {
    return this.http.get<Schemas['OpportunityResponse']>(`/api/v1/opportunities/${id}`);
  }

  addProduct(opportunityId: string, fields: {
    description: string;
    targetBuyers: string;
    differentiation: string;
    estimatedCosts: string;
    feasibility: string;
  }): Observable<Schemas['ProductResponse']> {
    const body: Schemas['CreateProductRequest'] = fields;
    return this.http.post<Schemas['ProductResponse']>(`/api/v1/opportunities/${opportunityId}/products`, body);
  }

  decide(opportunityId: string, decision: string, rationale: string): Observable<Schemas['DecisionResponse']> {
    const body: Schemas['CreateDecisionRequest'] = { decision, rationale };
    return this.http.post<Schemas['DecisionResponse']>(`/api/v1/opportunities/${opportunityId}/decisions`, body);
  }
}

function startedJob(response: HttpResponse<Record<string, string>>): StartedJob {
  const body = response.body ?? {};
  if (response.status === 202) {
    if (!body['jobId'] || !body['status']) {
      throw new Error('Research accept body is missing a field.');
    }
    return { jobId: body['jobId'], status: body['status'] };
  }
  if (!body['id'] || !body['status']) {
    throw new Error('Research job body is missing a field.');
  }
  return { jobId: body['id'], status: body['status'] };
}
