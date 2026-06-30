import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-production-bookings',
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss'],
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
})
export class ProductionBookingsComponent implements OnInit {
  private svc = inject(BookingService);
  bookings: Booking[] = [];
  loading = true;
  filterStatus = 'pending';

  statusOptions = [
    { value:'pending',   label:'En attente' },
    { value:'confirmed', label:'Confirmées' },
    { value:'completed', label:'Terminées' },
    { value:'rejected',  label:'Refusées' },
    { value:'all',       label:'Toutes' },
  ];

  get filtered() {
    return this.filterStatus === 'all' ? this.bookings
      : this.bookings.filter(b => b.status === this.filterStatus);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAllBookings({ page: 1 }).subscribe({
      next: r => { this.bookings = r.bookings; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  confirm(id: string) {
    this.svc.updateStatus(id, 'confirmed').subscribe({ next: () => this.load() });
  }
getBookingCount(status: string): number {
  if (status === 'all') {
    return this.bookings.length;
  }

  return this.bookings.filter(b => b.status === status).length;
}
  reject(id: string) {
    const reason = prompt('Motif du refus (optionnel) :') ?? '';
    this.svc.updateStatus(id, 'rejected', reason).subscribe({ next: () => this.load() });
  }

  statusLabel(s: string) {
    return ({pending:'En attente',confirmed:'Confirmé',rejected:'Refusé',
             cancelled:'Annulé',completed:'Terminé'})[s] || s;
  }
  statusClass(s: string) {
    return ({pending:'badge-warn',confirmed:'badge-ok',rejected:'badge-err',
             cancelled:'badge-muted',completed:'badge-ok'})[s] || '';
  }
  typeLabel(t: string) {
    return ({record_hourly:'Record (Horaire)',record_forfait:'Record (Forfait)',
             location:'Location Studio',mix_mastering:'Mix & Master'})[t] || t;
  }
}
