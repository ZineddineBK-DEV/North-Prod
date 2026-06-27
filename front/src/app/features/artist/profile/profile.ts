import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const GENRES = ['Rap','Trap','Drill','LoFi','Old School','Freestyle','R&B','Afrobeats','Pop','Rock','Jazz','Soul','Electronic','Autre'];
const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/artist/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/artist/bookings'  },
  { label:'Mes Projets',     icon:'fa fa-music',      route:'/artist/projects'  },
  { label:'Messages',        icon:'fa fa-comments',   route:'/artist/messages'  },
  { label:'Mon Profil',      icon:'fa fa-user',       route:'/artist/profile'   },
];

@Component({
  selector: 'app-artist-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [DashboardShellComponent, ReactiveFormsModule],
})
export class ArtistProfileComponent implements OnInit {
  authService = inject(AuthService);
  private fb  = inject(FormBuilder);
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  navItems = NAV;
  genres   = GENRES;
  saving   = false;
  saved    = false;
  error    = '';
  selectedGenres: string[] = [];

  form = this.fb.group({
    aka:       ['', [Validators.required, Validators.maxLength(60)]],
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    phone:     [''],
    bio:       ['', Validators.maxLength(500)],
    socialLinks: this.fb.group({
      instagram:  [''], facebook: [''], youtube: [''],
      spotify: [''], soundcloud: [''], tiktok: [''],
    }),
  });

  pwForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  pwSaving = false; pwError = ''; pwSuccess = '';

  ngOnInit() {
    const u = this.authService.currentUser();
    if (!u) return;
    this.form.patchValue({
      aka: u.aka, firstName: u.firstName, lastName: u.lastName,
      phone: u.phone || '', bio: u.bio || '',
      socialLinks: u.socialLinks || {},
    });
    this.selectedGenres = [...(u.musicalGenres || [])];
  }

  toggleGenre(g: string) {
    const i = this.selectedGenres.indexOf(g);
    if (i > -1) this.selectedGenres.splice(i, 1);
    else if (this.selectedGenres.length < 5) this.selectedGenres.push(g);
  }
  isSelected(g: string) { return this.selectedGenres.includes(g); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = ''; this.saved = false;
    this.http.put<any>(`${this.api}/users/me`, { ...this.form.value, musicalGenres: this.selectedGenres }).subscribe({
      next: res => { this.saving = false; this.saved = true; this.authService.updateCurrentUser(res.user); setTimeout(() => this.saved = false, 3000); },
      error: err => { this.saving = false; this.error = err.error?.message || 'Erreur lors de la sauvegarde.'; },
    });
  }

  changePassword() {
    const v = this.pwForm.value;
    if (v.newPassword !== v.confirmPassword) { this.pwError = 'Les mots de passe ne correspondent pas.'; return; }
    this.pwSaving = true; this.pwError = ''; this.pwSuccess = '';
    this.http.put<any>(`${this.api}/users/me/password`, { currentPassword: v.currentPassword, newPassword: v.newPassword }).subscribe({
      next: () => { this.pwSaving = false; this.pwSuccess = 'Mot de passe modifié.'; this.pwForm.reset(); },
      error: err => { this.pwSaving = false; this.pwError = err.error?.message || 'Erreur.'; },
    });
  }

  uploadAvatar(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    this.http.post<any>(`${this.api}/users/me/avatar`, fd).subscribe({
      next: res => { const u = this.authService.currentUser(); if (u) this.authService.updateCurrentUser({ ...u, avatarUrl: res.avatarUrl }); },
    });
  }
}
