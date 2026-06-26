import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";

import { MusicAlbum } from "./music-album/music-album";
import { MusicArtist } from "./music-artist/music-artist";
import { MusicBooking } from "./music-booking/music-booking";
import { MusicCopyright } from "./music-copyright/music-copyright";
import { MusicFooter } from "./music-footer/music-footer";
import { MusicGallery } from "./music-gallery/music-gallery";
import { MusicHeader } from "./music-header/music-header";
import { MusicNav } from "./music-nav/music-nav";
import { MusicTestimonial } from "./music-testimonial/music-testimonial";
import { MusicVideo } from "./music-video/music-video";

@Component({
  selector: "app-music",
  imports: [
    MusicAlbum,
    MusicArtist,
    MusicBooking,
    MusicCopyright,
    MusicFooter,
    MusicHeader,
    MusicGallery,
    MusicNav,
    MusicTestimonial,
    MusicVideo,
  ],
  templateUrl: "./music.html",
  styleUrls: ["./music.scss"],
})
export class Music implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private title: Title,
  ) {}

  ngOnInit() {
    this.title.setTitle(this.route.snapshot.data["title"]);
  }
}
