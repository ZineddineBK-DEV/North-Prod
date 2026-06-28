import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { ProjectService } from '../../../core/services/project.service';

const NAV: NavItem[] = [
  { label:'Tableau de bord', icon:'fa fa-tachometer', route:'/production/dashboard' },
  { label:'Réservations',    icon:'fa fa-calendar',   route:'/production/bookings'  },
  { label:'Projets',         icon:'fa fa-music',      route:'/production/projects'  },
];
const STAGES = ['pending','recording','mixing','mastering','finalization','delivered'];
const STAGE_LABELS: Record<string,string> = { pending:'En attente', recording:'Enregistrement', mixing:'Mixage', mastering:'Mastering', finalization:'Finalisation', delivered:'Livré' };
const STAGE_COLORS: Record<string,string> = { pending:'#888', recording:'#3498db', mixing:'#9b59b6', mastering:'#e67e22', finalization:'#f1c40f', delivered:'#2ecc71' };

@Component({
  selector: 'app-production-projects',
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss'],
  imports: [DashboardShellComponent, RouterLink],
})
export class ProductionProjectsComponent implements OnInit {
  private svc = inject(ProjectService);
  navItems    = NAV;
  stages      = STAGES;
  projects: any[] = [];
  loading     = true;
  filterStage = '';

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params = this.filterStage ? { stage: this.filterStage } : {};
    this.svc.getMyProjects(params).subscribe({
      next: res => { this.projects = res.projects; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  setFilter(s: string) { this.filterStage = s; this.load(); }
  stageLabel(s: string) { return STAGE_LABELS[s] || s; }
  stageColor(s: string) { return STAGE_COLORS[s] || '#888'; }
  formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }
}
