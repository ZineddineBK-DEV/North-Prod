import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";

import { IMenu, NavService } from "../../../service/nav.service";

@Component({
  selector: "app-menu",
  imports: [CommonModule, RouterModule],
  templateUrl: "./menu.html",
  styleUrls: ["./menu.scss"],
})
export class Menu implements OnInit {
  public menuItems: IMenu[];
  public openSide: boolean = false;
  public activeItem: string = "home";
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

  //For Active Main menu in Mobile View
  setActive(menuItem: string) {
    if (this.activeItem === menuItem) {
      this.activeItem = "";
    } else {
      this.activeItem = menuItem;
    }
  }

  isActive(item: string) {
    return this.activeItem === item;
  }

  // For Active Child Menu in Mobile View
  setChildActive(subMenu: string) {
    if (this.activeChildItem === subMenu) {
      this.activeChildItem = "";
    } else {
      this.activeChildItem = subMenu;
    }
  }

  ischildActive(subMenu: string) {
    return this.activeChildItem === subMenu;
  }
}
