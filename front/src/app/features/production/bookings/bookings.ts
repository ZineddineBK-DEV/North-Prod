import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { BookingService } from '../../../core/services/booking.service';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/production/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/production/bookings'  },
  { label:'Projets',         icon:'fa fa-music',      route:'/production/projects'  },
];

@Component({
  selector: 'app-production-bookings',
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss'],
  imports: [DashboardShellComponent, RouterLink],
})
export class ProductionBookingsComponent implements OnInit {
  private svc = inject(BookingService);
  navItems    = NAV;
  bookings: any[] = [];
  loading     = true;
  filterStatus = 'pending';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAllBookings({ status: this.filterStatus || undefined }).subscribe({
      next: res => { this.bookings = res.bookings; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  setFilter(s: string) { this.filterStatus = s; this.load(); }

  statusLabel(s: string) {
    return ({ pending:'En attente', confirmed:'Confirmé', rejected:'Refusé', cancelled:'Annulé', completed:'Terminé' } as any)[s] || s;
  }
  typeLabel(t: string) {
    return ({ record_hourly:'Séance Record', record_forfait:'Forfait/Titre', location:'Location Studio', mix_mastering:'Mixage/Mastering' } as any)[t] || t;
  }
  formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  }
}
