import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { PortfolioItem } from '../../../core/models/portfolio.model';

const CATEGORIES = ['Rap','Trap','R&B','Drill','Afrobeats','Mixage','Mastering'];

@Component({
  selector: 'app-admin-portfolio',
  templateUrl: './portfolio.html',
  styleUrls: ['./portfolio.scss'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
})
export class AdminPortfolioComponent implements OnInit {
  private svc = inject(PortfolioService);
  private fb  = inject(FormBuilder);

  items: PortfolioItem[] = [];
  loading    = true;
  showForm   = false;
  saving     = false;
  editId: string | null = null;
  msg = ''; err = '';

  categories = CATEGORIES;

  form = this.fb.group({
    title:       ['', Validators.required],
    artist:      [''],
    category:    ['Rap', Validators.required],
    description: [''],
    isFeatured:  [false],
    isPublished: [true],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getItems({ limit: 100 }).subscribe({
      next: r => { this.items = r.items; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openAdd() { this.editId = null; this.form.reset({ category:'Rap', isFeatured:false, isPublished:true }); this.showForm = true; this.msg=''; this.err=''; }

  openEdit(item: PortfolioItem) {
    this.editId = item._id;
    this.form.patchValue({ title:item.title, artist:item.artist||'', category:item.category,
                           description:item.description||'', isFeatured:item.isFeatured, isPublished:item.isPublished });
    this.showForm = true; this.msg=''; this.err='';
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const req = this.editId
      ? this.svc.updateItem(this.editId, this.form.value as any)
      : this.svc.createItem(this.form.value as any);
    req.subscribe({
      next: () => { this.msg = this.editId ? 'Modifié !' : 'Ajouté !'; this.saving = false; this.showForm = false; this.load(); },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  toggle(item: PortfolioItem) {
    this.svc.updateItem(item._id, { isPublished: !item.isPublished }).subscribe({
      next: r => item.isPublished = r.item.isPublished,
    });
  }

  remove(id: string) {
    if (!confirm('Supprimer cet item ?')) return;
    this.svc.deleteItem(id).subscribe({ next: () => this.load() });
  }
}
