import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-production-projects',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="production-page">
      <h2>Projets</h2>
      <p>Suivez et mettez à jour l'avancement des projets de tous les artistes.</p>
    </div>
  `,
})
export class ProductionProjectsComponent {}
