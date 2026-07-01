import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-users',
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private fb   = inject(FormBuilder);

  users: any[]  = [];
  loading = true;
  total   = 0;
  page    = 1;
  search  = '';
  filterRole = 'all';

  roles = [
    { value:'all',        label:'Tous' },
    { value:'artist',     label:'Artistes' },
    { value:'production', label:'Production' },
    { value:'admin',      label:'Admins' },
  ];

  searchForm = this.fb.group({ q: [''] });

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    let p = new HttpParams().set('page', this.page).set('limit', '20');
    if (this.search)                    p = p.set('search', this.search);
    if (this.filterRole !== 'all')      p = p.set('role',   this.filterRole);

    this.http.get<any>(`${environment.apiUrl}/admin/users`, { params: p }).subscribe({
      next: r  => { this.users = r.users; this.total = r.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onSearch() { this.search = this.searchForm.value.q || ''; this.page = 1; this.load(); }

  setRole(role: string) { this.filterRole = role; this.page = 1; this.load(); }

  toggleActive(u: any) {
    this.http.put<any>(`${environment.apiUrl}/admin/users/${u._id}`,
                       { isActive: !u.isActive }).subscribe({ next: r => u.isActive = r.user.isActive });
  }

  changeRole(u: any, role: string) {
    this.http.put<any>(`${environment.apiUrl}/admin/users/${u._id}`,
                       { role }).subscribe({ next: r => u.role = r.user.role });
  }

  roleLabel(r: string) {
    return ({artist:'Artiste',production:'Production',admin:'Admin'})[r] || r;
  }
  roleClass(r: string) {
    return ({artist:'badge-ok',production:'badge-blue',admin:'badge-gold'})[r] || '';
  }
}
