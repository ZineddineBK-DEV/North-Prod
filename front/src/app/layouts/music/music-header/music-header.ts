import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroService } from '../../../core/services/portfolio.service';
import { HeroMedia } from '../../../core/models/portfolio.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-music-header',
  templateUrl: './music-header.html',
  styleUrls: ['./music-header.scss'],
  imports: [RouterLink],
})
export class MusicHeader implements OnInit {
  private heroService = inject(HeroService);
  private sanitizer   = inject(DomSanitizer);
  authService = inject(AuthService);

  hero: HeroMedia | null = null;
  safeEmbedUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    this.heroService.getActiveHero().subscribe({
      next: (res) => {
        this.hero = res.hero;
        if (this.hero?.embedUrl) {
          const url = `${this.hero.embedUrl}?autoplay=1&mute=1&loop=1&controls=0&playlist=${this.hero.videoId}&modestbranding=1`;
          this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        }
      },
      error: () => { /* fallback to default logo background */ }
    });
  }

  /** Smoothly scrolls to the "Le Studio en Images" section on the same page. */
  scrollToStudio(e: Event) {
    e.preventDefault();
    const el = document.getElementById('gallery');
    if (el) {
      const offset = 80; // navbar height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}
