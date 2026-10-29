import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppSearchResponse,
  OAuthApp,
  GuidesListResponse,
  OAuthGuide,
  AuthStrategyRequest,
  AuthStrategyResponse,
  InvestigationRequest,
  InvestigationListResponse,
  InvestigationDetail,
  FeedbackRequest,
  FeedbackResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8000';

  // ── Apps ──────────────────────────────────────────────────────────────────

  searchApps(params: {
    q?: string;
    category?: string;
    difficulty?: string;
    guide_only?: boolean;
  }): Observable<AppSearchResponse> {
    let p = new HttpParams();
    if (params.q)          p = p.set('q', params.q);
    if (params.category)   p = p.set('category', params.category);
    if (params.difficulty) p = p.set('difficulty', params.difficulty);
    if (params.guide_only) p = p.set('guide_only', 'true');
    return this.http.get<AppSearchResponse>(`${this.base}/api/apps`, { params: p });
  }

  getApp(appId: string): Observable<OAuthApp> {
    return this.http.get<OAuthApp>(`${this.base}/api/apps/${appId}`);
  }

  // ── Guides ────────────────────────────────────────────────────────────────

  listGuides(): Observable<GuidesListResponse> {
    return this.http.get<GuidesListResponse>(`${this.base}/api/guides`);
  }

  getGuide(appId: string): Observable<OAuthGuide> {
    return this.http.get<OAuthGuide>(`${this.base}/api/guides/${appId}`);
  }

  // ── Strategy ──────────────────────────────────────────────────────────────

  getStrategy(req: AuthStrategyRequest): Observable<AuthStrategyResponse> {
    return this.http.post<AuthStrategyResponse>(`${this.base}/api/strategy`, req);
  }

  // ── Investigate (non-streaming) ───────────────────────────────────────────

  investigate(req: InvestigationRequest): Observable<OAuthGuide> {
    return this.http.post<OAuthGuide>(`${this.base}/api/investigate`, req);
  }

  // ── Investigations history ────────────────────────────────────────────────

  listInvestigations(params: {
    limit?: number;
    offset?: number;
    app_name?: string;
  }): Observable<InvestigationListResponse> {
    let p = new HttpParams();
    if (params.limit  != null) p = p.set('limit',  params.limit);
    if (params.offset != null) p = p.set('offset', params.offset);
    if (params.app_name)       p = p.set('app_name', params.app_name);
    return this.http.get<InvestigationListResponse>(`${this.base}/api/investigations`, { params: p });
  }

  getInvestigation(id: string): Observable<InvestigationDetail> {
    return this.http.get<InvestigationDetail>(`${this.base}/api/investigations/${id}`);
  }

  submitFeedback(id: string, req: FeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(
      `${this.base}/api/investigations/${id}/feedback`, req
    );
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  getSharedInvestigation(id: string): Observable<OAuthGuide> {
    return this.http.get<OAuthGuide>(`${this.base}/api/share/${id}`);
  }
}
