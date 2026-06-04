import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "app-loader",
  imports: [CommonModule],
  templateUrl: "./loader.html",
  styleUrls: ["./loader.scss"],
})
export class Loader {
  public show: boolean = true;

  constructor() {
    setTimeout(() => {
      this.show = false;
    }, 1500);
  }
}
