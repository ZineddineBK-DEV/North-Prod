import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { PortfolioItem } from '../../../core/models/portfolio.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { environment } from '../../../../environments/environment';

const CATEGORIES = [
  'Rap','Trap','Drill','LoFi','Old School','Freestyle',
  'R&B','Afrobeats','Pop','Rock','Jazz','Soul','Electronic','Mixage','Mastering','Autre'
];

@Component({
  selector: 'app-admin-portfolio',
  templateUrl: './portfolio.html',
  styleUrls: ['./portfolio.scss'],
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogComponent],
})
export class AdminPortfolioComponent implements OnInit {
  private svc  = inject(PortfolioService);
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  items: PortfolioItem[] = [];
  // Artists from User API (role=artist)
  artistUsers: { _id: string; aka: string }[] = [];
  loading = true; showForm = false; saving = false;
  editId: string | null = null;
  msg = ''; err = '';

  thumbnailFile: File | null = null;
  audioFile:     File | null = null;
  thumbnailPreview = '';

  categories = CATEGORIES;

  // Confirm dialog state
  confirmVisible  = false;
  confirmTitle    = '';
  confirmMessage  = '';
  private pendingDeleteId: string | null = null;

  form = this.fb.group({
    title:       ['', Validators.required],
    artist:      [''],
    category:    ['Rap', Validators.required],
    description: [''],
    mediaType:   ['audio'],
    embedUrl:    [''],
    year:        [new Date().getFullYear()],
    order:       [0],
    isFeatured:  [false],
    isPublished: [true],
  });

  ngOnInit() {
    this.load();
    this.loadArtists();
  }

  load() {
    this.loading = true;
    this.svc.getItems({ limit: 200 }).subscribe({
      next: r  => { this.items = r.items; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadArtists() {
    this.http.get<any>(`${environment.apiUrl}/admin/users?role=artist&limit=200`).subscribe({
      next: r => { this.artistUsers = (r.users || []).map((u: any) => ({ _id: u._id, aka: u.aka })); },
      error: () => {},
    });
  }

  openAdd() {
    this.editId = null;
    this.thumbnailFile = null; this.audioFile = null; this.thumbnailPreview = '';
    this.form.reset({ category:'Rap', mediaType:'audio', isFeatured:false, isPublished:true,
                      year: new Date().getFullYear(), order: 0 });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  openEdit(item: PortfolioItem) {
    this.editId = item._id;
    this.thumbnailFile = null; this.audioFile = null;
    this.thumbnailPreview = item.thumbnail ? this.thumbUrl(item) : '';
    this.form.patchValue({
      title: item.title, artist: item.artist || '', category: item.category,
      description: item.description || '', mediaType: item.mediaType || 'audio',
      embedUrl: item.embedUrl || '', year: item.year || new Date().getFullYear(),
      order: item.order || 0, isFeatured: item.isFeatured, isPublished: item.isPublished,
    });
    this.showForm = true; this.msg = ''; this.err = '';
  }

  onThumbnail(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.thumbnailFile = f;
    const reader = new FileReader();
    reader.onload = (r) => this.thumbnailPreview = r.target?.result as string;
    reader.readAsDataURL(f);
  }

  onAudio(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.audioFile = f;
  }

  private buildFormData(): FormData {
    const fd = new FormData();
    const v = this.form.value as any;
    Object.keys(v).forEach(k => { if (v[k] !== null && v[k] !== undefined) fd.append(k, String(v[k])); });
    if (this.thumbnailFile) fd.append('thumbnail', this.thumbnailFile);
    if (this.audioFile)     fd.append('media', this.audioFile);
    return fd;
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.err = '';
    const fd = this.buildFormData();
    const req = this.editId ? this.svc.updateItem(this.editId, fd) : this.svc.createItem(fd);
    req.subscribe({
      next: () => { this.msg = this.editId ? 'Modifié !' : 'Ajouté !'; this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.err = e.error?.message || 'Erreur lors de la sauvegarde.'; this.saving = false; },
    });
  }

  toggle(item: PortfolioItem) {
    const fd = new FormData();
    fd.append('isPublished', String(!item.isPublished));
    this.svc.updateItem(item._id, fd).subscribe({ next: r => item.isPublished = r.item.isPublished });
  }

  // Opens custom confirm dialog instead of browser confirm()
  askRemove(id: string, title: string) {
    this.pendingDeleteId = id;
    this.confirmTitle   = 'Supprimer la production';
    this.confirmMessage = `Voulez-vous vraiment supprimer "${title}" ? Cette action est irréversible.`;
    this.confirmVisible = true;
  }

  onConfirmDelete() {
    this.confirmVisible = false;
    if (!this.pendingDeleteId) return;
    this.svc.deleteItem(this.pendingDeleteId).subscribe({ next: () => { this.pendingDeleteId = null; this.load(); } });
  }

  onCancelDelete() {
    this.confirmVisible  = false;
    this.pendingDeleteId = null;
  }

  thumbUrl(item: PortfolioItem): string {
    if (!item.thumbnail) return '';
    if (item.thumbnail.startsWith('music/') || item.thumbnail.startsWith('assets/')) return `assets/images/${item.thumbnail}`;
    return `${environment.apiUrl.replace('/api', '')}/uploads/${item.thumbnail}`;
  }
}
