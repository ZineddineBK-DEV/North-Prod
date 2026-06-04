import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "app-music-header",
  imports: [CommonModule],
  templateUrl: "./music-header.html",
  styleUrls: ["./music-header.scss"],
})
export class MusicHeader {
  sideBarDispaly: string = "none";

  sideBar() {
    this.sideBarDispaly == "none"
      ? (this.sideBarDispaly = "block")
      : (this.sideBarDispaly = "none");
  }
}
