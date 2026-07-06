import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const GENRES = ['Rap','Trap','R&B','Drill','Afrobeats','Pop','Rock','Électro','Reggae','Autre'];
const API_BASE = `${environment.apiUrl}/users`;
const UPLOADS  = environment.apiUrl.replace('/api', '');

@Component({
  selector: 'app-artist-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe],
})
export class ArtistProfileComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  auth = inject(AuthService);
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  genres = GENRES;
  saving = false;
  saved  = false;
  err    = '';
  tab: 'info' | 'social' | 'security' = 'info';

  // Current avatar URL shown in header (kept in sync after upload)
  avatarUrl: string | null = null;

  form = this.fb.group({
    aka:       ['', Validators.required],
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    phone:     [''],
    bio:       [''],
    musicalGenres: [[] as string[]],
  });

  socialForm = this.fb.group({
    instagram:  [''],
    facebook:   [''],
    youtube:    [''],
    spotify:    [''],
    soundcloud: [''],
    tiktok:     [''],
  });

  passForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    // Always fetch fresh user from API (includes virtual avatarUrl/coverUrl)
    this.http.get<any>(`${API_BASE}/me`).subscribe({
      next: r => {
        const u = r.user;
        this.auth.updateCurrentUser(u);
        this.avatarUrl = u.avatar ? `${UPLOADS}/uploads/${u.avatar}` : null;
        this.form.patchValue({
          aka: u.aka, firstName: u.firstName, lastName: u.lastName,
          phone: u.phone || '', bio: u.bio || '',
          musicalGenres: u.musicalGenres || [],
        });
        if (u.socialLinks) this.socialForm.patchValue(u.socialLinks);
      },
      error: () => {
        // Fallback to cached user
        const u = this.auth.currentUser();
        if (!u) return;
        this.avatarUrl = u.avatar ? `${UPLOADS}/uploads/${u.avatar}` : null;
        this.form.patchValue({
          aka: u.aka, firstName: u.firstName, lastName: u.lastName,
          phone: u.phone || '', bio: u.bio || '',
          musicalGenres: u.musicalGenres || [],
        });
        if (u.socialLinks) this.socialForm.patchValue(u.socialLinks as any);
      },
    });
  }

  get user() { return this.auth.currentUser()!; }

  toggleGenre(g: string) {
    const current = (this.form.value.musicalGenres as string[]) || [];
    const idx = current.indexOf(g);
    this.form.patchValue({
      musicalGenres: idx >= 0 ? current.filter(x => x !== g) : [...current, g],
    });
  }
  isGenreSelected(g: string) {
    return ((this.form.value.musicalGenres as string[]) || []).includes(g);
  }

  // ── Avatar upload ─────────────────────────────────────
  triggerAvatarUpload() {
    this.avatarInput?.nativeElement.click();
  }

  onAvatarSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    this.saving = true; this.err = '';
    this.http.post<any>(`${API_BASE}/me/avatar`, fd).subscribe({
      next: r => {
        this.saving = false;
        // Update avatar URL displayed in header
        this.avatarUrl = r.avatarUrl ? `${UPLOADS}${r.avatarUrl}` : null;
        if (r.user) this.auth.updateCurrentUser(r.user);
        this.saved = true; setTimeout(() => this.saved = false, 3000);
      },
      error: e => { this.saving = false; this.err = e.error?.message || 'Erreur upload avatar.'; },
    });
  }

  // ── Save info ─────────────────────────────────────────
  saveInfo() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.err = ''; this.saved = false;
    this.http.put<any>(`${API_BASE}/me`, this.form.value).subscribe({
      next: r => {
        this.auth.updateCurrentUser(r.user);
        this.saved = true; this.saving = false;
        setTimeout(() => this.saved = false, 3000);
      },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  // ── Save social ───────────────────────────────────────
  saveSocial() {
    this.saving = true; this.err = ''; this.saved = false;
    this.http.put<any>(`${API_BASE}/me`, { socialLinks: this.socialForm.value }).subscribe({
      next: r => {
        this.auth.updateCurrentUser(r.user);
        this.saved = true; this.saving = false;
        setTimeout(() => this.saved = false, 3000);
      },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  // ── Change password ───────────────────────────────────
  changePass() {
    if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
    this.saving = true; this.err = ''; this.saved = false;
    this.http.put<any>(`${API_BASE}/me/password`, this.passForm.value).subscribe({
      next: () => {
        this.saved = true; this.saving = false;
        this.passForm.reset();
        setTimeout(() => this.saved = false, 3000);
      },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }
}
