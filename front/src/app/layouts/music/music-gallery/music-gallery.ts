import { Component } from '@angular/core';

@Component({
  selector: 'app-music-gallery',
  templateUrl: './music-gallery.html',
  styleUrls: ['./music-gallery.scss'],
})
export class MusicGallery {
  images = [
    { src: 'assets/images/music/gallery/1.jpg', alt: 'Studio console' },
    { src: 'assets/images/music/gallery/2.jpg', alt: 'Cabine enregistrement' },
    { src: 'assets/images/music/gallery/3.jpg', alt: 'Monitoring' },
    { src: 'assets/images/music/gallery/4.jpg', alt: 'Artiste en session' },
    { src: 'assets/images/music/gallery/5.jpg', alt: 'Vue ensemble studio' },
  ];
}
