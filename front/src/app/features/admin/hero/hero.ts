import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-hero',
  templateUrl: './hero.html',
  styleUrls: ['./hero.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AdminHeroComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  config: any   = null;
  loading = true;
  saving  = false;
  msg = ''; err = '';

  form = this.fb.group({
    videoUrl:    [''],
    videoType:   ['youtube'],
    headline:    ['', Validators.required],
    subheadline: [''],
    ctaPrimary:  ['Réserver une séance'],
    ctaSecondary:['Découvrir nos productions'],
    showStats:   [true],
  });

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/hero`).subscribe({
      next: r  => { this.config = r.config; if (r.config) this.form.patchValue(r.config); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.msg = ''; this.err = '';
    this.http.put<any>(`${environment.apiUrl}/admin/hero`, this.form.value).subscribe({
      next: r  => { this.config = r.config; this.msg = 'Section Hero mise à jour !'; this.saving = false; },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }
}
