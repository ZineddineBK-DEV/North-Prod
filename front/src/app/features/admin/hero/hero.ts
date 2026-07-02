import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
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

  heroes: any[] = [];
  loading = true;
  saving = false;
  editId: string | null = null;
  showForm = false;
  msg = ''; err = '';
  videoFile: File | null = null;

  form = this.fb.group({
    mediaType: ['youtube', Validators.required],
    embedUrl:  [''],
    videoId:   [''],
    title:     ['', Validators.required],
    subtitle:  [''],
    autoplay:  [true],
    muted:     [true],
    loop:      [true],
    cta: this.fb.array([]),
  });

  get ctaArray(): FormArray { return this.form.get('cta') as FormArray; }

  addCta() {
    this.ctaArray.push(this.fb.group({ label:[''], link:[''], style:['primary'] }));
  }
  removeCta(i: number) { this.ctaArray.removeAt(i); }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/hero`).subscribe({
      next: r => { this.heroes = r.heroes || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openAdd() {
    this.editId = null; this.videoFile = null;
    this.ctaArray.clear();
    this.form.reset({ mediaType:'youtube', autoplay:true, muted:true, loop:true });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  openEdit(h: any) {
    this.editId = h._id; this.videoFile = null;
    this.ctaArray.clear();
    (h.cta || []).forEach((c: any) =>
      this.ctaArray.push(this.fb.group({ label:[c.label||''], link:[c.link||''], style:[c.style||'primary'] }))
    );
    this.form.patchValue({
      mediaType: h.mediaType, embedUrl: h.embedUrl || '',
      videoId: h.videoId || '', title: h.title || '', subtitle: h.subtitle || '',
      autoplay: h.autoplay, muted: h.muted, loop: h.loop,
    });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  onVideo(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { this.videoFile = f; this.form.patchValue({ mediaType: 'upload' }); }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.msg = ''; this.err = '';

    const fd = new FormData();
    const v = this.form.value as any;
    ['mediaType','embedUrl','videoId','title','subtitle','autoplay','muted','loop'].forEach(k => {
      if (v[k] !== null && v[k] !== undefined) fd.append(k, String(v[k]));
    });
    fd.append('cta', JSON.stringify(v.cta || []));
    if (this.videoFile) fd.append('video', this.videoFile);

    const req = this.editId
      ? this.http.put<any>(`${environment.apiUrl}/hero/${this.editId}`, fd)
      : this.http.post<any>(`${environment.apiUrl}/hero`, fd);

    req.subscribe({
      next: () => { this.msg = 'Sauvegardé !'; this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  activate(h: any) {
    this.http.put<any>(`${environment.apiUrl}/hero/${h._id}/activate`, {}).subscribe({
      next: () => { this.heroes.forEach(x => x.isActive = x._id === h._id); },
    });
  }

  remove(id: string) {
    if (!confirm('Supprimer ce Hero ?')) return;
    this.http.delete<any>(`${environment.apiUrl}/hero/${id}`)
      .subscribe({ next: () => this.load() });
  }
}
