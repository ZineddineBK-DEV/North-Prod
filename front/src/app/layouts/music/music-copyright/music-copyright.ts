import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-music-copyright',
  templateUrl: './music-copyright.html',
  styleUrls: ['./music-copyright.scss'],
  imports: [RouterLink],
})
export class MusicCopyright {
  year = new Date().getFullYear();
}
