import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { CarouselModule } from "ngx-owl-carousel-o";

@Component({
  selector: "app-music-blog",
  imports: [CommonModule, CarouselModule],
  templateUrl: "./music-blog.html",
  styleUrls: ["./music-blog.scss"],
})
export class MusicBlog {
  blogs = [
    {
      img: "assets/images/event/blog/1.jpg",
      date: "5 September 2024",
      type: "admin",
      title: "Find Great Speaker For Event.",
      subTitle: "Detais This Event",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard .",
    },
    {
      img: "assets/images/event/blog/2.jpg",
      date: "5 September 2024",
      type: "admin",
      title: "Find Great Speaker For Event.",
      subTitle: "Detais This Event",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard .",
    },
    {
      img: "assets/images/event/blog/3.jpg",
      date: "5 September 2024",
      type: "admin",
      title: "Find Great Speaker For Event.",
      subTitle: "Detais This Event",
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard .",
    },
  ];

  blogCarouselOptions = {
    items: 3,
    margin: 60,
    nav: false,
    dots: false,
    autoplay: false,
    slideSpeed: 300,
    paginationSpeed: 400,
    loop: true,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
        margin: 10,
      },
      991: {
        items: 2,
        margin: 10,
      },
      992: {
        items: 3,
        margin: 10,
      },
      1200: {
        margin: 30,
      },
    },
  };
}
