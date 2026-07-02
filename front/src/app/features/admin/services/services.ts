import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-services',
  templateUrl: './services.html',
  styleUrls: ['./services.scss'],
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
})
export class AdminServicesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  services: any[] = [];
  loading = true; showForm = false; saving = false;
  editId: string | null = null;
  msg = ''; err = '';

  // Confirm dialog state
  confirmVisible  = false;
  confirmTitle    = '';
  confirmMessage  = '';
  private pendingDeleteId: string | null = null;

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0)]],
    unit:        ['heure', Validators.required],
    isActive:    [true],
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
    this.form.reset({ unit:'heure', isActive:true, price:0, order:0 });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  openEdit(s: any) {
    this.editId = s._id;
    this.form.patchValue({
      name: s.name, description: s.description || '', price: s.price,
      unit: s.unit, isActive: s.isActive, order: s.order || 0,
    });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  private toSlug(name: string): string {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = { ...this.form.value, slug: this.toSlug(this.form.value.name!) };
    const req = this.editId
      ? this.http.put<any>(`${environment.apiUrl}/services/${this.editId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/services`, payload);
    req.subscribe({
      next: () => { this.msg = 'Sauvegardé !'; this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  // Custom confirm dialog instead of browser confirm()
  askRemove(id: string, name: string) {
    this.pendingDeleteId = id;
    this.confirmTitle   = 'Supprimer le service';
    this.confirmMessage = `Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`;
    this.confirmVisible = true;
  }

  onConfirmDelete() {
    this.confirmVisible = false;
    if (!this.pendingDeleteId) return;
    this.http.delete<any>(`${environment.apiUrl}/services/${this.pendingDeleteId}`)
      .subscribe({ next: () => { this.pendingDeleteId = null; this.load(); } });
  }

  onCancelDelete() {
    this.confirmVisible  = false;
    this.pendingDeleteId = null;
  }

  toggle(s: any) {
    this.http.put<any>(`${environment.apiUrl}/services/${s._id}`, { isActive: !s.isActive })
      .subscribe({ next: r => s.isActive = r.service.isActive });
  }
}
