import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IMenu {
  path?: string;
  title?: string;
  type?: string;
  icon?: string;
  active?: boolean;
  children?: IMenu[];
}

@Injectable({ providedIn: 'root' })
export class NavService {
  // Mobile sidebar open state
  openSidebar = signal(false);

  // Main navigation items for NORTH PROD
  MENUITEMS: IMenu[] = [
    {
      title: 'Accueil',
      type: 'link',
      path: '/',
    },
    {
      title: 'Portfolio',
      type: 'link',
      path: '/portfolio',
    },
      {
      title: 'Studio',
      type: 'link',
      path: '/studio',
    },
    {
      title: 'Services',
      type: 'link',
      path: '/services',
    },
    {
      title: 'Contact',
      type: 'link',
      path: '/contact',
    },
  ];

  private items = new BehaviorSubject<IMenu[]>(this.MENUITEMS);
  items$ = this.items.asObservable();

  toggleSidebar() {
    this.openSidebar.update((v) => !v);
  }

  closeSidebar() {
    this.openSidebar.set(false);
  }
}
