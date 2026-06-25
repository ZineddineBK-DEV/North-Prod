import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Project, ProjectStage } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly API = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  getMyProjects(params?: { stage?: string; archived?: boolean; page?: number }) {
    let httpParams = new HttpParams();
    if (params?.stage) httpParams = httpParams.set('stage', params.stage);
    if (params?.archived !== undefined) httpParams = httpParams.set('archived', params.archived.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    return this.http.get<{ success: boolean; projects: Project[]; total: number }>(
      this.API, { params: httpParams }
    );
  }

  getProject(id: string) {
    return this.http.get<{ success: boolean; project: Project }>(`${this.API}/${id}`);
  }

  updateStage(id: string, stage: ProjectStage, comment?: string) {
    return this.http.put<{ success: boolean; project: Project }>(
      `${this.API}/${id}/stage`, { stage, comment }
    );
  }

  addComment(id: string, comment: string) {
    return this.http.post<{ success: boolean; history: any[] }>(
      `${this.API}/${id}/comment`, { comment }
    );
  }

  updateDetails(id: string, data: Partial<Project>) {
    return this.http.put<{ success: boolean; project: Project }>(
      `${this.API}/${id}/details`, data
    );
  }
}
