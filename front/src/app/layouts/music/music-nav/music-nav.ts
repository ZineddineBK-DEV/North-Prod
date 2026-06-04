import { Component } from "@angular/core";

import { Menu } from "../../../shared/components/navigation/menu/menu";

@Component({
  selector: "app-music-nav",
  imports: [Menu],
  templateUrl: "./music-nav.html",
  styleUrls: ["./music-nav.scss"],
})
export class MusicNav {}
