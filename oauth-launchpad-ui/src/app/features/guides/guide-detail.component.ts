import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { OAuthGuide } from '../../core/models/api.models';
import { GuideViewComponent } from '../../shared/components/guide-view.component';

@Component({
  selector: 'app-guide-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, GuideViewComponent],
  template: `
    <div class="page-container">
      <div class="breadcrumb">
        <a routerLink="/guides">Guides</a>
        <span class="material-icons">chevron_right</span>
        <span>{{ guide?.app_name || appId }}</span>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner spinner-lg"></div>
        <p class="text-muted">Loading guide…</p>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <span class="material-icons">error_outline</span>{{ error }}
      </div>

      <div *ngIf="!loading && guide" class="card">
        <app-guide-view [guide]="guide"></app-guide-view>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin-bottom: 24px;
      a { color: var(--color-primary); text-decoration: none; &:hover { text-decoration: underline; } }
      .material-icons { font-size: 16px; }
    }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px 0; }
  `]
})
export class GuideDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  guide: OAuthGuide | null = null;
  appId = '';
  loading = false;
  error = '';

  ngOnInit(): void {
    this.appId = this.route.snapshot.paramMap.get('id') || '';
    this.loading = true;
    this.api.getGuide(this.appId).subscribe({
      next: guide => { this.guide = guide; this.loading = false; },
      error: err => {
        this.error = err.status === 404
          ? 'No guide found for this application.'
          : 'Failed to load guide.';
        this.loading = false;
      }
    });
  }
}
