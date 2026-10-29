import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OAuthApp } from '../../core/models/api.models';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DifficultyBadgeComponent],
  template: `
    <div class="page-container">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1>App Catalog</h1>
          <p class="page-subtitle">Browse OAuth-enabled applications and their integration details.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar card">
        <div class="search-wrap">
          <span class="material-icons search-icon">search</span>
          <input
            class="form-control search-input"
            type="text"
            placeholder="Search by name, provider, or category…"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
          />
        </div>
        <div class="filter-group">
          <select class="form-control" [(ngModel)]="filterCategory" (ngModelChange)="onSearch()">
            <option value="">All categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
          <select class="form-control" [(ngModel)]="filterDifficulty" (ngModelChange)="onSearch()">
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
          <label class="checkbox-group">
            <input type="checkbox" [(ngModel)]="guideOnly" (ngModelChange)="onSearch()" />
            <span>Guide available</span>
          </label>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted">Loading applications…</p>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert alert-danger">
        <span class="material-icons">error_outline</span>
        {{ error }}
      </div>

      <!-- Results -->
      <div *ngIf="!loading && !error">
        <p class="results-count text-muted text-small" *ngIf="apps.length">
          {{ apps.length }} application{{ apps.length !== 1 ? 's' : '' }} found
        </p>
        <div class="apps-grid" *ngIf="apps.length; else emptyState">
          <div class="app-card card" *ngFor="let app of apps">
            <div class="app-card-body">
              <div class="app-icon" [ngClass]="'provider-' + app.provider.toLowerCase()">
                {{ app.name.charAt(0) }}
              </div>
              <div class="app-info">
                <div class="app-name-row">
                  <h3>{{ app.name }}</h3>
                  <app-difficulty-badge [difficulty]="app.difficulty"></app-difficulty-badge>
                </div>
                <p class="app-description">{{ app.description }}</p>
                <div class="app-meta">
                  <span class="meta-tag">
                    <span class="material-icons">category</span>{{ app.category }}
                  </span>
                  <span class="meta-tag">
                    <span class="material-icons">business</span>{{ app.provider }}
                  </span>
                  <span *ngIf="app.guide_available" class="meta-tag guide-tag">
                    <span class="material-icons">menu_book</span>Guide available
                  </span>
                </div>
              </div>
            </div>
            <div class="app-card-footer">
              <a [routerLink]="['/guides', app.id]" *ngIf="app.guide_available" class="btn btn-primary btn-sm">
                <span class="material-icons">menu_book</span> View Guide
              </a>
              <a [routerLink]="['/strategy']" [queryParams]="{ app_id: app.id }" class="btn btn-secondary btn-sm">
                <span class="material-icons">psychology</span> Strategy
              </a>
              <a [href]="app.website" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                <span class="material-icons">open_in_new</span> Docs
              </a>
            </div>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="empty-state">
            <span class="material-icons empty-icon">search_off</span>
            <p>No applications match your filters.</p>
            <button class="btn btn-secondary" (click)="clearFilters()">Clear filters</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .page-header {
      margin-bottom: 24px;
      h1 { font-size: 1.6rem; margin-bottom: 4px; }
    }
    .page-subtitle { color: var(--color-text-muted); margin: 0; }

    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      align-items: center;
    }
    .search-wrap {
      position: relative;
      flex: 1 1 280px;
      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-light);
        font-size: 18px;
        pointer-events: none;
      }
      .search-input { padding-left: 36px; }
    }
    .filter-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      select { width: auto; min-width: 140px; }
    }

    .results-count { margin-bottom: 12px; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 64px 0;
    }

    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .app-card {
      display: flex;
      flex-direction: column;
      transition: box-shadow var(--transition), transform var(--transition);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    }
    .app-card-body {
      display: flex;
      gap: 16px;
      padding: 20px;
      flex: 1;
    }
    .app-icon {
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

      &.provider-google   { background: #4285f4; }
      &.provider-slack    { background: #4a154b; }
      &.provider-github   { background: #1f2328; }
      &.provider-notion   { background: #000; }
      &.provider-microsoft { background: #0078d4; }
    }
    .app-info { flex: 1; min-width: 0; }
    .app-name-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      h3 { font-size: 1rem; margin: 0; }
    }
    .app-description { font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 10px; }
    .app-meta { display: flex; gap: 6px; flex-wrap: wrap; }
    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      .material-icons { font-size: 12px; }
      &.guide-tag { color: var(--color-primary); }
    }
    .app-card-footer {
      display: flex;
      gap: 8px;
      padding: 12px 20px;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      flex-wrap: wrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px 0;
      color: var(--color-text-muted);
      .empty-icon { font-size: 48px; color: var(--color-border); }
    }
  `]
})
export class CatalogComponent implements OnInit {
  private api = inject(ApiService);

  apps: OAuthApp[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  filterCategory = '';
  filterDifficulty = '';
  guideOnly = false;
  categories: string[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.searchApps({
      q: this.searchQuery,
      category: this.filterCategory || undefined,
      difficulty: this.filterDifficulty || undefined,
      guide_only: this.guideOnly || undefined,
    }).subscribe({
      next: res => {
        this.apps = res.results;
        if (!this.categories.length) {
          this.categories = [...new Set(res.results.map(a => a.category))].sort();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load applications. Make sure the API server is running.';
        this.loading = false;
      }
    });
  }

  onSearch(): void { this.load(); }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filterDifficulty = '';
    this.guideOnly = false;
    this.load();
  }
}
