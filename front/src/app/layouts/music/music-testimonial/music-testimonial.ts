import { Component } from '@angular/core';

@Component({
  selector: 'app-music-testimonial',
  templateUrl: './music-testimonial.html',
  styleUrls: ['./music-testimonial.scss'],
})
export class MusicTestimonial {
  testimonials = [
    { name: 'Yassine B.', genre: 'Rap / Trap', text: 'NORTH PROD c\'est le studio où j\'ai enregistré mes meilleurs titres. L\'équipe est professionnelle, le son est impeccable. Je ne vais nulle part ailleurs.' },
    { name: 'Mariem S.', genre: 'R&B / Soul', text: 'L\'ambiance du studio est incroyable. On se sent vraiment chez soi. Le mixage de mon EP a été fait en une journée et le rendu était parfait.' },
    { name: 'Hamza K.', genre: 'Drill / Afrobeats', text: 'Plateforme top ! Je gère mes réservations facilement, je reçois mes fichiers directement dans l\'espace artiste. C\'est le futur du studio en Tunisie.' },
  ];
}
