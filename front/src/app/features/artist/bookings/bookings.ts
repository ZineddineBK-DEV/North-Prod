import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingType } from '../../../core/models/booking.model';

const BOOKING_TYPES: { value: BookingType; label: string; price: number; unit: string }[] = [
  { value: 'record_hourly',  label: 'Séance Record',       price: 99,  unit: 'heure' },
  { value: 'record_forfait', label: 'Forfait / Titre',      price: 120, unit: 'titre' },
  { value: 'location',       label: 'Location Studio',      price: 190, unit: 'heure' },
  { value: 'mix_mastering',  label: 'Mixage / Mastering',   price: 80,  unit: 'track' },
];

const GENRES = ['Rap','Trap','Drill','LoFi','R&B','Afrobeats','Pop','Rock','Autre'];

@Component({
  selector: 'app-artist-bookings',
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss'],
  imports: [DashboardShellComponent, ReactiveFormsModule],
})
export class ArtistBookingsComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private svc  = inject(BookingService);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'fa fa-tachometer', route: '/artist/dashboard' },
    { label: 'Réservations',    icon: 'fa fa-calendar',   route: '/artist/bookings'  },
    { label: 'Mes Projets',     icon: 'fa fa-music',      route: '/artist/projects'  },
    { label: 'Messages',        icon: 'fa fa-comments',   route: '/artist/messages'  },
    { label: 'Mon Profil',      icon: 'fa fa-user',       route: '/artist/profile'   },
  ];

  types    = BOOKING_TYPES;
  genres   = GENRES;
  bookings: Booking[] = [];
  loading  = true;
  showForm = signal(false);
  submitting = false;
  formError  = '';
  formSuccess = '';
  filterStatus = '';

  form = this.fb.group({
    type:         ['record_hourly', Validators.required],
    date:         ['', Validators.required],
    startTime:    ['', Validators.required],
    duration:     [1, [Validators.required, Validators.min(0.5)]],
    participants: [1],
    musicalGenre: [''],
    notes:        [''],
  });

  get selectedType() { return this.types.find(t => t.value === this.form.value.type); }
  get estimatedPrice() { const t = this.selectedType; return t ? t.price * (this.form.value.duration || 1) : 0; }
  get minDate() { return new Date().toISOString().split('T')[0]; }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params = this.filterStatus ? { status: this.filterStatus } : {};
    this.svc.getMyBookings(params).subscribe({
      next: res => { this.bookings = res.bookings; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true; this.formError = ''; this.formSuccess = '';
    this.svc.createBooking(this.form.value as any).subscribe({
      next: res => {
        this.submitting = false;
        this.formSuccess = res.message;
        this.form.reset({ type:'record_hourly', duration:1, participants:1 });
        this.showForm.set(false);
        this.load();
      },
      error: err => { this.submitting = false; this.formError = err.error?.message || 'Erreur lors de la réservation.'; },
    });
  }

  cancel(id: string) {
    if (!confirm('Confirmer l\'annulation ?')) return;
    this.svc.cancelBooking(id).subscribe({ next: () => this.load() });
  }

  setFilter(s: string) { this.filterStatus = s; this.load(); }
  statusLabel(s: string) { return { pending:'En attente', confirmed:'Confirmé', rejected:'Refusé', cancelled:'Annulé', completed:'Terminé' }[s] || s; }
  formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); }
}
