import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = `${environment.apiUrl}/notifications`;
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(params?: { page?: number; unreadOnly?: boolean }) {
    let p = new HttpParams();
    if (params?.page) p = p.set('page', params.page.toString());
    if (params?.unreadOnly) p = p.set('unreadOnly', 'true');
    return this.http.get<{
      success: boolean; notifications: Notification[];
      total: number; unreadCount: number;
    }>(this.API, { params: p });
  }

  markAsRead(id: string) {
    return this.http.put<{ success: boolean }>(`${this.API}/${id}/read`, {}).pipe(
      tap(() => {
        const c = this.unreadCount();
        if (c > 0) this.unreadCount.set(c - 1);
      })
    );
  }

  markAllAsRead() {
    return this.http.put<{ success: boolean }>(`${this.API}/read-all`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.API}/${id}`);
  }

  /** Re-fetches the real count from the server */
  refreshCount() {
    this.getNotifications({ unreadOnly: true }).subscribe(res => {
      this.unreadCount.set(res.unreadCount ?? 0);
    });
  }
}
