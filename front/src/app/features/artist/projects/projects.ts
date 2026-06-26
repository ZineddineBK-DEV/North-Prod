import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artist-projects',
  imports: [CommonModule],
  template: `
    <div class="artist-page">
      <h2>Mes Projets</h2>
      <p>Suivez l'avancement de vos projets en cours et consultez vos productions terminées.</p>
    </div>
  `,
})
export class ArtistProjectsComponent {}
