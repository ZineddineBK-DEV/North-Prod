import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="artist-page">
      <h2>Détail du Projet</h2>
      <p>Projet ID : {{ projectId }}</p>
      <a routerLink="../..">← Retour aux projets</a>
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  projectId = '';

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
  }
}
