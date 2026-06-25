import { Routes } from '@angular/router';
import { authGuard, artistGuard, productionGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Public site (home + public pages) ────────────────────
  {
    path: '',
    loadChildren: () => import('./layouts/layout.routes').then((r) => r.Layout),
  },

  // ── Auth pages ────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((r) => r.AuthRoutes),
  },

  // ── Artist dashboard ──────────────────────────────────────
  {
    path: 'artist',
    canActivate: [artistGuard],
    loadChildren: () => import('./features/artist/artist.routes').then((r) => r.ArtistRoutes),
  },

  // ── Production team dashboard ─────────────────────────────
  {
    path: 'production',
    canActivate: [productionGuard],
    loadChildren: () => import('./features/production/production.routes').then((r) => r.ProductionRoutes),
  },

  // ── Admin panel ───────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((r) => r.AdminRoutes),
  },

  // ── Wildcard ──────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
