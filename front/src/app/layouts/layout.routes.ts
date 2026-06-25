import { Routes } from '@angular/router';

export const Layout: Routes = [
  {
    path: '',
    loadComponent: () => import('./music/music').then((m) => m.Music),
    data: { title: 'NORTH PROD — Studio de Production Son & Image' },
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./music/music').then((m) => m.Music),
    data: { title: 'Portfolio — NORTH PROD', section: 'portfolio' },
  },
  {
    path: 'services',
    loadComponent: () => import('./music/music').then((m) => m.Music),
    data: { title: 'Services & Tarifs — NORTH PROD', section: 'services' },
  },
  {
    path: 'studio',
    loadComponent: () => import('./music/music').then((m) => m.Music),
    data: { title: 'Le Studio — NORTH PROD', section: 'studio' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./music/music').then((m) => m.Music),
    data: { title: 'Contact — NORTH PROD', section: 'contact' },
  },
];
