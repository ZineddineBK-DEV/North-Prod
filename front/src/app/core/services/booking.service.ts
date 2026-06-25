import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Booking, CreateBookingPayload } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getPricing() {
    return this.http.get<{ success: boolean; pricing: any }>(`${this.API}/pricing`);
  }

  getAvailability(date: string) {
    return this.http.get<{ success: boolean; bookings: any[] }>(
      `${this.API}/availability`, { params: new HttpParams().set('date', date) }
    );
  }

  createBooking(payload: CreateBookingPayload) {
    return this.http.post<{ success: boolean; message: string; booking: Booking }>(
      this.API, payload
    );
  }

  getMyBookings(params?: { status?: string; page?: number; limit?: number }) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ success: boolean; bookings: Booking[]; total: number }>(
      this.API, { params: httpParams }
    );
  }

  getAllBookings(params?: { status?: string; page?: number }) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    return this.http.get<{ success: boolean; bookings: Booking[]; total: number }>(
      `${this.API}/all`, { params: httpParams }
    );
  }

  getBooking(id: string) {
    return this.http.get<{ success: boolean; booking: Booking }>(`${this.API}/${id}`);
  }

  updateStatus(id: string, status: 'confirmed' | 'rejected', rejectionReason?: string) {
    return this.http.put<{ success: boolean; booking: Booking }>(
      `${this.API}/${id}/status`, { status, rejectionReason }
    );
  }

  cancelBooking(id: string) {
    return this.http.delete<{ success: boolean; booking: Booking }>(`${this.API}/${id}`);
  }
}
