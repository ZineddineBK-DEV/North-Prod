import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-services',
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2>Gestion des Services & Tarifs</h2>
      <p>Configurez les services proposés et les grilles tarifaires.</p>
    </div>
  `,
})
export class AdminServicesComponent {}
