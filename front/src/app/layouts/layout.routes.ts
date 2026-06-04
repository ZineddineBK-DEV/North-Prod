import { Routes } from "@angular/router";

export const Layout: Routes = [
  {
    path: "music",
    loadComponent: () => import("./music/music").then((m) => m.Music),
    data: {
      title: "Music | Unice Landing Page",
    },
  },
];
