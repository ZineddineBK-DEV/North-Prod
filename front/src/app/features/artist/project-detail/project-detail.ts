import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { environment } from '../../../../environments/environment';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/artist/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/artist/bookings'  },
  { label:'Mes Projets',     icon:'fa fa-music',      route:'/artist/projects'  },
  { label:'Messages',        icon:'fa fa-comments',   route:'/artist/messages'  },
  { label:'Mon Profil',      icon:'fa fa-user',       route:'/artist/profile'   },
];

const STAGES = ['pending','recording','mixing','mastering','finalization','delivered'];
const STAGE_LABELS: Record<string,string> = { pending:'En attente', recording:'Enregistrement', mixing:'Mixage', mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' };
const STAGE_COLORS: Record<string,string> = { pending:'#888', recording:'#3498db', mixing:'#9b59b6', mastering:'#e67e22', finalization:'#f1c40f', delivered:'#2ecc71' };

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss'],
  imports: [DashboardShellComponent, RouterLink, ReactiveFormsModule],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProjectService);
  private fb    = inject(FormBuilder);

  navItems  = NAV;
  project: Project | null = null;
  loading   = true;
  stages    = STAGES;
  stageLabels = STAGE_LABELS;
  stageColors = STAGE_COLORS;
  activeTab = 'history';
  apiBase   = environment.apiUrl.replace('/api','');

  ngOnInit() {
    this.route.params.subscribe(p => this.load(p['id']));
  }

  load(id: string) {
    this.loading = true;
    this.svc.getProject(id).subscribe({
      next: res => { this.project = res.project; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  stageIndex(s: string) { return STAGES.indexOf(s); }
  stageColor(s: string) { return STAGE_COLORS[s] || '#888'; }
  stageLabel(s: string) { return STAGE_LABELS[s] || s; }
  formatDate(d: string) { return new Date(d).toLocaleString('fr-FR', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  fileIcon(ext: string) {
    if (['wav','mp3','aiff','flac','ogg'].includes(ext)) return 'fa fa-file-audio-o';
    if (['jpg','jpeg','png','psd','webp'].includes(ext)) return 'fa fa-file-image-o';
    if (['mp4','mov','avi'].includes(ext)) return 'fa fa-file-video-o';
    return 'fa fa-file-o';
  }
}
