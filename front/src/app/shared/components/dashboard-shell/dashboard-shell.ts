import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

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
export class DashboardShellComponent implements OnInit, OnDestroy {
  auth         = inject(AuthService);
  notifService = inject(NotificationService);
  private socketSvc = inject(SocketService);
  private router = inject(Router);
  private elRef   = inject(ElementRef);

  sidebarOpen   = false;
  userMenuOpen  = false;
  notifOpen     = false;
  notifications: Notification[] = [];
  notifsLoading = false;
  routerLoading = false;
  private routerSub = new Subscription();

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
        { path: '/admin/messages',  label: 'Messages',        icon: 'fa-comments' },
      ];
    }
    if (this.auth.isProduction()) {
      return [
        { path: '/production/dashboard', label: 'Tableau de bord', icon: 'fa-th-large' },
        { path: '/production/bookings',  label: 'Réservations',    icon: 'fa-calendar' },
        { path: '/production/projects',  label: 'Projets',         icon: 'fa-music' },
        { path: '/production/messages',  label: 'Messages',        icon: 'fa-comments' },
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
      this.socketSvc.connect();
      // Real-time notification counter update
      this.routerSub.add(
        this.socketSvc.notification$.subscribe(() => {
          this.notifService.unreadCount.set(this.notifService.unreadCount() + 1);
        })
      );
    }
    this.routerSub = this.router.events.subscribe(e => {
      if (e instanceof NavigationStart)   { this.routerLoading = true; }
      if (e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError)   { this.routerLoading = false; }
    });
  }

  ngOnDestroy() { this.routerSub.unsubscribe(); }

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

  /** Section 6: notification click → navigate + mark read + close */
  navigateNotification(n: Notification) {
    this.notifOpen = false;
    if (!n.isRead) {
      this.notifService.markAsRead(n._id).subscribe();
      n = { ...n, isRead: true };
      this.notifications = this.notifications.map(x => x._id === n._id ? n : x);
      const current = this.notifService.unreadCount();
      if (current > 0) this.notifService.unreadCount.set(current - 1);
    }
    const route = this.notifRoute(n);
    if (route) this.router.navigateByUrl(route);
  }

  private notifRoute(n: Notification): string | null {
    if (n.link) return n.link;
    const role = this.auth.isAdmin() ? 'admin' : this.auth.isProduction() ? 'production' : 'artist';
    switch (n.type as NotificationType) {
      case 'message_received':                return `/${role}/messages`;
      case 'booking_pending':
      case 'booking_confirmed':
      case 'booking_rejected':
      case 'booking_reminder':  return n.resourceId ? `/${role}/bookings` : `/${role}/bookings`;
      case 'project_updated':
      case 'project_delivered': return n.resourceId ? `/${role}/projects` : `/${role}/projects`;
      case 'file_uploaded':     return `/${role}/projects`;
      default:                  return null;
    }
  }

  logout() {
    this.closeSidebar();
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
