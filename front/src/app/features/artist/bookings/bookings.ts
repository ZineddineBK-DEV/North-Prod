import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artist-bookings',
  imports: [CommonModule],
  template: `
    <div class="artist-page">
      <h2>Mes Réservations</h2>
      <p>Consultez et gérez vos réservations de séances studio.</p>
    </div>
  `,
})
export class ArtistBookingsComponent {}
