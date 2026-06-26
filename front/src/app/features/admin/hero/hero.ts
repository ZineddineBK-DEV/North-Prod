import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-hero',
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2>Gestion du Hero Media</h2>
      <p>Gérez la vidéo publicitaire et le contenu de la section hero de la page d'accueil.</p>
    </div>
  `,
})
export class AdminHeroComponent {}
