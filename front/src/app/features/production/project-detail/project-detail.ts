import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { ProjectService } from '../../../core/services/project.service';
import { environment } from '../../../../environments/environment';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/production/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/production/bookings'  },
  { label:'Projets',         icon:'fa fa-music',      route:'/production/projects'  },
];
const STAGES = ['pending','recording','mixing','mastering','finalization','delivered'];
const STAGE_LABELS: Record<string,string> = { pending:'En attente', recording:'Enregistrement', mixing:'Mixage', mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' };
const STAGE_COLORS: Record<string,string> = { pending:'#888', recording:'#3498db', mixing:'#9b59b6', mastering:'#e67e22', finalization:'#f1c40f', delivered:'#2ecc71' };

@Component({
  selector: 'app-production-project-detail',
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss'],
  imports: [DashboardShellComponent, RouterLink, ReactiveFormsModule],
})
export class ProductionProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProjectService);
  private fb    = inject(FormBuilder);
  private http  = inject(HttpClient);

  navItems = NAV;
  stages   = STAGES;
  project: any = null;
  loading  = true;
  saving   = false;
  error    = '';
  success  = '';
  activeTab = 'update';
  uploadingFile = false;
  apiBase  = environment.apiUrl.replace('/api', '');

  stageForm = this.fb.group({
    stage:   ['', Validators.required],
    comment: [''],
  });
  commentForm = this.fb.group({ comment: ['', Validators.required] });

  ngOnInit() { this.route.params.subscribe(p => this.load(p['id'])); }

  load(id: string) {
    this.loading = true;
    this.svc.getProject(id).subscribe({
      next: res => {
        this.project = res.project;
        this.stageForm.patchValue({ stage: res.project.stage });
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateStage() {
    if (this.stageForm.invalid || !this.project) return;
    this.saving = true; this.error = ''; this.success = '';
    const { stage, comment } = this.stageForm.value;
    this.svc.updateStage(this.project._id, stage as any, comment || undefined).subscribe({
      next: res => {
        this.project = res.project;
        this.success = `Étape mise à jour : ${STAGE_LABELS[stage!]}`;
        this.saving  = false;
      },
      error: err => { this.error = err.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  addComment() {
    if (this.commentForm.invalid || !this.project) return;
    this.saving = true;
    this.svc.addComment(this.project._id, this.commentForm.value.comment!).subscribe({
      next: () => {
        this.success = 'Commentaire ajouté.';
        this.commentForm.reset();
        this.saving  = false;
        this.load(this.project._id);
      },
      error: err => { this.error = err.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  uploadFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.project) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('projectId', this.project._id);
    this.uploadingFile = true;
    this.http.post<any>(`${environment.apiUrl}/files/upload`, fd).subscribe({
      next: () => { this.uploadingFile = false; this.success = 'Fichier uploadé.'; this.load(this.project._id); },
      error: err => { this.uploadingFile = false; this.error = err.error?.message || 'Erreur upload.'; },
    });
  }

  stageLabel(s: string) { return STAGE_LABELS[s] || s; }
  stageColor(s: string) { return STAGE_COLORS[s] || '#888'; }
  stageIndex(s: string) { return STAGES.indexOf(s); }
  fileIcon(ext: string) {
    if (['wav','mp3','aiff','flac'].includes(ext)) return 'fa fa-file-audio-o';
    if (['jpg','jpeg','png','psd'].includes(ext))  return 'fa fa-file-image-o';
    if (['mp4','mov'].includes(ext))               return 'fa fa-file-video-o';
    return 'fa fa-file-o';
  }
  formatDate(d: string) {
    return new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
