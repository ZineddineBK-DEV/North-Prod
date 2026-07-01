import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule, RouterLink, DatePipe],
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  stats = { totalUsers:0, totalArtists:0, totalBookings:0, pendingBookings:0,
            totalProjects:0, activeProjects:0, revenue:0 };
  recentBookings: any[] = [];
  recentUsers:    any[] = [];
  loading = true;

  ngOnInit() {
    // One call — backend returns stats + recentUsers + pendingBookingsList
    this.http.get<any>(`${environment.apiUrl}/admin/stats`).subscribe({
      next: r => {
        const s = r.stats;
        this.stats = {
          totalUsers:     s.users?.total      || 0,
          totalArtists:   s.users?.artists    || 0,
          totalBookings:  s.bookings?.total   || 0,
          pendingBookings:s.bookings?.pending  || 0,
          totalProjects:  s.projects?.total   || 0,
          activeProjects: s.projects?.active  || 0,
          revenue:        s.revenue?.thisMonth|| 0,
        };
        this.recentUsers    = r.recentUsers          || [];
        this.recentBookings = r.pendingBookingsList   || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
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
  roleLabel(r: string) { return ({artist:'Artiste',production:'Production',admin:'Admin'})[r] || r; }
  roleClass(r: string) { return ({artist:'badge-ok',production:'badge-blue',admin:'badge-gold'})[r] || ''; }
}
