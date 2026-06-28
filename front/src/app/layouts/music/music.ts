import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { MusicAlbum }      from './music-album/music-album';
import { MusicArtist }     from './music-artist/music-artist';
import { MusicBooking }    from './music-booking/music-booking';
import { MusicCopyright }  from './music-copyright/music-copyright';
import { MusicFooter }     from './music-footer/music-footer';
import { MusicGallery }    from './music-gallery/music-gallery';
import { MusicHeader }     from './music-header/music-header';
import { MusicNav }        from './music-nav/music-nav';
import { MusicTestimonial } from './music-testimonial/music-testimonial';
import { MusicVideo }      from './music-video/music-video';

// Maps route path → element id to scroll to
const SECTION_MAP: Record<string, string> = {
  portfolio: 'portfolio',
  services:  'services',
  studio:    'gallery',
  contact:   'contact',
};

@Component({
  selector: 'app-music',
  imports: [
    MusicAlbum, MusicArtist, MusicBooking, MusicCopyright,
    MusicFooter, MusicGallery, MusicHeader, MusicNav,
    MusicTestimonial, MusicVideo,
  ],
  templateUrl: './music.html',
  styleUrls: ['./music.scss'],
})
export class Music implements OnInit, AfterViewInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private title  = inject(Title);

  ngOnInit() {
    this.title.setTitle(this.route.snapshot.data['title'] || 'NORTH PROD');
  }

  ngAfterViewInit() {
    // Scroll on first load
    this.scrollToSection(this.route.snapshot.data['section']);

    // Scroll whenever the same Music component re-uses for a different route
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      const section = this.route.snapshot.data['section'];
      this.scrollToSection(section);
    });
  }

  private scrollToSection(section?: string) {
    if (!section) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const id = SECTION_MAP[section] || section;
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const offset = 80; // navbar height
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 120);
  }
}
