import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'guides',
    loadComponent: () => import('./features/guides/guides-list.component').then(m => m.GuidesListComponent),
  },
  {
    path: 'guides/:id',
    loadComponent: () => import('./features/guides/guide-detail.component').then(m => m.GuideDetailComponent),
  },
  {
    path: 'investigate',
    loadComponent: () => import('./features/investigate/investigate.component').then(m => m.InvestigateComponent),
  },
  {
    path: 'strategy',
    loadComponent: () => import('./features/strategy/strategy.component').then(m => m.StrategyComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
