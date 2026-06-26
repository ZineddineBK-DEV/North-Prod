import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroService } from '../../../core/services/portfolio.service';
import { HeroMedia } from '../../../core/models/portfolio.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-music-header',
  templateUrl: './music-header.html',
  styleUrls: ['./music-header.scss'],
  imports: [RouterLink],
})
export class MusicHeader implements OnInit {
  private heroService = inject(HeroService);
  private sanitizer   = inject(DomSanitizer);

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
      error: () => { /* fallback to default */ }
    });
  }
}
