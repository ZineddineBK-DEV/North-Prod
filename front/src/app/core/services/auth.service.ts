import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginPayload, RegisterPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  // ── Signals ───────────────────────────────────────────────
  currentUser = signal<User | null>(this.loadUserFromStorage());
  isLoggedIn  = computed(() => !!this.currentUser());
  isArtist    = computed(() => this.currentUser()?.role === 'artist');
  isProduction = computed(() => this.currentUser()?.role === 'production');
  isAdmin     = computed(() => this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  // ── Register ──────────────────────────────────────────────
  register(payload: RegisterPayload) {
    return this.http.post<{ success: boolean; message: string; userId: string }>(
      `${this.API}/register`, payload
    );
  }

  // ── Verify email ──────────────────────────────────────────
  verifyEmail(token: string) {
    return this.http.post<AuthResponse>(`${this.API}/verify-email`, { token }).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  // ── Login ─────────────────────────────────────────────────
  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${this.API}/login`, payload).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  // ── Logout ────────────────────────────────────────────────
  logout() {
    this.http.post(`${this.API}/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  // ── Refresh token ─────────────────────────────────────────
  refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.API}/refresh-token`, { refreshToken }
    ).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
      })
    );
  }

  // ── Forgot password ───────────────────────────────────────
  forgotPassword(email: string) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API}/forgot-password`, { email }
    );
  }

  // ── Reset password ────────────────────────────────────────
  resetPassword(token: string, password: string) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.API}/reset-password`, { token, password }
    );
  }

  // ── Get current user from API ─────────────────────────────
  fetchMe() {
    return this.http.get<{ success: boolean; user: User }>(`${this.API}/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  // ── Token helpers ─────────────────────────────────────────
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // ── Update user in signal after profile edit ──────────────
  updateCurrentUser(user: User) {
    this.currentUser.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // ── Role-based redirect after login ───────────────────────
  redirectAfterLogin() {
    const user = this.currentUser();
    if (!user) return;
    if (user.role === 'admin') this.router.navigate(['/admin/dashboard']);
    else if (user.role === 'production') this.router.navigate(['/production/dashboard']);
    else this.router.navigate(['/artist/dashboard']);
  }

  // ── Private helpers ───────────────────────────────────────
  private storeSession(res: AuthResponse) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
