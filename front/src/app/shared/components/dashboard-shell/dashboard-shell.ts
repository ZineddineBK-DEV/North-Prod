import { Component, OnInit, HostListener, inject, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

export interface ShellNavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  templateUrl: './dashboard-shell.html',
  styleUrls: ['./dashboard-shell.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
})
export class DashboardShellComponent implements OnInit {
  auth         = inject(AuthService);
  notifService = inject(NotificationService);
  private router = inject(Router);
  private elRef   = inject(ElementRef);

  sidebarOpen  = false;
  userMenuOpen = false;
  notifOpen    = false;
  notifications: Notification[] = [];
  notifsLoading = false;

  roleLabel = computed(() => {
    if (this.auth.isAdmin())      return 'Administration';
    if (this.auth.isProduction()) return 'Équipe Production';
    return 'Espace Artiste';
  });

  navItems = computed<ShellNavItem[]>(() => {
    if (this.auth.isAdmin()) {
      return [
        { path: '/admin/dashboard', label: 'Tableau de bord', icon: 'fa-th-large' },
        { path: '/admin/users',     label: 'Utilisateurs',    icon: 'fa-users' },
        { path: '/admin/portfolio', label: 'Portfolio',       icon: 'fa-image' },
        { path: '/admin/services',  label: 'Services & Tarifs', icon: 'fa-list' },
        { path: '/admin/hero',      label: 'Hero Média',      icon: 'fa-film' },
      ];
    }
    if (this.auth.isProduction()) {
      return [
        { path: '/production/dashboard', label: 'Tableau de bord', icon: 'fa-th-large' },
        { path: '/production/bookings',  label: 'Réservations',    icon: 'fa-calendar' },
        { path: '/production/projects',  label: 'Projets',         icon: 'fa-music' },
      ];
    }
    return [
      { path: '/artist/dashboard', label: 'Mon Espace',     icon: 'fa-th-large' },
      { path: '/artist/bookings',  label: 'Réservations',   icon: 'fa-calendar' },
      { path: '/artist/projects',  label: 'Mes Projets',    icon: 'fa-music' },
      { path: '/artist/messages',  label: 'Messages',       icon: 'fa-comments' },
      { path: '/artist/profile',   label: 'Mon Profil',     icon: 'fa-user' },
    ];
  });

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.notifService.refreshCount();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.userMenuOpen = false;
      this.notifOpen    = false;
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar()  { this.sidebarOpen = false; }

  toggleUserMenu(e: MouseEvent) {
    e.stopPropagation();
    this.notifOpen = false;
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleNotifications(e: MouseEvent) {
    e.stopPropagation();
    this.userMenuOpen = false;
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notifsLoading = true;
    this.notifService.getNotifications({ page: 1 }).subscribe({
      next: (res) => {
        this.notifications = res.notifications;
        this.notifsLoading = false;
      },
      error: () => { this.notifsLoading = false; },
    });
  }

  markAllRead(e: MouseEvent) {
    e.stopPropagation();
    this.notifService.markAllAsRead().subscribe();
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
  }

  logout() {
    this.closeSidebar();
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
