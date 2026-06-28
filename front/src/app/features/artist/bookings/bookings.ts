import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingType } from '../../../core/models/booking.model';

@Component({
  selector: 'app-artist-bookings',
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss'],
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
})
export class ArtistBookingsComponent implements OnInit {
  private svc = inject(BookingService);
  private fb  = inject(FormBuilder);

  bookings: Booking[] = [];
  loading = true;
  showForm = false;
  submitting = false;
  submitMsg = '';
  submitErr = '';

  filterStatus = 'all';
  statusOptions = [
    { value:'all',       label:'Toutes' },
    { value:'pending',   label:'En attente' },
    { value:'confirmed', label:'Confirmées' },
    { value:'completed', label:'Terminées' },
    { value:'rejected',  label:'Refusées' },
  ];

  types: { value: BookingType; label: string; price: string }[] = [
    { value:'record_hourly',  label:'Séance Record (Horaire)', price:'60 DT/h' },
    { value:'record_forfait', label:'Record Forfait / Titre',  price:'150 DT/titre' },
    { value:'location',       label:'Location Studio',         price:'45 DT/h' },
    { value:'mix_mastering',  label:'Mixage & Mastering',      price:'200 DT/titre' },
  ];

  genres = ['Rap','Trap','R&B','Drill','Afrobeats','Pop','Rock','Électro','Reggae','Autre'];

  form = this.fb.group({
    type:        ['record_hourly', Validators.required],
    date:        ['', Validators.required],
    startTime:   ['', Validators.required],
    duration:    [2, [Validators.required, Validators.min(1)]],
    participants:[1],
    musicalGenre:[''],
    notes:       [''],
  });

  get filtered() {
    if (this.filterStatus === 'all') return this.bookings;
    return this.bookings.filter(b => b.status === this.filterStatus);
  }

  get minDate() {
    const d = new Date(); d.setDate(d.getDate()+1);
    return d.toISOString().split('T')[0];
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getMyBookings({ limit:50 }).subscribe({
      next: r => { this.bookings = r.bookings; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.submitErr = '';
    this.svc.createBooking(this.form.value as any).subscribe({
      next: () => {
        this.submitMsg = 'Réservation envoyée ! Notre équipe vous confirmera sous 24h.';
        this.submitting = false; this.showForm = false;
        this.form.reset({ type:'record_hourly', duration:2, participants:1 });
        this.load();
      },
      error: err => {
        this.submitErr = err.error?.message || 'Erreur lors de la réservation.';
        this.submitting = false;
      },
    });
  }

  cancel(id: string) {
    if (!confirm('Annuler cette réservation ?')) return;
    this.svc.cancelBooking(id).subscribe({ next: () => this.load() });
  }

  statusLabel(s: string) {
    return ({pending:'En attente',confirmed:'Confirmé',rejected:'Refusé',
             cancelled:'Annulé',completed:'Terminé'})[s]||s;
  }
  statusClass(s: string) {
    return ({pending:'badge-warn',confirmed:'badge-ok',rejected:'badge-err',
             cancelled:'badge-muted',completed:'badge-ok'})[s]||'';
  }
}
