import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectStage } from '../../../core/models/project.model';

@Component({
  selector: 'app-production-project-detail',
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss'],
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
})
export class ProductionProjectDetailComponent implements OnInit {
  private svc   = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private fb    = inject(FormBuilder);

  project: Project | null = null;
  loading = true;
  saving  = false;
  msg = ''; err = '';

  stageList: ProjectStage[] = ['pending','recording','mixing','mastering','finalization','delivered'];

  stageColors: Record<string, string> = {
    pending:'#888', recording:'#3498db', mixing:'#9b59b6',
    mastering:'#e67e22', finalization:'#f39c12', delivered:'#2ecc71',
  };

  advanceForm = this.fb.group({
    stage:   ['' as ProjectStage, Validators.required],
    progress:[0,  [Validators.required, Validators.min(0), Validators.max(100)]],
    comment: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getProject(id).subscribe({
      next: r => {
        this.project = r.project;
        this.loading = false;
        this.advanceForm.patchValue({ stage: r.project.stage, progress: r.project.progress });
      },
      error: () => { this.loading = false; },
    });
  }

  save() {
    if (!this.project || this.advanceForm.invalid) return;
    this.saving = true; this.msg = ''; this.err = '';
    const { stage, progress, comment } = this.advanceForm.value;

    // Update stage + comment first, then update progress via updateDetails
    this.svc.updateStage(this.project._id, stage as ProjectStage, comment || '').subscribe({
      next: r => {
        // Update progress separately
        this.svc.updateDetails(r.project._id, { progress: progress as number }).subscribe({
          next: r2 => {
            this.project = r2.project;
            this.saving = false;
            this.msg = 'Projet mis à jour avec succès.';
          },
          error: () => {
            this.project = r.project;
            this.saving = false;
            this.msg = 'Étape mise à jour (progression non modifiée).';
          },
        });
      },
      error: e => { this.err = e.error?.message || 'Erreur.'; this.saving = false; },
    });
  }

  stageLabel(s: string) {
    return ({pending:'En attente',recording:'Enregistrement',mixing:'Mixage',
             mastering:'Mastering',finalization:'Finalisation',delivered:'Livré'})[s] || s;
  }
  stageColor(s: string) { return this.stageColors[s] || '#888'; }
  stageIndex(s: string) { return this.stageList.indexOf(s as ProjectStage); }
}
