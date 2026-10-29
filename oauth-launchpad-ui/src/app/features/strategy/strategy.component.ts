import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OAuthApp, AuthStrategyResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Auth Strategy Advisor</h1>
          <p class="page-subtitle">Get a recommended OAuth strategy for any app in the catalog.</p>
        </div>
      </div>

      <div class="content-grid">
        <!-- Form -->
        <div class="form-panel card">
          <div class="panel-body">
            <h3>Configure your requirements</h3>

            <div class="form-group">
              <label>Application</label>
              <select class="form-control" [(ngModel)]="selectedAppId" (ngModelChange)="onAppChange()">
                <option value="">Select an application…</option>
                <option *ngFor="let app of apps" [value]="app.id">{{ app.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Use case</label>
              <input class="form-control" type="text" [(ngModel)]="useCase"
                placeholder="e.g. AI agent integration, user sign-in…" />
            </div>

            <div class="options-list">
              <label class="checkbox-group">
                <input type="checkbox" [(ngModel)]="production" />
                <span>Production deployment</span>
              </label>
              <label class="checkbox-group">
                <input type="checkbox" [(ngModel)]="needsCustomBranding" />
                <span>Custom branding on consent screen</span>
              </label>
              <label class="checkbox-group">
                <input type="checkbox" [(ngModel)]="needsCustomScopes" />
                <span>Custom or non-standard scopes</span>
              </label>
              <label class="checkbox-group">
                <input type="checkbox" [(ngModel)]="needsDedicatedQuota" />
                <span>Dedicated API quota</span>
              </label>
            </div>

            <button
              class="btn btn-primary"
              [disabled]="!selectedAppId || loading"
              (click)="getStrategy()"
              style="margin-top: 8px; width: 100%">
              <span class="spinner" *ngIf="loading" style="width:14px;height:14px;border-width:2px"></span>
              <span class="material-icons" *ngIf="!loading">psychology</span>
              {{ loading ? 'Analyzing…' : 'Get Recommendation' }}
            </button>

            <div *ngIf="error" class="alert alert-danger" style="margin-top: 16px">
              <span class="material-icons">error_outline</span>{{ error }}
            </div>
          </div>
        </div>

        <!-- Result -->
        <div class="result-panel" *ngIf="result; else emptyResult">
          <div class="strategy-card card">
            <div class="strategy-hero" [ngClass]="'strategy-' + result.recommended_strategy">
              <div class="strategy-icon">
                <span class="material-icons">{{ strategyIcon(result.recommended_strategy) }}</span>
              </div>
              <div>
                <div class="strategy-label">Recommended Strategy</div>
                <div class="strategy-name">{{ strategyLabel(result.recommended_strategy) }}</div>
              </div>
            </div>

            <div class="strategy-body">
              <div class="info-section">
                <h4>Rationale</h4>
                <p>{{ result.reason }}</p>
              </div>

              <div class="info-section" *ngIf="result.alternatives?.length">
                <h4>Alternatives to consider</h4>
                <ul class="info-list">
                  <li *ngFor="let alt of result.alternatives">{{ alt }}</li>
                </ul>
              </div>

              <div class="info-section" *ngIf="result.next_steps?.length">
                <h4>Next steps</h4>
                <ol class="info-list numbered">
                  <li *ngFor="let step of result.next_steps">{{ step }}</li>
                </ol>
              </div>

              <div class="info-section" *ngIf="result.uncertainties?.length">
                <h4>Uncertainties</h4>
                <ul class="info-list">
                  <li *ngFor="let u of result.uncertainties">{{ u }}</li>
                </ul>
              </div>

              <div class="info-section" *ngIf="result.sources?.length">
                <h4>Sources</h4>
                <div class="source-links">
                  <a *ngFor="let src of result.sources"
                    [href]="src" target="_blank" rel="noopener noreferrer" class="source-chip">
                    <span class="material-icons">open_in_new</span>{{ srcLabel(src) }}
                  </a>
                </div>
              </div>

              <div class="strategy-footer">
                <span class="badge badge-info">{{ result.evidence_status | titlecase }}</span>
                <a [routerLink]="['/guides', result.app_id]" class="btn btn-secondary btn-sm">
                  <span class="material-icons">menu_book</span> View Guide
                </a>
                <a [routerLink]="['/investigate']" class="btn btn-primary btn-sm">
                  <span class="material-icons">search</span> Investigate
                </a>
              </div>
            </div>
          </div>
        </div>

        <ng-template #emptyResult>
          <div class="result-placeholder" *ngIf="!loading">
            <span class="material-icons placeholder-icon">psychology</span>
            <p class="text-muted">Select an application and click <strong>Get Recommendation</strong> to see your strategy.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .page-header { margin-bottom: 28px; h1 { font-size: 1.6rem; margin-bottom: 4px; } }
    .page-subtitle { color: var(--color-text-muted); margin: 0; }

    .content-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 24px;
      align-items: start;
      @media (max-width: 820px) { grid-template-columns: 1fr; }
    }

    .form-panel .panel-body { padding: 24px; }
    .form-panel h3 { font-size: 1rem; margin-bottom: 20px; }
    .options-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }

    .result-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px 24px;
      text-align: center;
      .placeholder-icon { font-size: 48px; color: var(--color-border); }
    }

    .strategy-card { overflow: hidden; }
    .strategy-hero {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 28px;
      background: var(--color-primary-light);
      border-bottom: 1px solid var(--color-border);

      &.strategy-managed_oauth    { background: #dcfce7; }
      &.strategy-custom_oauth     { background: #dbeafe; }
      &.strategy-investigate_first { background: #fef9c3; }
      &.strategy-alternative_auth { background: #f3e8ff; }
    }
    .strategy-icon {
      width: 48px; height: 48px;
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      .material-icons { font-size: 24px; color: var(--color-secondary); }
    }
    .strategy-label { font-size: 0.75rem; font-weight: 500; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .strategy-name { font-size: 1.15rem; font-weight: 700; color: var(--color-secondary); }

    .strategy-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
    .info-section {
      h4 { font-size: 0.875rem; font-weight: 600; color: var(--color-text); margin-bottom: 8px; }
      p  { color: var(--color-text-muted); font-size: 0.9rem; margin: 0; }
    }
    .info-list {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      li { color: var(--color-text-muted); font-size: 0.875rem; }
      &.numbered { padding-left: 22px; }
    }
    .source-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .source-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--color-primary);
      border: 1px solid var(--color-primary-light);
      border-radius: 4px;
      padding: 3px 8px;
      text-decoration: none;
      transition: background var(--transition);
      .material-icons { font-size: 12px; }
      &:hover { background: var(--color-primary-light); text-decoration: none; }
    }
    .strategy-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }
  `]
})
export class StrategyComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  apps: OAuthApp[] = [];
  selectedAppId = '';
  useCase = 'AI agent integration';
  production = false;
  needsCustomBranding = false;
  needsCustomScopes = false;
  needsDedicatedQuota = false;
  result: AuthStrategyResponse | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.api.searchApps({}).subscribe({
      next: res => {
        this.apps = res.results;
        const preselect = this.route.snapshot.queryParamMap.get('app_id');
        if (preselect) {
          this.selectedAppId = preselect;
          this.getStrategy();
        }
      }
    });
  }

  onAppChange(): void {
    this.result = null;
    this.error = '';
  }

  getStrategy(): void {
    if (!this.selectedAppId) return;
    this.loading = true;
    this.error = '';
    this.api.getStrategy({
      app_id: this.selectedAppId,
      use_case: this.useCase,
      production: this.production,
      needs_custom_branding: this.needsCustomBranding,
      needs_custom_scopes: this.needsCustomScopes,
      needs_dedicated_quota: this.needsDedicatedQuota,
    }).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => {
        this.error = err.error?.detail || 'Failed to get strategy.';
        this.loading = false;
      }
    });
  }

  strategyIcon(s: string): string {
    const icons: Record<string, string> = {
      managed_oauth:     'verified_user',
      custom_oauth:      'build',
      alternative_auth:  'swap_horiz',
      investigate_first: 'search',
    };
    return icons[s] || 'psychology';
  }

  strategyLabel(s: string): string {
    const labels: Record<string, string> = {
      managed_oauth:     'Managed OAuth',
      custom_oauth:      'Custom OAuth',
      alternative_auth:  'Alternative Auth',
      investigate_first: 'Investigate First',
    };
    return labels[s] || s;
  }

  srcLabel(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url.substring(0, 30);
    }
  }
}
