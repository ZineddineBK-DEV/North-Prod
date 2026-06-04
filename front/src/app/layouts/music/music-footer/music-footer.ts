import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { TapToTop } from "../../../shared/components/tap-to-top/tap-to-top";

@Component({
  selector: "app-music-footer",
  imports: [CommonModule, TapToTop],
  templateUrl: "./music-footer.html",
  styleUrls: ["./music-footer.scss"],
})
export class MusicFooter {}
