import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavService } from '../../../shared/service/nav.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

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

  logout() {
    this.closeMobile();
    this.userMenuOpen = false;
    this.authService.logout();
  }
}
