import { Routes } from '@angular/router';

export const AdminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.AdminDashboardComponent),
    data: { title: 'Admin — NORTH PROD' },
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users').then((m) => m.AdminUsersComponent),
    data: { title: 'Utilisateurs — NORTH PROD' },
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./portfolio/portfolio').then((m) => m.AdminPortfolioComponent),
    data: { title: 'Portfolio — NORTH PROD' },
  },
  {
    path: 'services',
    loadComponent: () => import('./services/services').then((m) => m.AdminServicesComponent),
    data: { title: 'Services — NORTH PROD' },
  },
  {
    path: 'hero',
    loadComponent: () => import('./hero/hero').then((m) => m.AdminHeroComponent),
    data: { title: 'Hero Media — NORTH PROD' },
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
