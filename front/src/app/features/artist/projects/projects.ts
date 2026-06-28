import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-artist-projects',
  templateUrl: './projects.html',
  styleUrls: ['./projects.scss'],
  imports: [CommonModule, RouterLink, DatePipe],
})
export class ArtistProjectsComponent implements OnInit {
  private svc = inject(ProjectService);
  projects: Project[] = [];
  loading = true;
  filterStage = 'all';

  stages = [
    { value:'all',         label:'Tous' },
    { value:'pending',     label:'En attente' },
    { value:'recording',   label:'Enregistrement' },
    { value:'mixing',      label:'Mixage' },
    { value:'mastering',   label:'Mastering' },
    { value:'finalization',label:'Finalisation' },
    { value:'delivered',   label:'Livrés' },
  ];

  stageColors: Record<string,string> = {
    pending:'#888', recording:'#3498db', mixing:'#9b59b6',
    mastering:'#e67e22', finalization:'#f39c12', delivered:'#2ecc71',
  };

  get filtered() {
    return this.filterStage === 'all'
      ? this.projects
      : this.projects.filter(p => p.stage === this.filterStage);
  }

  ngOnInit() {
    this.svc.getMyProjects().subscribe({
      next: r => { this.projects = r.projects; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  stageLabel(s: string) {
    return this.stages.find(x => x.value === s)?.label || s;
  }
  stageColor(s: string) { return this.stageColors[s] || '#888'; }
}
