import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IMenu {
  path?: string;
  title?: string;
  type?: string;
  icon?: string;
  active?: boolean;
  children?: IMenu[];
  megaMenu?: boolean;
  megaMenuType?: 'small' | 'medium' | 'large';
}

// Public site nav items — each path is a real Angular route defined in layout.routes.ts
export const MENUITEMS: IMenu[] = [
  { path: '/',          title: 'Accueil',         type: 'link' },
  { path: '/portfolio', title: 'Portfolio',        type: 'link' },
  { path: '/services',  title: 'Services & Tarifs',type: 'link' },
  { path: '/studio',    title: 'Le Studio',        type: 'link' },
  { path: '/contact',   title: 'Contact',          type: 'link' },
];

@Injectable({ providedIn: 'root' })
export class NavService {
  // Public observable for components that subscribe reactively
  private _items = new BehaviorSubject<IMenu[]>(MENUITEMS);
  items$ = this._items.asObservable();

  // Direct access for the nav component (no subscription needed)
  readonly MENUITEMS = MENUITEMS;
}
