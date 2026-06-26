import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-artist-profile',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="artist-page">
      <h2>Mon Profil</h2>
      <p>Modifiez vos informations personnelles, votre biographie et vos liens réseaux sociaux.</p>
    </div>
  `,
})
export class ArtistProfileComponent {
  auth = inject(AuthService);
}
