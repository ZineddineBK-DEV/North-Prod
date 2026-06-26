import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artist-messages',
  imports: [CommonModule],
  template: `
    <div class="artist-page">
      <h2>Messages</h2>
      <p>Échangez en temps réel avec l'équipe de production de NORTH PROD.</p>
    </div>
  `,
})
export class ArtistMessagesComponent {}
