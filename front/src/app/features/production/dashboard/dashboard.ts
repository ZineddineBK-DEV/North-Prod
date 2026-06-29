import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ProjectService } from '../../../core/services/project.service';
import { Booking } from '../../../core/models/booking.model';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-production-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule, RouterLink, DatePipe],
})
export class ProductionDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private bookingSvc = inject(BookingService);
  private projectSvc = inject(ProjectService);

  bookings: Booking[] = [];
  projects: Project[] = [];
  loadingB = true;
  loadingP = true;

  get user() { return this.auth.currentUser()!; }

  get pendingBookings()    { return this.bookings.filter(b => b.status === 'pending'); }
  get confirmedToday()     {
    const today = new Date().toISOString().split('T')[0];
    return this.bookings.filter(b => b.status === 'confirmed' && b.date?.startsWith(today));
  }
  get activeProjects()     { return this.projects.filter(p => p.stage !== 'delivered'); }
  get recentPending()      { return this.pendingBookings.slice(0, 5); }
  get recentProjects()     { return this.activeProjects.slice(0, 5); }

  ngOnInit() {
    this.bookingSvc.getAllBookings({ status: 'pending' }).subscribe({
      next: r => { this.bookings = r.bookings; this.loadingB = false; },
      error: () => { this.loadingB = false; },
    });
    this.projectSvc.getMyProjects().subscribe({
      next: r => { this.projects = r.projects; this.loadingP = false; },
      error: () => { this.loadingP = false; },
    });
  }

  stageLabel(s: string) {
    return ({pending:'En attente',recording:'Enregistrement',mixing:'Mixage',
             mastering:'Mastering',finalization:'Finalisation',delivered:'Livré'})[s] || s;
  }
  stageColor(s: string) {
    return ({pending:'#888',recording:'#3498db',mixing:'#9b59b6',
             mastering:'#e67e22',finalization:'#f39c12',delivered:'#2ecc71'})[s] || '#888';
  }
}
