import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-production-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="production-page">
      <h2>Tableau de bord — Équipe Production</h2>
      <p>Gérez les réservations et le suivi des projets des artistes.</p>
      <nav>
        <a routerLink="../bookings">Réservations</a>
        <a routerLink="../projects">Projets</a>
      </nav>
    </div>
  `,
})
export class ProductionDashboardComponent {}
