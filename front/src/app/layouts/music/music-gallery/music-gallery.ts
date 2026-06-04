import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { CarouselModule } from "ngx-owl-carousel-o";

@Component({
  selector: "app-music-gallery",
  imports: [CommonModule, CarouselModule],
  templateUrl: "./music-gallery.html",
  styleUrls: ["./music-gallery.scss"],
})
export class MusicGallery {
  gallery = [
    {
      img: "assets/images/music/gallery/1.jpg",
    },
    {
      img: "assets/images/music/gallery/2.jpg",
    },
    {
      img: "assets/images/music/gallery/3.png",
    },
    {
      img: "assets/images/music/gallery/4.jpg",
    },
    {
      img: "assets/images/music/gallery/5.jpg",
    },
    {
      img: "assets/images/music/gallery/5.jpg",
    },
  ];

  galleryCarouselOptions = {
    items: 3,
    autoHeight: true,
    nav: true,
    navText: [
      '<img src="assets/images/music/gallery/gallery-icon/left.png">',
      '<img src="assets/images/music/gallery/gallery-icon/right.png">',
    ],
    autoplay: false,
    center: true,
    slideSpeed: 300,
    paginationSpeed: 400,
    dots: false,
    loop: true,
    responsive: {
      0: {
        items: 1,
        margin: 10,
      },
      460: {
        items: 2,
      },
      991: {
        items: 3,
      },
    },
  };
}
