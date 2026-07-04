import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavService } from '../../../shared/service/nav.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../core/models/notification.model';

@Component({
  selector: 'app-music-nav',
  templateUrl: './music-nav.html',
  styleUrls: ['./music-nav.scss'],
  imports: [RouterLink, RouterLinkActive, CommonModule],
})
export class MusicNav implements OnInit, OnDestroy {
  navService   = inject(NavService);
  authService  = inject(AuthService);
  notifService = inject(NotificationService);
  private router = inject(Router);
  private elRef  = inject(ElementRef);

  menuItems    = this.navService.MENUITEMS;
  isScrolled   = false;
  mobileOpen   = false;
  userMenuOpen = false;
  notifOpen    = false;
  notifications: Notification[] = [];
  notifsLoading = false;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.notifService.refreshCount();
    }
  }

  ngOnDestroy() {}

  @HostListener('window:scroll')
  onScroll() { this.isScrolled = window.scrollY > 50; }

  /** Close dropdowns when clicking outside the navbar */
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.userMenuOpen = false;
      this.notifOpen    = false;
    }
  }

  toggleMobile()  { this.mobileOpen = !this.mobileOpen; }
  closeMobile()   { this.mobileOpen = false; }

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

  navigateNotification(n: Notification) {
    this.notifOpen = false;
    if (!n.isRead) {
      this.notifService.markAsRead(n._id).subscribe();
      this.notifications = this.notifications.map(x =>
        x._id === n._id ? { ...x, isRead: true } : x
      );
      const cur = this.notifService.unreadCount();
      if (cur > 0) this.notifService.unreadCount.set(cur - 1);
    }
    const route = this.resolveNotifRoute(n);
    if (route) this.router.navigateByUrl(route);
  }

  private resolveNotifRoute(n: Notification): string | null {
    if (n.link) return n.link;
    switch (n.type as NotificationType) {
      case 'message_received':  return '/artist/messages';
      case 'booking_confirmed':
      case 'booking_rejected':
      case 'booking_reminder':  return '/artist/bookings';
      case 'project_updated':
      case 'project_delivered': return '/artist/projects';
      default:                  return '/artist/dashboard';
    }
  }

  logout() {
    this.closeMobile();
    this.userMenuOpen = false;
    this.authService.logout();
  }
}
