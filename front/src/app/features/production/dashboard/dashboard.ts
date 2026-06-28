import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { BookingService } from '../../../core/services/booking.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';

const NAV: NavItem[] = [
  { label: 'Tableau de bord', icon: 'fa fa-tachometer',   route: '/production/dashboard' },
  { label: 'Réservations',    icon: 'fa fa-calendar',     route: '/production/bookings'  },
  { label: 'Projets',         icon: 'fa fa-music',        route: '/production/projects'  },
];

@Component({
  selector: 'app-production-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [DashboardShellComponent, RouterLink],
})
export class ProductionDashboardComponent implements OnInit {
  private bookingSvc  = inject(BookingService);
  private projectSvc  = inject(ProjectService);
  notifSvc            = inject(NotificationService);

  navItems = NAV;
  loading  = true;

  stats = { pending: 0, confirmed: 0, activeProjects: 0, deliveredToday: 0 };
  pendingBookings: any[] = [];
  activeProjects: any[]  = [];

  ngOnInit() {
    this.notifSvc.refreshCount();
    Promise.all([this.loadBookings(), this.loadProjects()])
      .finally(() => (this.loading = false));
  }

  async loadBookings() {
    return new Promise<void>(resolve => {
      this.bookingSvc.getAllBookings({ status: 'pending' }).subscribe({
        next: res => {
          this.pendingBookings = res.bookings.slice(0, 6);
          this.stats.pending   = res.total;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  async loadProjects() {
    return new Promise<void>(resolve => {
      this.projectSvc.getMyProjects().subscribe({
        next: res => {
          this.activeProjects         = res.projects.slice(0, 6);
          this.stats.activeProjects   = res.projects.filter((p: any) => p.stage !== 'delivered').length;
          this.stats.deliveredToday   = res.projects.filter((p: any) => p.stage === 'delivered').length;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  statusLabel(s: string) {
    return ({ pending:'En attente', confirmed:'Confirmé', rejected:'Refusé', cancelled:'Annulé' } as any)[s] || s;
  }
  stageLabel(s: string) {
    return ({ pending:'En attente', recording:'Enregistrement', mixing:'Mixage', mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' } as any)[s] || s;
  }
  stageColor(s: string) {
    return ({ pending:'#888', recording:'#3498db', mixing:'#9b59b6', mastering:'#e67e22', finalization:'#f1c40f', delivered:'#2ecc71' } as any)[s] || '#888';
  }
  formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
}
