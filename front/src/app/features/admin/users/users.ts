import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2>Gestion des utilisateurs</h2>
      <p>Liste et gestion des comptes artistes et membres de l'équipe.</p>
    </div>
  `,
})
export class AdminUsersComponent {}
