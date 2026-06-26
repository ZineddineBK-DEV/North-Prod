import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-artist-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="artist-page">
      <h2>Mon Espace — NORTH PROD</h2>
      <p>Bienvenue, {{ auth.currentUser()?.aka || auth.currentUser()?.firstName }}.</p>
      <nav>
        <a routerLink="../bookings">Mes Réservations</a>
        <a routerLink="../projects">Mes Projets</a>
        <a routerLink="../messages">Messages</a>
        <a routerLink="../profile">Mon Profil</a>
      </nav>
    </div>
  `,
})
export class ArtistDashboardComponent {
  auth = inject(AuthService);
}
