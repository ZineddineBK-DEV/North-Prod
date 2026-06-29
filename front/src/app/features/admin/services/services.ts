import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-services',
  templateUrl: './services.html',
  styleUrls: ['./services.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AdminServicesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  services: any[] = [];
  loading  = true;
  showForm = false;
  saving   = false;
  editId: string | null = null;
  msg = ''; err = '';

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0)]],
    unit:        ['heure', Validators.required],
    isAvailable: [true],
    order:       [0],
  });

  units = ['heure','titre','forfait','journée','session'];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/services`).subscribe({
      next: r  => { this.services = r.services || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openAdd() {
    this.editId = null;
    this.form.reset({ unit:'heure', isAvailable:true, price:0, order:0 });
    this.showForm = true; this.msg=''; this.err='';
  }

  openEdit(s: any) {
    this.editId = s._id;
    this.form.patchValue(s);
    this.showForm = true; this.msg=''; this.err='';
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const api = this.editId
      ? this.http.put<any>(`${environment.apiUrl}/services/${this.editId}`, this.form.value)
      : this.http.post<any>(`${environment.apiUrl}/services`, this.form.value);
    api.subscribe({
      next: () => { this.msg = 'Sauvegardé !'; this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.err = e.error?.message||'Erreur.'; this.saving = false; },
    });
  }

  remove(id: string) {
    if (!confirm('Supprimer ce service ?')) return;
    this.http.delete<any>(`${environment.apiUrl}/services/${id}`)
      .subscribe({ next: () => this.load() });
  }

  toggle(s: any) {
    this.http.put<any>(`${environment.apiUrl}/services/${s._id}`, { isAvailable: !s.isAvailable })
      .subscribe({ next: r => s.isAvailable = r.service.isAvailable });
  }
}
