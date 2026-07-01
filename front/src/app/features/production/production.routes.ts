import { Routes } from '@angular/router';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell';

export const ProductionRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.ProductionDashboardComponent),
        data: { title: 'Tableau de bord — NORTH PROD' },
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/bookings').then((m) => m.ProductionBookingsComponent),
        data: { title: 'Réservations — NORTH PROD' },
      },
      {
        path: 'bookings/:id',
        loadComponent: () => import('./booking-detail/booking-detail').then((m) => m.BookingDetailComponent),
        data: { title: 'Réservation — NORTH PROD' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects').then((m) => m.ProductionProjectsComponent),
        data: { title: 'Projets — NORTH PROD' },
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./project-detail/project-detail').then((m) => m.ProductionProjectDetailComponent),
        data: { title: 'Projet — NORTH PROD' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
