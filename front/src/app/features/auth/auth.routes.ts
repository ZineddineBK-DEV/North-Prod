import { Routes } from '@angular/router';

export const AuthRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
    data: { title: 'Connexion — NORTH PROD' },
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.RegisterComponent),
    data: { title: 'Créer un compte — NORTH PROD' },
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
    data: { title: 'Mot de passe oublié — NORTH PROD' },
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPasswordComponent),
    data: { title: 'Réinitialiser le mot de passe — NORTH PROD' },
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./verify-email/verify-email').then((m) => m.VerifyEmailComponent),
    data: { title: 'Vérification email — NORTH PROD' },
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
