import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="production-page">
      <h2>Détail de la Réservation</h2>
      <p>Réservation ID : {{ bookingId }}</p>
      <a routerLink="../..">← Retour aux réservations</a>
    </div>
  `,
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  bookingId = '';

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
  }
}
