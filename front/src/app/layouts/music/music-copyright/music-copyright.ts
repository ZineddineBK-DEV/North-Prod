import { Component } from '@angular/core';

@Component({
  selector: 'app-music-copyright',
  templateUrl: './music-copyright.html',
  styleUrls: ['./music-copyright.scss'],
  imports: [],
})
export class MusicCopyright {
  year = new Date().getFullYear();
}
