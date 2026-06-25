import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = `${environment.apiUrl}/notifications`;
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(params?: { page?: number; unreadOnly?: boolean }) {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.unreadOnly) httpParams = httpParams.set('unreadOnly', 'true');
    return this.http.get<{ success: boolean; notifications: Notification[]; total: number; unreadCount: number }>(
      this.API, { params: httpParams }
    );
  }

  markAsRead(id: string) {
    return this.http.put<{ success: boolean }>(`${this.API}/${id}/read`, {});
  }

  markAllAsRead() {
    this.unreadCount.set(0);
    return this.http.put<{ success: boolean }>(`${this.API}/read-all`, {});
  }

  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.API}/${id}`);
  }

  refreshCount() {
    this.getNotifications({ unreadOnly: true }).subscribe((res) => {
      this.unreadCount.set(res.unreadCount);
    });
  }
}
