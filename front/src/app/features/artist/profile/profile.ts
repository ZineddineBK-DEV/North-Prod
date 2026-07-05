import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const GENRES = ['Rap','Trap','R&B','Drill','Afrobeats','Pop','Rock','Électro','Reggae','Autre'];

@Component({
  selector: 'app-artist-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe],
})
export class ArtistProfileComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);
  private API  = `${environment.apiUrl}/users`;

  genres = GENRES;
  saving = false;
  saved  = false;
  err    = '';
  tab: 'info' | 'social' | 'security' = 'info';

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

  get user() { return this.auth.currentUser()!; }

  ngOnInit() {
    const u = this.user;
    this.form.patchValue({
      aka: u.aka, firstName: u.firstName, lastName: u.lastName,
      phone: u.phone || '', bio: u.bio || '', musicalGenres: u.musicalGenres || [],
    });
    if (u.socialLinks) this.socialForm.patchValue(u.socialLinks as any);
  }

  toggleGenre(g: string) {
    const current: string[] = this.form.value.musicalGenres as string[] || [];
    const idx = current.indexOf(g);
    this.form.patchValue({
      musicalGenres: idx >= 0 ? current.filter(x => x !== g) : [...current, g]
    });
  }
  isGenreSelected(g: string) { return (this.form.value.musicalGenres as string[])?.includes(g); }

  saveInfo() {
    if (this.form.invalid) return;
    this.saving = true; this.err = ''; this.saved = false;
    this.http.put<any>(`${this.API}/me`, this.form.value).subscribe({
      next: r => {
        this.auth.updateCurrentUser(r.user);
        this.saved = true; this.saving = false;
        setTimeout(() => this.saved = false, 3000);
      },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  saveSocial() {
    this.saving = true;
    this.http.put<any>(`${this.API}/me`, { socialLinks: this.socialForm.value }).subscribe({
      next: r => { this.auth.updateCurrentUser(r.user); this.saved = true; this.saving = false; setTimeout(()=>this.saved=false,3000); },
      error: e => { this.err = e.error?.message||'Erreur.'; this.saving = false; },
    });
  }

  changePass() {
    if (this.passForm.invalid) return;
    this.saving = true;
    this.http.put<any>(`${this.API}/me/password`, this.passForm.value).subscribe({
      next: () => { this.saved = true; this.saving = false; this.passForm.reset(); setTimeout(()=>this.saved=false,3000); },
      error: e => { this.err = e.error?.message||'Erreur.'; this.saving = false; },
    });
  }
}
