import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SocketService } from '../../../core/services/socket.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

export interface ShellNavItem { path: string; label: string; icon: string; }

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
  private socket = inject(SocketService);
  private router = inject(Router);
  private elRef  = inject(ElementRef);

  sidebarOpen   = false;
  userMenuOpen  = false;
  notifOpen     = false;
  notifications: Notification[] = [];
  notifsLoading = false;
  routerLoading = false;
  private subs  = new Subscription();

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
      // Connect socket and subscribe to real-time notifications
      this.socket.connect();
      this.subs.add(
        this.socket.notification$.subscribe((notif: Notification) => {
          // Prepend to list if panel is open (avoid duplicates by id)
          if (!this.notifications.find(n => n._id === notif._id)) {
            this.notifications = [notif, ...this.notifications];
          }
          // Increment unread counter
          this.notifService.unreadCount.update(c => c + 1);
        })
      );
    }

    // Router loading indicator
    this.subs.add(
      this.router.events.subscribe(e => {
        if (e instanceof NavigationStart)                                                        { this.routerLoading = true; }
        if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) { this.routerLoading = false; }
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
    if (this.notifOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  loadNotifications() {
    this.notifsLoading = true;
    this.notifService.getNotifications({ page: 1 }).subscribe({
      next: res => { this.notifications = res.notifications; this.notifsLoading = false; },
      error: ()  => { this.notifsLoading = false; },
    });
  }

  markAllRead(e: MouseEvent) {
    e.stopPropagation();
    this.notifService.markAllAsRead().subscribe();
    this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
  }

  /** Click → navigate to resource + mark read + close panel */
  navigateNotification(n: Notification) {
    this.notifOpen = false;
    if (!n.isRead) {
      this.notifService.markAsRead(n._id).subscribe();
      // Optimistic update
      this.notifications = this.notifications.map(x =>
        x._id === n._id ? { ...x, isRead: true } : x
      );
      const cur = this.notifService.unreadCount();
      if (cur > 0) this.notifService.unreadCount.set(cur - 1);
    }
    const route = this.resolveRoute(n);
    if (route) this.router.navigateByUrl(route);
  }

  /**
   * Resolve the correct route for a notification.
   * Priority: n.link (set by backend) → type-based fallback.
   * n.link is already role-correct because the backend now uses messageLinkForRole().
   */
  private resolveRoute(n: Notification): string | null {
    if (n.link) return n.link;
    // Fallback (older notifications without link field)
    const role = this.auth.isAdmin() ? 'admin'
               : this.auth.isProduction() ? 'production' : 'artist';
    switch (n.type as NotificationType) {
      case 'message_received':  return `/${role}/messages`;
      case 'booking_pending':   return `/production/bookings`;
      case 'booking_confirmed':
      case 'booking_rejected':
      case 'booking_reminder':  return `/${role}/bookings`;
      case 'project_updated':
      case 'project_delivered': return `/${role}/projects`;
      case 'file_uploaded':     return `/${role}/projects`;
      default:                  return `/${role}/dashboard`;
    }
  }

  logout() {
    this.closeSidebar();
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
