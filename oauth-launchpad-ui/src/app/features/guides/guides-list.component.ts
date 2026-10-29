import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { GuideSummary } from '../../core/models/api.models';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';

@Component({
  selector: 'app-guides-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DifficultyBadgeComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>OAuth Setup Guides</h1>
          <p class="page-subtitle">Step-by-step curated guides for popular OAuth providers.</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted">Loading guides…</p>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <span class="material-icons">error_outline</span>{{ error }}
      </div>

      <div *ngIf="!loading && !error" class="guides-grid">
        <div class="guide-card card" *ngFor="let guide of guides">
          <div class="guide-card-body">
            <div class="guide-icon" [ngClass]="'provider-' + guide.app_name.toLowerCase()">
              {{ guide.app_name.charAt(0) }}
            </div>
            <div class="guide-info">
              <div class="guide-title-row">
                <h3>{{ guide.app_name }}</h3>
                <app-difficulty-badge [difficulty]="guide.difficulty"></app-difficulty-badge>
              </div>
              <p class="guide-summary">{{ guide.summary }}</p>
              <div class="guide-meta">
                <span class="meta-item" *ngIf="guide.estimated_active_minutes">
                  <span class="material-icons">schedule</span>
                  ~{{ guide.estimated_active_minutes }} min
                </span>
                <span class="meta-item">
                  <span class="material-icons">verified</span>
                  {{ guide.evidence_status | titlecase }}
                </span>
                <span class="meta-item"
                  [ngClass]="guide.approval_required === 'yes' ? 'warn' : ''">
                  <span class="material-icons">
                    {{ guide.approval_required === 'no' ? 'check_circle' : 'pending' }}
                  </span>
                  Approval: {{ guide.approval_required | titlecase }}
                </span>
              </div>
            </div>
          </div>
          <div class="guide-card-footer">
            <a [routerLink]="['/guides', guide.app_id]" class="btn btn-primary btn-sm">
              <span class="material-icons">menu_book</span> View Guide
            </a>
            <a [routerLink]="['/strategy']" [queryParams]="{ app_id: guide.app_id }" class="btn btn-secondary btn-sm">
              <span class="material-icons">psychology</span> Get Strategy
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .page-header { margin-bottom: 28px; h1 { font-size: 1.6rem; margin-bottom: 4px; } }
    .page-subtitle { color: var(--color-text-muted); margin: 0; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 0; }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .guide-card {
      display: flex;
      flex-direction: column;
      transition: box-shadow var(--transition), transform var(--transition);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    }
    .guide-card-body { display: flex; gap: 16px; padding: 20px; flex: 1; }
    .guide-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      background: var(--color-primary);
      &.provider-google    { background: #4285f4; }
      &.provider-slack     { background: #4a154b; }
      &.provider-github    { background: #1f2328; }
      &.provider-notion    { background: #000; }
      &.provider-microsoft { background: #0078d4; }
    }
    .guide-info { flex: 1; min-width: 0; }
    .guide-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      h3 { font-size: 1rem; margin: 0; }
    }
    .guide-summary { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 12px; }
    .guide-meta { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      .material-icons { font-size: 13px; }
      &.warn { color: var(--color-warning); }
    }
    .guide-card-footer {
      display: flex;
      gap: 8px;
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    }
  `]
})
export class GuidesListComponent implements OnInit {
  private api = inject(ApiService);
  guides: GuideSummary[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loading = true;
    this.api.listGuides().subscribe({
      next: res => { this.guides = res.results; this.loading = false; },
      error: () => { this.error = 'Failed to load guides.'; this.loading = false; }
    });
  }
}
