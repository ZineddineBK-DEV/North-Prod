import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

export interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-dashboard-shell',
  templateUrl: './dashboard-shell.html',
  styleUrls: ['./dashboard-shell.scss'],
  imports: [RouterLink, RouterLinkActive],
})
export class DashboardShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() title = 'Mon Espace';

  authService  = inject(AuthService);
  notifService = inject(NotificationService);
  sidebarOpen  = false;

  logout() { this.authService.logout(); }
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
}
