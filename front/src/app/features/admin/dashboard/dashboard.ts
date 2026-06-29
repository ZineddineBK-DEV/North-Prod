import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ProjectService } from '../../../core/services/project.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule, RouterLink, DatePipe],
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private http       = inject(HttpClient);
  private bookingSvc = inject(BookingService);
  private projectSvc = inject(ProjectService);

  stats = { totalUsers:0, totalArtists:0, totalBookings:0, pendingBookings:0,
            totalProjects:0, activeProjects:0, revenue:0 };

  recentBookings: any[] = [];
  recentUsers:    any[] = [];
  loading = true;

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/stats`).subscribe({
      next: r => { this.stats = r.stats; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.bookingSvc.getAllBookings({ page: 1 }).subscribe({
      next: r => { this.recentBookings = r.bookings.slice(0, 5); },
    });
    this.http.get<any>(`${environment.apiUrl}/admin/users?limit=5`).subscribe({
      next: r => { this.recentUsers = r.users; },
    });
  }

  statusClass(s: string) {
    return ({pending:'badge-warn',confirmed:'badge-ok',rejected:'badge-err',
             cancelled:'badge-muted',completed:'badge-ok'})[s] || '';
  }
  statusLabel(s: string) {
    return ({pending:'En attente',confirmed:'Confirmé',rejected:'Refusé',
             cancelled:'Annulé',completed:'Terminé'})[s] || s;
  }
  roleLabel(r: string) {
    return ({artist:'Artiste',production:'Production',admin:'Admin'})[r] || r;
  }
  roleClass(r: string) {
    return ({artist:'badge-ok',production:'badge-blue',admin:'badge-gold'})[r] || '';
  }
}
