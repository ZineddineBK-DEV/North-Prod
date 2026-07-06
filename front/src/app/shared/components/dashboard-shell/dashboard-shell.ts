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
  private router    = inject(Router);
  private elRef     = inject(ElementRef);

  sidebarOpen   = false;
  userMenuOpen  = false;
  notifOpen     = false;
  notifications: Notification[] = [];
  notifsLoading = false;
  routerLoading = false;

  // Single Subscription bag — never overwritten
  private subs = new Subscription();

  roleLabel = computed(() => {
    if (this.auth.isAdmin())      return 'Administration';
    if (this.auth.isProduction()) return 'Équipe Production';
    return 'Espace Artiste';
  });

  navItems = computed<ShellNavItem[]>(() => {
    if (this.auth.isAdmin()) {
      return [
        { path: '/admin/dashboard', label: 'Tableau de bord',  icon: 'fa-th-large' },
        { path: '/admin/users',     label: 'Utilisateurs',     icon: 'fa-users' },
        { path: '/admin/portfolio', label: 'Portfolio',        icon: 'fa-image' },
        { path: '/admin/services',  label: 'Services & Tarifs',icon: 'fa-list' },
        { path: '/admin/hero',      label: 'Hero Média',       icon: 'fa-film' },
        { path: '/admin/messages',  label: 'Messages',         icon: 'fa-comments' },
      ];
    }
    if (this.auth.isProduction()) {
      return [
        { path: '/production/dashboard', label: 'Tableau de bord', icon: 'fa-th-large' },
        { path: '/production/bookings',  label: 'Réservations',   icon: 'fa-calendar' },
        { path: '/production/projects',  label: 'Projets',        icon: 'fa-music' },
        { path: '/production/messages',  label: 'Messages',       icon: 'fa-comments' },
      ];
    }
    return [
      { path: '/artist/dashboard', label: 'Mon Espace',   icon: 'fa-th-large' },
      { path: '/artist/bookings',  label: 'Réservations', icon: 'fa-calendar' },
      { path: '/artist/projects',  label: 'Mes Projets',  icon: 'fa-music' },
      { path: '/artist/messages',  label: 'Messages',     icon: 'fa-comments' },
      { path: '/artist/profile',   label: 'Mon Profil',   icon: 'fa-user' },
    ];
  });

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.notifService.refreshCount();
      this.socketSvc.connect();

      // Real-time notification badge update via socket
      this.subs.add(
        this.socketSvc.notification$.subscribe(() => {
          // Use authoritative HTTP count to avoid race with other increment paths
          this.notifService.refreshCount();
          if (this.notifOpen) this.loadNotifications();
        })
      );
    }

    // Page-transition loading bar
    this.subs.add(
      this.router.events.subscribe(e => {
        if (e instanceof NavigationStart)                                            this.routerLoading = true;
        if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) this.routerLoading = false;
      })
    );
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

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
    if (this.notifOpen) this.loadNotifications();
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

  navigateNotification(n: Notification) {
    this.notifOpen = false;

    // Mark as read immediately (optimistic)
    if (!n.isRead) {
      this.notifService.markAsRead(n._id).subscribe();
      this.notifications = this.notifications.map(x =>
        x._id === n._id ? { ...x, isRead: true } : x
      );
      const c = this.notifService.unreadCount();
      if (c > 0) this.notifService.unreadCount.set(c - 1);
    }

    const route = this.resolveNotifRoute(n);
    if (route) this.router.navigateByUrl(route);
  }

  private resolveNotifRoute(n: Notification): string | null {
    // Always use the stored link if present — it was set role-aware by the backend
    if (n.link) return n.link;

    // Fallback: derive from type using current user's role
    const role = this.auth.isAdmin() ? 'admin'
               : this.auth.isProduction() ? 'production'
               : 'artist';

    switch (n.type as NotificationType) {
      case 'message_received':                      return `/${role}/messages`;
      case 'booking_pending':
      case 'booking_confirmed':
      case 'booking_rejected':
      case 'booking_reminder':                      return `/${role}/bookings`;
      case 'project_updated':
      case 'project_delivered':
      case 'file_uploaded':                         return `/${role}/projects`;
      default:                                      return null;
    }
  }

  logout() {
    this.closeSidebar();
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
