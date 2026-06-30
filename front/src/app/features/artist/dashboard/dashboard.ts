import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking } from '../../../core/models/booking.model';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-artist-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule, RouterLink, DatePipe, TitleCasePipe],
})
export class ArtistDashboardComponent implements OnInit {
  auth    = inject(AuthService);
  private bookingSvc = inject(BookingService);
  private projectSvc = inject(ProjectService);
  notifSvc= inject(NotificationService);

  bookings: Booking[] = [];
  projects: Project[] = [];
  loadingBookings = true;
  loadingProjects = true;

  get user() { return this.auth.currentUser()!; }

  get upcomingBookings() {
    return this.bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 3);
  }
  get activeProjects() {
    return this.projects.filter(p => p.stage !== 'delivered').slice(0, 3);
  }
  get stats() {
    return {
      totalBookings:    this.bookings.length,
      confirmedBookings:this.bookings.filter(b=>b.status==='confirmed').length,
      activeProjects:   this.projects.filter(p=>p.stage!=='delivered').length,
      deliveredProjects:this.projects.filter(p=>p.stage==='delivered').length,
    };
  }

  ngOnInit() {
    this.bookingSvc.getMyBookings({ limit: 20 }).subscribe({
      next: r => { this.bookings = r.bookings; this.loadingBookings = false; },
      error: () => { this.loadingBookings = false; },
    });
    this.projectSvc.getMyProjects().subscribe({
      next: r => { this.projects = r.projects; this.loadingProjects = false; },
      error: () => { this.loadingProjects = false; },
    });
  }

  statusLabel(s: string) {
    return ({ pending:'En attente', confirmed:'Confirmé', rejected:'Refusé',
              cancelled:'Annulé', completed:'Terminé' })[s] || s;
  }
  statusClass(s: string) {
    return ({ pending:'badge-warn', confirmed:'badge-ok', rejected:'badge-err',
              cancelled:'badge-muted', completed:'badge-ok' })[s] || '';
  }
  stageLabel(s: string) {
    return ({ pending:'En attente', recording:'Enregistrement', mixing:'Mixage',
              mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' })[s] || s;
  }
}
