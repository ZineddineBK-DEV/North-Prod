import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-portfolio',
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <h2>Gestion du Portfolio</h2>
      <p>Ajoutez, modifiez ou supprimez les productions du portfolio public.</p>
    </div>
  `,
})
export class AdminPortfolioComponent {}
