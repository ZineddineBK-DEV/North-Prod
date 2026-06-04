import { Component, DOCUMENT, Inject, Renderer2 } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";

import { Loader } from "./shared/components/loader/loader";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Loader],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  public url: string;
  title = "Unice";

  constructor(
    private router: Router,
    private _renderer2: Renderer2,
    @Inject(DOCUMENT) private _document: Document,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.url = event.url;
      }
    });
  }

  public ngOnInit() {
    let script = this._renderer2.createElement("script");
    script.src = `/assets/tilt.js`;
    this._renderer2.appendChild(this._document.body, script);
  }
}
