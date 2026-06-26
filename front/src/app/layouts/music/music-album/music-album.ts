import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceApiService } from '../../../core/services/portfolio.service';
import { Service } from '../../../core/models/portfolio.model';

@Component({
  selector: 'app-music-album',
  templateUrl: './music-album.html',
  styleUrls: ['./music-album.scss'],
  imports: [RouterLink],
})
export class MusicAlbum implements OnInit {
  private svc = inject(ServiceApiService);
  services: Service[] = [];
  loading = true;

  // Fallback data if API not ready
  fallback: Service[] = [
    { _id:'1', name:'Séance Record', slug:'record', description:'Enregistrement vocal et instrumental avec ingénieur du son.', price:99, unit:'heure', icon:'fa fa-microphone', features:['Ingénieur du son inclus','Console SSL','Cabine acoustique','Retours casque','Fichiers WAV 24bit'], isPopular:false, isActive:true, order:1 },
    { _id:'2', name:'Forfait / Titre', slug:'forfait', description:'Enregistrement complet d\'un titre : voix, adlibs, harmonies.', price:120, unit:'titre', icon:'fa fa-music', features:['Enregistrement complet','Voix + Adlibs + Harmonies','Stems séparés','Session illimitée','Révision incluse'], isPopular:true, isActive:true, order:2 },
    { _id:'3', name:'Location Studio', slug:'location', description:'Accès complet au studio sans ingénieur, pour les producteurs.', price:190, unit:'heure', icon:'fa fa-sliders', features:['Accès complet au studio','Sans ingénieur du son','Console SSL','Monitoring Genelec','Pro Tools / Logic Pro'], isPopular:false, isActive:true, order:3 },
    { _id:'4', name:'Mixage / Mastering', slug:'mix', description:'Mixage professionnel et mastering pour toutes les plateformes.', price:80, unit:'track', icon:'fa fa-volume-up', features:['Mixage complet','Mastering stéréo','WAV + MP3','Compatible streaming','1 révision incluse'], isPopular:false, isActive:true, order:4 },
  ];

  ngOnInit() {
    this.svc.getServices().subscribe({
      next: (res) => { this.services = res.services.length ? res.services : this.fallback; this.loading = false; },
      error: () => { this.services = this.fallback; this.loading = false; },
    });
  }
}
