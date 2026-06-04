import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IMenu, NavService } from "../../../../shared/service/nav.service";

@Component({
  selector: "app-center-menu",
  imports: [CommonModule, RouterModule],
  templateUrl: "./center-menu.html",
  styleUrls: ["./center-menu.scss"],
})
export class CenterMenu implements OnInit {
  public menuItems: IMenu[];
  public openSide: boolean = false;
  public activeItem = "home";
  public active: boolean = false;
  public activeChildItem: string = "";
  public overlay: boolean = false;

  constructor(public navServices: NavService) {}

  ngOnInit() {
    this.navServices.items.subscribe((menuItems) => {
      this.menuItems = menuItems;
    });
  }

  toggleSidebar() {
    this.openSide = !this.openSide;
  }

  closeOverlay() {
    this.openSide = false;
  }

  setActive(menuItem: string | undefined) {
    const item = menuItem || "";
    if (this.activeItem === item) {
      this.activeItem = "";
    } else {
      this.activeItem = item;
    }
  }

  isActive(item: string | undefined) {
    const items = item || "";
    return this.activeItem === items;
  }

  // For Active Child Menu in Mobile View
  setChildActive(subMenu: string | undefined) {
    const item = subMenu || "";
    if (this.activeChildItem === item) {
      this.activeChildItem = "";
    } else {
      this.activeChildItem = item;
    }
  }

  ischildActive(subMenu: string | undefined) {
    const item = subMenu || "";
    return this.activeChildItem === item;
  }
}
