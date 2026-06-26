import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-production-bookings',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="production-page">
      <h2>Réservations</h2>
      <p>Consultez, validez ou refusez les demandes de réservation des artistes.</p>
    </div>
  `,
})
export class ProductionBookingsComponent {}
