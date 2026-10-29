import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="material-icons">lock_open</span> OAuth 2.0 Integration Platform
        </div>
        <h1>Ship OAuth integrations<br>without the guesswork</h1>
        <p>
          Browse curated setup guides, run AI-powered investigations for any OAuth provider,
          and get a tailored strategy recommendation — all in one place.
        </p>
        <div class="hero-actions">
          <a routerLink="/investigate" class="btn btn-primary btn-lg">
            <span class="material-icons">search</span> Investigate an App
          </a>
          <a routerLink="/catalog" class="btn btn-secondary btn-lg">
            <span class="material-icons">apps</span> Browse Catalog
          </a>
        </div>
      </div>
    </div>

    <div class="features-section">
      <div class="section-inner">
        <h2 class="section-title">Everything you need for OAuth</h2>
        <div class="features-grid">
          <div class="feature-card card" *ngFor="let feat of features">
            <div class="feature-icon" [style.background]="feat.bg">
              <span class="material-icons" [style.color]="feat.color">{{ feat.icon }}</span>
            </div>
            <h3>{{ feat.title }}</h3>
            <p>{{ feat.desc }}</p>
            <a [routerLink]="feat.link" class="feature-link">
              {{ feat.cta }} <span class="material-icons">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="providers-section">
      <div class="section-inner">
        <p class="providers-label text-muted text-small">CURATED GUIDES FOR</p>
        <div class="providers-list">
          <div class="provider-chip" *ngFor="let p of providers">
            <span class="provider-initial" [style.background]="p.color">{{ p.name.charAt(0) }}</span>
            {{ p.name }}
          </div>
        </div>
        <p class="providers-note text-muted text-small">
          + investigate any other OAuth provider with AI-powered research
        </p>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #fff;
      padding: 72px 24px;
    }
    .hero-inner {
      max-width: 720px;
      margin: 0 auto;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 99px;
      padding: 5px 14px;
      font-size: 0.8125rem;
      font-weight: 500;
      margin-bottom: 24px;
      color: #93c5fd;
      .material-icons { font-size: 15px; }
    }
    h1 {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 700;
      color: #fff;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    .hero p {
      font-size: 1.05rem;
      color: #94a3b8;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-lg { padding: 11px 24px; font-size: 0.95rem; }
    .btn-primary { background: #2563eb; color: #fff; &:hover { background: #1d4ed8; } }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); &:hover { background: rgba(255,255,255,0.18); } }

    .features-section, .providers-section {
      padding: 64px 24px;
    }
    .features-section { background: var(--color-bg); }
    .providers-section { background: var(--color-surface); border-top: 1px solid var(--color-border); }
    .section-inner { max-width: 1100px; margin: 0 auto; }
    .section-title { font-size: 1.5rem; text-align: center; margin-bottom: 36px; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .feature-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: box-shadow var(--transition), transform var(--transition);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
      h3 { font-size: 1rem; margin: 0; }
      p  { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; flex: 1; }
    }
    .feature-icon {
      width: 44px; height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      .material-icons { font-size: 22px; }
    }
    .feature-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
      margin-top: 4px;
      .material-icons { font-size: 15px; }
      &:hover { text-decoration: underline; }
    }

    .providers-section { text-align: center; }
    .providers-label { letter-spacing: 0.08em; margin-bottom: 16px; }
    .providers-list { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
    .provider-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      border: 1px solid var(--color-border);
      border-radius: 99px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text);
    }
    .provider-initial {
      width: 22px; height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .providers-note { margin-top: 4px; }
  `]
})
export class HomeComponent {
  features = [
    {
      icon: 'apps',
      title: 'App Catalog',
      desc: 'Browse OAuth-ready applications, filter by category or difficulty, and find what you need fast.',
      link: '/catalog',
      cta: 'Browse apps',
      bg: '#dbeafe',
      color: '#1d4ed8',
    },
    {
      icon: 'menu_book',
      title: 'Setup Guides',
      desc: 'Step-by-step curated guides for Google, Slack, GitHub, Microsoft, and Notion with source links.',
      link: '/guides',
      cta: 'View guides',
      bg: '#dcfce7',
      color: '#15803d',
    },
    {
      icon: 'search',
      title: 'AI Investigation',
      desc: 'Enter any app name or URL and get an AI-generated OAuth guide powered by live web research.',
      link: '/investigate',
      cta: 'Start investigating',
      bg: '#f3e8ff',
      color: '#7c3aed',
    },
    {
      icon: 'psychology',
      title: 'Strategy Advisor',
      desc: 'Get a tailored recommendation: managed OAuth, custom OAuth, or investigate-first.',
      link: '/strategy',
      cta: 'Get a strategy',
      bg: '#fef9c3',
      color: '#a16207',
    },
  ];

  providers = [
    { name: 'Google',    color: '#4285f4' },
    { name: 'Slack',     color: '#4a154b' },
    { name: 'GitHub',    color: '#1f2328' },
    { name: 'Microsoft', color: '#0078d4' },
    { name: 'Notion',    color: '#000000' },
  ];
}
