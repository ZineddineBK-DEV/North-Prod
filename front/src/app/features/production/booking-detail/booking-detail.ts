import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { BookingService } from '../../../core/services/booking.service';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/production/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/production/bookings'  },
  { label:'Projets',         icon:'fa fa-music',      route:'/production/projects'  },
];

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.html',
  styleUrls: ['./booking-detail.scss'],
  imports: [DashboardShellComponent, RouterLink, ReactiveFormsModule],
})
export class BookingDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private svc    = inject(BookingService);
  private fb     = inject(FormBuilder);

  navItems   = NAV;
  booking: any = null;
  loading    = true;
  processing = false;
  error      = '';
  success    = '';
  showReject = false;

  rejectForm = this.fb.group({
    reason: ['', Validators.required],
  });

  ngOnInit() {
    this.route.params.subscribe(p => this.load(p['id']));
  }

  load(id: string) {
    this.loading = true;
    this.svc.getBooking(id).subscribe({
      next: res => { this.booking = res.booking; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  confirm() {
    if (!this.booking || this.processing) return;
    this.processing = true; this.error = '';
    this.svc.updateStatus(this.booking._id, 'confirmed').subscribe({
      next: res => {
        this.booking   = res.booking;
        this.success   = 'Réservation confirmée. Un projet a été créé automatiquement.';
        this.processing = false;
      },
      error: err => { this.error = err.error?.message || 'Erreur.'; this.processing = false; },
    });
  }

  reject() {
    if (this.rejectForm.invalid || !this.booking) return;
    this.processing = true; this.error = '';
    this.svc.updateStatus(this.booking._id, 'rejected', this.rejectForm.value.reason!).subscribe({
      next: res => {
        this.booking    = res.booking;
        this.success    = 'Réservation refusée. L\'artiste a été notifié.';
        this.processing = false;
        this.showReject = false;
      },
      error: err => { this.error = err.error?.message || 'Erreur.'; this.processing = false; },
    });
  }

  typeLabel(t: string) {
    return ({ record_hourly:'Séance Record (Horaire)', record_forfait:'Forfait/Titre', location:'Location Studio', mix_mastering:'Mixage/Mastering' } as any)[t] || t;
  }
  statusLabel(s: string) {
    return ({ pending:'En attente', confirmed:'Confirmé', rejected:'Refusé', cancelled:'Annulé' } as any)[s] || s;
  }
  formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  formatDateTime(d: string) {
    return new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
