import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { InvestigationRecord, OAuthGuide } from '../../core/models/api.models';
import { GuideViewComponent } from '../../shared/components/guide-view.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GuideViewComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Investigation History</h1>
          <p class="page-subtitle">View and revisit past AI-generated OAuth investigations.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters card">
        <div class="search-wrap">
          <span class="material-icons search-icon">search</span>
          <input
            class="form-control"
            type="text"
            placeholder="Filter by app name…"
            [(ngModel)]="filterName"
            (keyup.enter)="load()"
          />
        </div>
        <button class="btn btn-secondary" (click)="load()">
          <span class="material-icons">refresh</span> Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted">Loading history…</p>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <span class="material-icons">error_outline</span>{{ error }}
      </div>

      <div *ngIf="!loading && !error">
        <!-- Empty -->
        <div *ngIf="!items.length" class="empty-state">
          <span class="material-icons empty-icon">history</span>
          <p>No investigations yet.</p>
          <a routerLink="/investigate" class="btn btn-primary">
            <span class="material-icons">search</span> Start one
          </a>
        </div>

        <!-- Table -->
        <div class="table-card card" *ngIf="items.length">
          <table class="history-table">
            <thead>
              <tr>
                <th>App name</th>
                <th>Website</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items" [class.expanded-row]="expandedId === item.id">
                <td class="app-name-cell">
                  <span class="app-initial">{{ item.app_name ? item.app_name.charAt(0) : '?' }}</span>
                  {{ item.app_name }}
                </td>
                <td class="url-cell">
                  <a *ngIf="item.website" [href]="item.website" target="_blank" rel="noopener noreferrer" class="url-link">
                    {{ shortUrl(item.website) }}
                  </a>
                  <span *ngIf="!item.website" class="text-muted">—</span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="'status-' + item.status">
                    <span class="material-icons status-icon">{{ statusIcon(item.status) }}</span>
                    {{ item.status }}
                  </span>
                </td>
                <td class="date-cell">{{ formatDate(item.created_at) }}</td>
                <td class="action-cell">
                  <button
                    *ngIf="item.status === 'completed'"
                    class="btn btn-secondary btn-sm"
                    (click)="toggleExpand(item)">
                    <span class="material-icons">{{ expandedId === item.id ? 'expand_less' : 'expand_more' }}</span>
                    {{ expandedId === item.id ? 'Hide' : 'View' }}
                  </button>
                  <span *ngIf="item.status === 'failed'" class="text-small text-muted" [title]="item.error || ''">
                    {{ item.error ? item.error.substring(0, 40) + '…' : 'Failed' }}
                  </span>
                </td>
              </tr>
              <!-- Expanded guide row -->
              <tr *ngIf="expandedId && loadedGuide" class="guide-row">
                <td colspan="5">
                  <div class="expanded-guide card">
                    <app-guide-view
                      [guide]="loadedGuide"
                      [showFeedback]="true"
                      (feedbackSubmitted)="onFeedback($event, expandedId!)">
                    </app-guide-view>
                  </div>
                </td>
              </tr>
              <tr *ngIf="expandedId && detailLoading" class="guide-row">
                <td colspan="5">
                  <div class="loading-inline">
                    <div class="spinner"></div>
                    <span class="text-muted text-small">Loading guide…</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination" *ngIf="total > pageSize">
            <button class="btn btn-secondary btn-sm" [disabled]="offset === 0" (click)="prevPage()">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="page-info text-muted text-small">
              {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} of {{ total }}
            </span>
            <button class="btn btn-secondary btn-sm" [disabled]="offset + pageSize >= total" (click)="nextPage()">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .page-header { margin-bottom: 28px; h1 { font-size: 1.6rem; margin-bottom: 4px; } }
    .page-subtitle { color: var(--color-text-muted); margin: 0; }

    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 16px 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .search-wrap {
      position: relative;
      flex: 1 1 260px;
      .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-light); font-size: 18px; pointer-events: none; }
      .form-control { padding-left: 36px; }
    }

    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 0; }
    .loading-inline { display: flex; align-items: center; gap: 10px; padding: 16px 20px; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 0; color: var(--color-text-muted); .empty-icon { font-size: 48px; color: var(--color-border); } }

    .table-card { overflow: hidden; }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
      th { font-weight: 600; color: var(--color-text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; background: var(--color-bg); }
      tr:last-child td { border-bottom: none; }
      tbody tr:hover td { background: var(--color-bg); }
    }
    .app-name-cell { display: flex; align-items: center; gap: 10px; }
    .app-initial {
      width: 28px; height: 28px;
      border-radius: var(--radius-sm);
      background: var(--color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .url-cell { max-width: 200px; }
    .url-link { color: var(--color-primary); text-decoration: none; font-size: 0.8125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; &:hover { text-decoration: underline; } }
    .date-cell { white-space: nowrap; color: var(--color-text-muted); }
    .action-cell { white-space: nowrap; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
      .status-icon { font-size: 13px; }
      &.status-completed { background: #dcfce7; color: #15803d; }
      &.status-running   { background: #dbeafe; color: #1d4ed8; }
      &.status-failed    { background: #fee2e2; color: #b91c1c; }
    }

    .guide-row td { padding: 0 !important; background: var(--color-bg); }
    .expanded-guide { margin: 12px; border-radius: var(--radius-lg); }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 16px; border-top: 1px solid var(--color-border); }
    .page-info { min-width: 120px; text-align: center; }
  `]
})
export class HistoryComponent implements OnInit {
  private api = inject(ApiService);

  items: InvestigationRecord[] = [];
  total = 0;
  pageSize = 20;
  offset = 0;
  filterName = '';
  loading = false;
  error = '';

  expandedId: string | null = null;
  loadedGuide: OAuthGuide | null = null;
  detailLoading = false;

  Math = Math;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.expandedId = null;
    this.loadedGuide = null;
    this.api.listInvestigations({
      limit: this.pageSize,
      offset: this.offset,
      app_name: this.filterName || undefined,
    }).subscribe({
      next: res => { this.items = res.items; this.total = res.total; this.loading = false; },
      error: () => { this.error = 'Failed to load investigation history.'; this.loading = false; }
    });
  }

  toggleExpand(item: InvestigationRecord): void {
    if (this.expandedId === item.id) {
      this.expandedId = null;
      this.loadedGuide = null;
      return;
    }
    this.expandedId = item.id;
    this.loadedGuide = null;
    this.detailLoading = true;
    this.api.getInvestigation(item.id).subscribe({
      next: detail => {
        this.loadedGuide = detail.guide;
        this.detailLoading = false;
      },
      error: () => { this.detailLoading = false; }
    });
  }

  onFeedback(ev: { rating: number }, id: string): void {
    this.api.submitFeedback(id, { rating: ev.rating }).subscribe();
  }

  prevPage(): void { this.offset = Math.max(0, this.offset - this.pageSize); this.load(); }
  nextPage(): void { this.offset += this.pageSize; this.load(); }

  statusIcon(s: string): string {
    return s === 'completed' ? 'check_circle' : s === 'failed' ? 'error' : 'pending';
  }

  shortUrl(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.substring(0, 30); }
  }

  formatDate(d: string): string {
    try {
      return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  }
}
