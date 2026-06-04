import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "app-music-copyright",
  imports: [CommonModule],
  templateUrl: "./music-copyright.html",
  styleUrls: ["./music-copyright.scss"],
})
export class MusicCopyright {
  public year = new Date().getFullYear();
}
