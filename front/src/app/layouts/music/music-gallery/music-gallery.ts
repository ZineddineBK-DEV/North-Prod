import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-music-gallery',
  templateUrl: './music-gallery.html',
  styleUrls: ['./music-gallery.scss'],
  imports: [CommonModule],
})
export class MusicGallery {
  images = [
    { src: 'assets/images/music/gallery/1.jpg', alt: 'Console de mixage' },
    { src: 'assets/images/music/gallery/2.jpg', alt: 'Cabine enregistrement' },
    { src: 'assets/images/music/gallery/3.jpg', alt: 'Monitoring studio' },
    { src: 'assets/images/music/gallery/4.jpg', alt: 'Session artiste' },
    { src: 'assets/images/music/gallery/5.jpg', alt: 'Vue ensemble studio' },
    { src: 'assets/images/music/gallery/6.jpg', alt: 'Post-production' },
  ];
}
