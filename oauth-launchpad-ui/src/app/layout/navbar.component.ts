import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner">
        <a class="navbar-brand" routerLink="/">
          <span class="brand-icon material-icons">lock_open</span>
          <span class="brand-text">OAuth <strong>Launchpad</strong></span>
        </a>

        <button class="mobile-toggle" (click)="menuOpen = !menuOpen" aria-label="Toggle menu">
          <span class="material-icons">{{ menuOpen ? 'close' : 'menu' }}</span>
        </button>

        <ul class="navbar-nav" [class.open]="menuOpen">
          <li>
            <a routerLink="/catalog" routerLinkActive="active" (click)="menuOpen = false">
              <span class="material-icons">apps</span> Catalog
            </a>
          </li>
          <li>
            <a routerLink="/guides" routerLinkActive="active" (click)="menuOpen = false">
              <span class="material-icons">menu_book</span> Guides
            </a>
          </li>
          <li>
            <a routerLink="/investigate" routerLinkActive="active" (click)="menuOpen = false">
              <span class="material-icons">search</span> Investigate
            </a>
          </li>
          <li>
            <a routerLink="/strategy" routerLinkActive="active" (click)="menuOpen = false">
              <span class="material-icons">psychology</span> Strategy
            </a>
          </li>
          <li>
            <a routerLink="/history" routerLinkActive="active" (click)="menuOpen = false">
              <span class="material-icons">history</span> History
            </a>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #fff;
      border-bottom: 1px solid var(--color-border);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .navbar-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--color-secondary);
      white-space: nowrap;
      .brand-icon { color: var(--color-primary); font-size: 22px; }
      .brand-text { font-size: 1.05rem; }
      strong { font-weight: 700; }
    }
    .navbar-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      list-style: none;
      margin: 0 0 0 auto;
      padding: 0;

      a {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-muted);
        text-decoration: none;
        transition: background var(--transition), color var(--transition);

        .material-icons { font-size: 17px; }

        &:hover { background: var(--color-bg); color: var(--color-text); }
        &.active { background: var(--color-primary-light); color: var(--color-primary-dark); }
      }
    }
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      margin-left: auto;
      color: var(--color-text);
      .material-icons { font-size: 22px; }
    }
    @media (max-width: 720px) {
      .mobile-toggle { display: flex; align-items: center; }
      .navbar-nav {
        display: none;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        flex-direction: column;
        background: #fff;
        border-bottom: 1px solid var(--color-border);
        padding: 12px 0;
        gap: 0;
        margin: 0;
        box-shadow: var(--shadow-md);
        &.open { display: flex; }
        a { border-radius: 0; padding: 12px 24px; }
      }
    }
  `]
})
export class NavbarComponent {
  menuOpen = false;
}
