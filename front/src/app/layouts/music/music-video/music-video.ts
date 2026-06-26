import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-music-video',
  templateUrl: './music-video.html',
  styleUrls: ['./music-video.scss'],
})
export class MusicVideo {
  private sanitizer = inject(DomSanitizer);
  modalOpen = false;
  safeUrl!: SafeResourceUrl;
  readonly videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';

  openVideo() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }
  closeVideo() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }
}
