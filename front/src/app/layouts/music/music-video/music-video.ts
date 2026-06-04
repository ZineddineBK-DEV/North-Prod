import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-music-video",
  imports: [CommonModule],
  templateUrl: "./music-video.html",
  styleUrls: ["./music-video.scss"],
})
export class MusicVideo {
  constructor(private modalService: NgbModal) {}

  openVerticallyCentered(content: unknown) {
    this.modalService.open(content, { centered: true, size: "lg" });
  }
}
