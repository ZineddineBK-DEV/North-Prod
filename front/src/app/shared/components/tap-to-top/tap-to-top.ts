import { CommonModule, ViewportScroller } from "@angular/common";
import { Component, HostListener } from "@angular/core";

@Component({
  selector: "app-tap-to-top",
  imports: [CommonModule],
  templateUrl: "./tap-to-top.html",
  styleUrls: ["./tap-to-top.scss"],
})
export class TapToTop {
  public show: boolean = false;
  constructor(private viewScroller: ViewportScroller) {}

  @HostListener("window:scroll", [])
  onWindowScroll() {
    let number =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    if (number > 500) {
      this.show = true;
    } else {
      this.show = false;
    }
  }

  tapToTop() {
    this.viewScroller.scrollToPosition([0, 0]);
  }
}
