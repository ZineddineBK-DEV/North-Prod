import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { BookingService } from '../../../core/services/booking.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../core/models/booking.model';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-artist-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [DashboardShellComponent, RouterLink],
})
export class ArtistDashboardComponent implements OnInit {
  authService   = inject(AuthService);
  bookingSvc    = inject(BookingService);
  projectSvc    = inject(ProjectService);
  notifSvc      = inject(NotificationService);

  bookings: Booking[] = [];
  projects: Project[] = [];
  loading = true;

  stats = { totalBookings: 0, activeProjects: 0, pendingBookings: 0, deliveredProjects: 0 };

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'fa fa-tachometer',   route: '/artist/dashboard' },
    { label: 'Réservations',    icon: 'fa fa-calendar',     route: '/artist/bookings'  },
    { label: 'Mes Projets',     icon: 'fa fa-music',        route: '/artist/projects'  },
    { label: 'Messages',        icon: 'fa fa-comments',     route: '/artist/messages'  },
    { label: 'Mon Profil',      icon: 'fa fa-user',         route: '/artist/profile'   },
  ];

  ngOnInit() {
    this.notifSvc.refreshCount();
    Promise.all([this.loadBookings(), this.loadProjects()]).finally(() => this.loading = false);
  }

  async loadBookings() {
    return new Promise<void>(resolve => {
      this.bookingSvc.getMyBookings({ limit: 5 }).subscribe({
        next: res => {
          this.bookings = res.bookings;
          this.stats.totalBookings   = res.total;
          this.stats.pendingBookings = res.bookings.filter(b => b.status === 'pending').length;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  async loadProjects() {
    return new Promise<void>(resolve => {
      this.projectSvc.getMyProjects({ limit: 5 }).subscribe({
        next: res => {
          this.projects = res.projects;
          this.stats.activeProjects    = res.projects.filter(p => p.stage !== 'delivered').length;
          this.stats.deliveredProjects = res.projects.filter(p => p.stage === 'delivered').length;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  getStatusClass(status: string) {
    const map: Record<string,string> = { pending:'pending', confirmed:'confirmed', rejected:'rejected', cancelled:'cancelled', completed:'delivered' };
    return map[status] || '';
  }
  getStatusLabel(status: string) {
    const map: Record<string,string> = { pending:'En attente', confirmed:'Confirmé', rejected:'Refusé', cancelled:'Annulé', completed:'Terminé' };
    return map[status] || status;
  }
  getStageLabel(stage: string) {
    const map: Record<string,string> = { pending:'En attente', recording:'Enregistrement', mixing:'Mixage', mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' };
    return map[stage] || stage;
  }
  formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }
}
