import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OAuthGuide, ProgressEvent } from '../../core/models/api.models';
import { GuideViewComponent } from '../../shared/components/guide-view.component';
import { ApiService } from '../../core/services/api.service';

type Phase = 'idle' | 'running' | 'done' | 'error';

@Component({
  selector: 'app-investigate',
  standalone: true,
  imports: [CommonModule, FormsModule, GuideViewComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Investigate OAuth</h1>
          <p class="page-subtitle">Run an AI-powered investigation of any app's OAuth setup process.</p>
        </div>
      </div>

      <!-- Input form -->
      <div class="card form-card" *ngIf="phase === 'idle' || phase === 'error'">
        <div class="form-card-body">
          <p class="form-intro">
            Provide an app name, its website, or both. The agent will research the OAuth
            documentation and produce a step-by-step integration guide.
          </p>
          <div class="form-row">
            <div class="form-group">
              <label>App name</label>
              <input
                class="form-control"
                type="text"
                placeholder="e.g. Dropbox, Salesforce, Zoom…"
                [(ngModel)]="appName"
              />
            </div>
            <div class="form-separator">or</div>
            <div class="form-group">
              <label>Website URL</label>
              <input
                class="form-control"
                type="url"
                placeholder="https://developer.example.com/oauth"
                [(ngModel)]="website"
              />
            </div>
          </div>

          <div *ngIf="phase === 'error'" class="alert alert-danger" style="margin-bottom:16px">
            <span class="material-icons">error_outline</span>{{ errorMsg }}
          </div>

          <div class="form-actions">
            <button
              class="btn btn-primary"
              [disabled]="!canStart"
              (click)="startInvestigation()">
              <span class="material-icons">search</span> Start Investigation
            </button>
            <p class="form-hint text-muted text-small">
              Investigations typically take 30–90 seconds and use live web research.
            </p>
          </div>
        </div>
      </div>

      <!-- Running -->
      <div class="card investigation-progress" *ngIf="phase === 'running'">
        <div class="progress-header">
          <div class="progress-title">
            <div class="spinner"></div>
            <h3>Investigating {{ appName || website }}…</h3>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
        </div>

        <div class="progress-bar progress-indeterminate" style="margin: 0 24px 20px;">
          <div class="progress-fill"></div>
        </div>

        <div class="progress-events">
          <div class="event-item" *ngFor="let ev of progressEvents">
            <span class="event-stage" [ngClass]="'stage-' + ev.stage">{{ ev.stage }}</span>
            <span class="event-message">{{ ev.message }}</span>
          </div>
          <div class="event-item current" *ngIf="currentEvent">
            <span class="event-stage">{{ currentEvent.stage }}</span>
            <span class="event-message">{{ currentEvent.message }}</span>
            <span class="dot-flashing"></span>
          </div>
        </div>
      </div>

      <!-- Result -->
      <div *ngIf="phase === 'done' && guide">
        <div class="result-actions">
          <button class="btn btn-secondary btn-sm" (click)="reset()">
            <span class="material-icons">add</span> New Investigation
          </button>
        </div>
        <div class="card">
          <app-guide-view
            [guide]="guide"
            [showFeedback]="true"
            (feedbackSubmitted)="onFeedback($event)">
          </app-guide-view>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
    .page-header { margin-bottom: 28px; h1 { font-size: 1.6rem; margin-bottom: 4px; } }
    .page-subtitle { color: var(--color-text-muted); margin: 0; }

    .form-card .form-card-body { padding: 28px 32px; }
    .form-intro { color: var(--color-text-muted); margin-bottom: 24px; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        .form-separator { text-align: center; }
      }
    }
    .form-group { margin-bottom: 0; }
    .form-separator { color: var(--color-text-muted); font-size: 0.875rem; font-weight: 500; }
    .form-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .form-hint { margin: 0; }

    .investigation-progress { padding: 24px; }
    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .progress-title { display: flex; align-items: center; gap: 12px; h3 { margin: 0; font-size: 1rem; } }

    .progress-events {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
      padding: 0 2px;
    }
    .event-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--color-bg);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      &.current { background: var(--color-primary-light); }
    }
    .event-stage {
      flex-shrink: 0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--color-border);
      color: var(--color-text-muted);
      &.stage-research   { background: #dbeafe; color: #1d4ed8; }
      &.stage-analysis   { background: #f3e8ff; color: #7c3aed; }
      &.stage-generation { background: #dcfce7; color: #15803d; }
      &.stage-started    { background: #e0f2fe; color: #0369a1; }
    }
    .event-message { color: var(--color-text); }

    .dot-flashing {
      margin-left: auto;
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-primary);
      animation: dot-flash 1s infinite;
    }
    @keyframes dot-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    .result-actions { margin-bottom: 16px; display: flex; justify-content: flex-end; }
  `]
})
export class InvestigateComponent implements OnDestroy {
  private api = inject(ApiService);

  appName = '';
  website = '';
  phase: Phase = 'idle';
  progressEvents: ProgressEvent[] = [];
  currentEvent: ProgressEvent | null = null;
  guide: OAuthGuide | null = null;
  errorMsg = '';
  investigationId = '';

  private eventSource: EventSource | null = null;

  get canStart(): boolean {
    return (this.appName.trim().length > 0 || this.website.trim().length > 0);
  }

  startInvestigation(): void {
    if (!this.canStart) return;

    this.phase = 'running';
    this.progressEvents = [];
    this.currentEvent = null;
    this.guide = null;
    this.errorMsg = '';

    const params = new URLSearchParams();
    const body: Record<string, string> = {};
    if (this.appName.trim()) body['app_name'] = this.appName.trim();
    if (this.website.trim()) body['website'] = this.website.trim();

    // Use SSE streaming endpoint
    this.startSSE(body);
  }

  private startSSE(body: Record<string, string>): void {
    // POST then stream — fetch-based SSE since EventSource doesn't support POST
    const ctrl = new AbortController();
    this._abortController = ctrl;

    fetch('http://localhost:8000/api/investigate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    }).then(async response => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Investigation failed');
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        this.processSSELines(lines);
      }
    }).catch(err => {
      if ((err as Error).name === 'AbortError') return;
      this.phase = 'error';
      this.errorMsg = (err as Error).message || 'Investigation failed. Is the server running?';
    });
  }

  private _abortController: AbortController | null = null;
  private _sseEvent = { event: '', data: '' };

  private processSSELines(lines: string[]): void {
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        this._sseEvent.event = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        this._sseEvent.data = line.slice(6).trim();
      } else if (line === '') {
        // Dispatch event
        const { event, data } = this._sseEvent;
        this._sseEvent = { event: '', data: '' };
        if (!event || !data) continue;
        try {
          const parsed = JSON.parse(data);
          if (event === 'progress') {
            if (this.currentEvent) this.progressEvents.push(this.currentEvent);
            this.currentEvent = parsed as ProgressEvent;
          } else if (event === 'result') {
            this.guide = parsed as OAuthGuide;
            this.investigationId = parsed.investigation_id || '';
            if (this.currentEvent) this.progressEvents.push(this.currentEvent);
            this.currentEvent = null;
            this.phase = 'done';
          } else if (event === 'error') {
            this.phase = 'error';
            this.errorMsg = parsed.message || 'Investigation failed.';
          }
        } catch { /* ignore parse errors */ }
      }
    }
  }

  cancel(): void {
    this._abortController?.abort();
    this.reset();
  }

  reset(): void {
    this._abortController?.abort();
    this.phase = 'idle';
    this.guide = null;
    this.progressEvents = [];
    this.currentEvent = null;
    this.errorMsg = '';
  }

  onFeedback(ev: { rating: number }): void {
    if (!this.investigationId) return;
    this.api.submitFeedback(this.investigationId, { rating: ev.rating }).subscribe();
  }

  ngOnDestroy(): void {
    this._abortController?.abort();
    this.eventSource?.close();
  }
}
