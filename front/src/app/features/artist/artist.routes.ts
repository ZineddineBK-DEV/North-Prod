import { Routes } from '@angular/router';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell';

export const ArtistRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.ArtistDashboardComponent),
        data: { title: 'Mon Espace — NORTH PROD' },
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/bookings').then((m) => m.ArtistBookingsComponent),
        data: { title: 'Mes Réservations — NORTH PROD' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects').then((m) => m.ArtistProjectsComponent),
        data: { title: 'Mes Projets — NORTH PROD' },
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./project-detail/project-detail').then((m) => m.ProjectDetailComponent),
        data: { title: 'Projet — NORTH PROD' },
      },
      {
        path: 'messages',
        loadComponent: () => import('./messages/messages').then((m) => m.ArtistMessagesComponent),
        data: { title: 'Messages — NORTH PROD' },
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((m) => m.ArtistProfileComponent),
        data: { title: 'Mon Profil — NORTH PROD' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
