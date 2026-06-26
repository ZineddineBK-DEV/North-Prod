import { Component, OnInit, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavService } from '../../../shared/service/nav.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-music-nav',
  templateUrl: './music-nav.html',
  styleUrls: ['./music-nav.scss'],
  imports: [RouterLink, RouterLinkActive],
})
export class MusicNav implements OnInit {
  navService   = inject(NavService);
  authService  = inject(AuthService);
  notifService = inject(NotificationService);

  menuItems  = this.navService.MENUITEMS;
  isScrolled = false;
  mobileOpen = false;
  userMenuOpen = false;
  notifOpen = false;

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.notifService.refreshCount();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobile() { this.mobileOpen = !this.mobileOpen; }
  closeMobile()  { this.mobileOpen = false; }
  toggleUserMenu()  { this.userMenuOpen = !this.userMenuOpen; }
  closeUserMenu()   { this.userMenuOpen = false; }
  toggleNotifications() { this.notifOpen = !this.notifOpen; }

  logout() {
    this.closeMobile();
    this.closeUserMenu();
    this.authService.logout();
  }
}
