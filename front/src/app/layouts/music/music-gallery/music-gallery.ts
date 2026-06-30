import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryImage { src: string; alt: string; }

@Component({
  selector: 'app-music-gallery',
  templateUrl: './music-gallery.html',
  styleUrls: ['./music-gallery.scss'],
  imports: [CommonModule],
})
export class MusicGallery {
  images: GalleryImage[] = [
    { src: 'assets/images/music/gallery/1.jpg', alt: 'Console de mixage' },
    { src: 'assets/images/music/gallery/2.jpg', alt: 'Cabine enregistrement' },
    { src: 'assets/images/music/gallery/3.jpg', alt: 'Monitoring studio' },
    { src: 'assets/images/music/gallery/4.jpg', alt: 'Session artiste' },
    { src: 'assets/images/music/gallery/5.jpg', alt: 'Vue ensemble studio' },
    { src: 'assets/images/music/gallery/6.jpg', alt: 'Post-production' },
  ];

  // ── Lightbox state ──────────────────────────────────────────
  lightboxOpen = false;
  activeIndex  = 0;

  get activeImage(): GalleryImage | null {
    return this.images[this.activeIndex] || null;
  }

  open(index: number) {
    this.activeIndex = index;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  close() {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  next(e?: Event) {
    e?.stopPropagation();
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
  }

  prev(e?: Event) {
    e?.stopPropagation();
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (!this.lightboxOpen) return;
    if (e.key === 'Escape')     this.close();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft')  this.prev();
  }
}
