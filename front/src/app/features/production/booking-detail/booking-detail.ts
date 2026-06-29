import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.html',
  styleUrls: ['./booking-detail.scss'],
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
})
export class BookingDetailComponent implements OnInit {
  private svc   = inject(BookingService);
  private route = inject(ActivatedRoute);
  private fb    = inject(FormBuilder);

  booking: Booking | null = null;
  loading = true;
  saving  = false;
  msg     = '';
  err     = '';

  rejectForm = this.fb.group({ reason: [''] });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getBooking(id).subscribe({
      next: r => { this.booking = r.booking; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  confirm() {
    if (!this.booking) return;
    this.saving = true;
    this.svc.updateStatus(this.booking._id, 'confirmed').subscribe({
      next: r => { this.booking = r.booking; this.saving = false; this.msg = 'Réservation confirmée !'; },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  reject() {
    if (!this.booking) return;
    this.saving = true;
    this.svc.updateStatus(this.booking._id, 'rejected', this.rejectForm.value.reason || '').subscribe({
      next: r => { this.booking = r.booking; this.saving = false; this.msg = 'Réservation refusée.'; },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
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
    return ({record_hourly:'Séance Record (Horaire)',record_forfait:'Record Forfait/Titre',
             location:'Location Studio',mix_mastering:'Mixage & Mastering'})[t] || t;
  }
}
