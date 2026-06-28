import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.scss'],
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
})
export class ProjectDetailComponent implements OnInit {
  private svc    = inject(ProjectService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  project: Project | null = null;
  loading = true;
  err = '';

  commentForm = this.fb.group({ comment: ['', Validators.required] });
  sendingComment = false;

  stageColors: Record<string,string> = {
    pending:'#888', recording:'#3498db', mixing:'#9b59b6',
    mastering:'#e67e22', finalization:'#f39c12', delivered:'#2ecc71',
  };

  stages = ['pending','recording','mixing','mastering','finalization','delivered'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getProject(id).subscribe({
      next: r => { this.project = r.project; this.loading = false; },
      error: () => { this.err = 'Projet introuvable.'; this.loading = false; },
    });
  }

  stageLabel(s: string) {
    return ({pending:'En attente',recording:'Enregistrement',mixing:'Mixage',
             mastering:'Mastering',finalization:'Finalisation',delivered:'Livré'})[s] || s;
  }
  stageColor(s: string) { return this.stageColors[s] || '#888'; }

  stageIndex(s: string) { return this.stages.indexOf(s); }

  sendComment() {
    if (this.commentForm.invalid || !this.project) return;
    this.sendingComment = true;
    this.svc.addComment(this.project._id, this.commentForm.value.comment!).subscribe({
      next: r => {
        this.project!.history = r.history;
        this.commentForm.reset();
        this.sendingComment = false;
      },
      error: () => { this.sendingComment = false; },
    });
  }
}
