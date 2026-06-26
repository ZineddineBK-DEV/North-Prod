import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2>Tableau de bord — Administration</h2>
      <p>Bienvenue dans le panneau d'administration de NORTH PROD.</p>
    </div>
  `,
})
export class AdminDashboardComponent {}
