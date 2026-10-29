import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthGuide } from '../../core/models/api.models';
import { DifficultyBadgeComponent } from './difficulty-badge.component';

@Component({
  selector: 'app-guide-view',
  standalone: true,
  imports: [CommonModule, DifficultyBadgeComponent],
  template: `
    <div class="guide-view" *ngIf="guide">

      <!-- Header -->
      <div class="guide-header">
        <div class="guide-title-row">
          <h2>{{ guide.app_name }} OAuth Setup Guide</h2>
          <div class="guide-badges">
            <app-difficulty-badge [difficulty]="guide.difficulty"></app-difficulty-badge>
            <span class="badge badge-info">{{ guide.evidence_status | titlecase }}</span>
            <span *ngIf="guide.approval_required !== 'unknown'" class="badge"
              [ngClass]="guide.approval_required === 'yes' ? 'badge-moderate' : 'badge-success'">
              Approval: {{ guide.approval_required | titlecase }}
            </span>
          </div>
        </div>
        <p class="guide-summary">{{ guide.summary }}</p>

        <!-- Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Active effort</span>
            <span class="metric-value">
              {{ guide.estimated_active_minutes != null ? guide.estimated_active_minutes + ' min' : 'Unknown' }}
            </span>
          </div>
          <div class="metric-card" *ngIf="guide.estimated_wait_days != null">
            <span class="metric-label">Wait time</span>
            <span class="metric-value">{{ guide.estimated_wait_days }} days</span>
          </div>
          <div class="metric-card" *ngIf="guide.effort_risk as risk">
            <span class="metric-label">Risk score</span>
            <span class="metric-value">{{ risk['risk_score'] != null ? risk['risk_score'] + '/100' : 'N/A' }}</span>
          </div>
          <div class="metric-card" *ngIf="guide.effort_risk as risk">
            <span class="metric-label">Complexity</span>
            <span class="metric-value">{{ risk['complexity'] || 'N/A' | titlecase }}</span>
          </div>
        </div>
      </div>

      <!-- Prerequisites -->
      <section class="guide-section" *ngIf="guide.prerequisites?.length">
        <h3><span class="material-icons">checklist</span> Prerequisites</h3>
        <ul class="simple-list">
          <li *ngFor="let p of guide.prerequisites">{{ p }}</li>
        </ul>
      </section>

      <!-- Steps -->
      <section class="guide-section" *ngIf="guide.steps?.length">
        <h3><span class="material-icons">format_list_numbered</span> Implementation Steps</h3>
        <div class="steps-list">
          <div class="step-card" *ngFor="let step of guide.steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-body">
              <div class="step-header">
                <h4>{{ step.title }}</h4>
                <div class="step-meta">
                  <span *ngIf="!step.required" class="badge badge-info">Optional</span>
                  <span *ngIf="step.human_action_required" class="badge badge-moderate">
                    <span class="material-icons" style="font-size:12px">person</span> Human action
                  </span>
                  <span *ngIf="step.estimated_minutes" class="time-pill">
                    <span class="material-icons">schedule</span>{{ step.estimated_minutes }} min
                  </span>
                </div>
              </div>
              <p>{{ step.description }}</p>
              <div class="step-sources" *ngIf="step.source_urls?.length">
                <a *ngFor="let url of step.source_urls" [href]="url" target="_blank" rel="noopener noreferrer" class="source-link">
                  <span class="material-icons">open_in_new</span>{{ urlLabel(url) }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Blockers -->
      <section class="guide-section" *ngIf="guide.blockers?.length">
        <h3><span class="material-icons">warning</span> Potential Blockers</h3>
        <ul class="simple-list warning-list">
          <li *ngFor="let b of guide.blockers">{{ b }}</li>
        </ul>
      </section>

      <!-- Human actions -->
      <section class="guide-section" *ngIf="guide.human_actions_required?.length">
        <h3><span class="material-icons">person</span> Human Actions Required</h3>
        <ul class="simple-list">
          <li *ngFor="let a of guide.human_actions_required">{{ a }}</li>
        </ul>
      </section>

      <!-- Managed auth -->
      <section class="guide-section" *ngIf="guide.managed_auth_options?.length">
        <h3><span class="material-icons">cloud</span> Managed Auth Options</h3>
        <div class="managed-option" *ngFor="let opt of guide.managed_auth_options">
          <div class="managed-header">
            <strong>{{ opt.provider }}</strong>
            <span class="badge" [ngClass]="availabilityClass(opt.availability)">{{ opt.availability | titlecase }}</span>
          </div>
          <p>{{ opt.description }}</p>
          <div *ngIf="opt.source_urls?.length" class="step-sources">
            <a *ngFor="let url of opt.source_urls" [href]="url" target="_blank" rel="noopener noreferrer" class="source-link">
              <span class="material-icons">open_in_new</span>{{ urlLabel(url) }}
            </a>
          </div>
        </div>
      </section>

      <!-- Uncertainties -->
      <section class="guide-section" *ngIf="guide.uncertainties?.length">
        <h3><span class="material-icons">help_outline</span> Uncertainties</h3>
        <ul class="simple-list">
          <li *ngFor="let u of guide.uncertainties">{{ u }}</li>
        </ul>
      </section>

      <!-- Sources -->
      <section class="guide-section" *ngIf="guide.sources?.length">
        <h3><span class="material-icons">link</span> Sources</h3>
        <div class="sources-list">
          <a *ngFor="let src of guide.sources" [href]="src" target="_blank" rel="noopener noreferrer" class="source-link">
            <span class="material-icons">open_in_new</span>{{ urlLabel(src) }}
          </a>
        </div>
      </section>

      <!-- Share & actions -->
      <div class="guide-footer" *ngIf="guide.share_url || showFeedback">
        <div class="footer-left">
          <a *ngIf="guide.share_url"
            [href]="'http://localhost:8000' + guide.share_url"
            target="_blank" rel="noopener noreferrer"
            class="btn btn-secondary btn-sm">
            <span class="material-icons">share</span> Share
          </a>
        </div>
        <div class="footer-right" *ngIf="showFeedback">
          <span class="text-muted text-small">Was this guide helpful?</span>
          <div class="star-rating">
            <button *ngFor="let star of [1,2,3,4,5]"
              class="star-btn"
              [class.filled]="(hoveredRating || selectedRating) >= star"
              (mouseenter)="hoveredRating = star"
              (mouseleave)="hoveredRating = 0"
              (click)="submitRating(star)">
              <span class="material-icons">star</span>
            </button>
          </div>
          <span *ngIf="feedbackSent" class="feedback-thanks">Thanks!</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .guide-view { display: flex; flex-direction: column; gap: 0; }

    .guide-header {
      padding: 28px 32px 24px;
      border-bottom: 1px solid var(--color-border);
    }
    .guide-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      h2 { font-size: 1.35rem; margin: 0; }
    }
    .guide-badges { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .guide-summary { color: var(--color-text-muted); margin: 0 0 20px; max-width: 760px; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
    }
    .metric-card {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .metric-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 1.05rem; font-weight: 600; color: var(--color-text); }

    .guide-section {
      padding: 24px 32px;
      border-bottom: 1px solid var(--color-border);
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1rem;
        margin-bottom: 16px;
        color: var(--color-text);
        .material-icons { font-size: 18px; color: var(--color-primary); }
      }
    }

    .simple-list {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      li { color: var(--color-text); line-height: 1.5; }
      &.warning-list li { color: #92400e; }
    }

    .steps-list { display: flex; flex-direction: column; gap: 12px; }
    .step-card {
      display: flex;
      gap: 16px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
    }
    .step-number {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      background: var(--color-primary);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 2px;
    }
    .step-body { flex: 1; min-width: 0; }
    .step-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 6px;
      h4 { margin: 0; font-size: 0.95rem; }
    }
    .step-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .time-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      .material-icons { font-size: 13px; }
    }
    .step-body p { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 8px; }
    .step-sources {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .source-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--color-primary);
      text-decoration: none;
      border: 1px solid var(--color-primary-light);
      border-radius: 4px;
      padding: 2px 8px;
      transition: background var(--transition);
      .material-icons { font-size: 12px; }
      &:hover { background: var(--color-primary-light); text-decoration: none; }
    }

    .managed-option {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin-bottom: 10px;
    }
    .managed-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

    .sources-list { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }

    .guide-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 32px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .footer-right { display: flex; align-items: center; gap: 10px; }
    .star-rating { display: flex; gap: 2px; }
    .star-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 2px;
      color: #cbd5e1;
      transition: color var(--transition), transform 0.1s;
      .material-icons { font-size: 22px; }
      &.filled { color: #f59e0b; }
      &:hover { transform: scale(1.1); }
    }
    .feedback-thanks { font-size: 0.875rem; color: var(--color-success); font-weight: 500; }
  `]
})
export class GuideViewComponent {
  @Input() guide: OAuthGuide | null = null;
  @Input() showFeedback = false;
  @Output() feedbackSubmitted = new EventEmitter<{ rating: number }>();

  hoveredRating = 0;
  selectedRating = 0;
  feedbackSent = false;

  urlLabel(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname.substring(0, 30) + '…' : '');
    } catch {
      return url.substring(0, 40);
    }
  }

  availabilityClass(a: string): string {
    if (a === 'confirmed_available') return 'badge-success';
    if (a === 'confirmed_unavailable') return 'badge-hard';
    if (a === 'requires_verification') return 'badge-moderate';
    return 'badge-unknown';
  }

  submitRating(star: number): void {
    this.selectedRating = star;
    this.feedbackSent = true;
    this.feedbackSubmitted.emit({ rating: star });
  }
}
