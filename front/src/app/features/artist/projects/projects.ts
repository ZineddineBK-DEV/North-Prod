import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardShellComponent, NavItem } from '../../../shared/components/dashboard-shell/dashboard-shell';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

const STAGES = [
  { key:'pending',      label:'En attente',    color:'#888' },
  { key:'recording',    label:'Enregistrement',color:'#3498db' },
  { key:'mixing',       label:'Mixage',        color:'#9b59b6' },
  { key:'mastering',    label:'Mastering',     color:'#e67e22' },
  { key:'finalization', label:'Finalisation',  color:'#f1c40f' },
  { key:'delivered',    label:'Livré',         color:'#2ecc71' },
];

@Component({
  selector: 'app-artist-projects',
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss'],
  imports: [DashboardShellComponent, RouterLink],
})
export class ArtistProjectsComponent implements OnInit {
  private svc = inject(ProjectService);
  stages = STAGES;
  projects: Project[] = [];
  loading = true;
  filterStage = '';

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: 'fa fa-tachometer', route: '/artist/dashboard' },
    { label: 'Réservations',    icon: 'fa fa-calendar',   route: '/artist/bookings'  },
    { label: 'Mes Projets',     icon: 'fa fa-music',      route: '/artist/projects'  },
    { label: 'Messages',        icon: 'fa fa-comments',   route: '/artist/messages'  },
    { label: 'Mon Profil',      icon: 'fa fa-user',       route: '/artist/profile'   },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params = this.filterStage ? { stage: this.filterStage } : {};
    this.svc.getMyProjects(params).subscribe({
      next: res => { this.projects = res.projects; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  setFilter(s: string) { this.filterStage = s; this.load(); }
  getStage(key: string) { return STAGES.find(s => s.key === key); }
  isPipelineDone(currentStage: string, stageKey: string): boolean {
    const order = ['pending','recording','mixing','mastering','finalization','delivered'];
    return order.indexOf(currentStage) > order.indexOf(stageKey);
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }); }
}

// Add to class body — isPipelineDone helper
