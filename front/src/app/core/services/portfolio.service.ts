import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PortfolioItem, Service, HeroMedia } from '../models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly API = `${environment.apiUrl}/portfolio`;

  constructor(private http: HttpClient) {}

  getItems(params?: { category?: string; featured?: boolean; page?: number; limit?: number }) {
    let httpParams = new HttpParams();
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.featured) httpParams = httpParams.set('featured', 'true');
    if (params?.page)     httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit)    httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ success: boolean; items: PortfolioItem[]; total: number }>(
      this.API, { params: httpParams }
    );
  }

  getItem(id: string) {
    return this.http.get<{ success: boolean; item: PortfolioItem }>(`${this.API}/${id}`);
  }

  createItem(fd: FormData) {
    return this.http.post<{ success: boolean; item: PortfolioItem }>(this.API, fd);
  }

  updateItem(id: string, fd: FormData) {
    return this.http.put<{ success: boolean; item: PortfolioItem }>(`${this.API}/${id}`, fd);
  }

  deleteItem(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.API}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly API = `${environment.apiUrl}/services`;
  constructor(private http: HttpClient) {}
  getServices() {
    return this.http.get<{ success: boolean; services: Service[] }>(this.API);
  }
}

@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly API = `${environment.apiUrl}/hero`;
  constructor(private http: HttpClient) {}
  getActiveHero() {
    return this.http.get<{ success: boolean; hero: HeroMedia | null }>(`${this.API}/active`);
  }
}
