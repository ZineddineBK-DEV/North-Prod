import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { PortfolioItem } from '../../../core/models/portfolio.model';

const CATEGORIES = ['Tous', 'Rap', 'Trap', 'R&B', 'Drill', 'Afrobeats', 'Mixage', 'Mastering'];

// Local fallback items — shown when the API is down
const LOCAL_ITEMS: PortfolioItem[] = [
  { _id:'r1', title:'Sur les Toits',      artist:'MC Tunis',  category:'Rap',       tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:1, views:0, createdAt:'', thumbnail:'music/portfolio/rap_1.jpg' },
  { _id:'r2', title:'Nuit Blanche',       artist:'Freestyle', category:'Rap',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:2, views:0, createdAt:'', thumbnail:'music/portfolio/rap_2.jpg' },
  { _id:'r3', title:'Rue de Carthage',    artist:'Single',    category:'Rap',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:3, views:0, createdAt:'', thumbnail:'music/portfolio/rap_3.jpg' },
  { _id:'t1', title:'Dark Mode',          artist:'EP',        category:'Trap',      tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:4, views:0, createdAt:'', thumbnail:'music/portfolio/trap_1.jpg' },
  { _id:'t2', title:'Minuit',             artist:'NP Beats',  category:'Trap',      tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:5, views:0, createdAt:'', thumbnail:'music/portfolio/trap_2.jpg' },
  { _id:'t3', title:'Zone 7',             artist:'Collab',    category:'Trap',      tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:6, views:0, createdAt:'', thumbnail:'music/portfolio/trap_3.jpg' },
  { _id:'b1', title:'Douce Nuit',         artist:'Album',     category:'R&B',       tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:7, views:0, createdAt:'', thumbnail:'music/portfolio/rnb_1.jpg' },
  { _id:'b2', title:'Mélancolie',         artist:'Single',    category:'R&B',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:8, views:0, createdAt:'', thumbnail:'music/portfolio/rnb_2.jpg' },
  { _id:'b3', title:"Nuage d'Été",        artist:'EP',        category:'R&B',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:9, views:0, createdAt:'', thumbnail:'music/portfolio/rnb_3.jpg' },
  { _id:'d1', title:'Ariana Streets',     artist:'Prod',      category:'Drill',     tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:10,views:0, createdAt:'', thumbnail:'music/portfolio/drill_1.jpg' },
  { _id:'d2', title:'Block Night',        artist:'Collab',    category:'Drill',     tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:11,views:0, createdAt:'', thumbnail:'music/portfolio/drill_2.jpg' },
  { _id:'d3', title:'Underground',        artist:'Single',    category:'Drill',     tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:12,views:0, createdAt:'', thumbnail:'music/portfolio/drill_3.jpg' },
  { _id:'a1', title:'Danse Africaine',    artist:'EP',        category:'Afrobeats', tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:13,views:0, createdAt:'', thumbnail:'music/portfolio/afro_1.jpg' },
  { _id:'a2', title:'Soleil de Tunis',    artist:'Single',    category:'Afrobeats', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:14,views:0, createdAt:'', thumbnail:'music/portfolio/afro_2.jpg' },
  { _id:'a3', title:'Voyage',             artist:'Album',     category:'Afrobeats', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:15,views:0, createdAt:'', thumbnail:'music/portfolio/afro_3.jpg' },
  { _id:'m1', title:'Mixage Studio',      artist:'Projet',    category:'Mixage',    tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:16,views:0, createdAt:'', thumbnail:'music/portfolio/mix_1.jpg' },
  { _id:'m2', title:'Mastering Final',    artist:'2024',      category:'Mixage',    tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:17,views:0, createdAt:'', thumbnail:'music/portfolio/mix_2.jpg' },
  { _id:'x1', title:'Mastering Digital',  artist:'Streaming', category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:18,views:0, createdAt:'', thumbnail:'music/portfolio/master_1.jpg' },
  { _id:'x2', title:'Mastering Vinyl',    artist:'Digital',   category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:19,views:0, createdAt:'', thumbnail:'music/portfolio/master_2.jpg' },
  { _id:'x3', title:'Broadcast Master',   artist:'Radio',     category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:20,views:0, createdAt:'', thumbnail:'music/portfolio/master_3.jpg' },
];

@Component({
  selector: 'app-music-artist',
  templateUrl: './music-artist.html',
  styleUrls: ['./music-artist.scss'],
  imports: [RouterLink, CommonModule],
})
export class MusicArtist implements OnInit {
  private portfolioSvc = inject(PortfolioService);

  categories     = CATEGORIES;
  activeCategory = 'Tous';
  allItems       = LOCAL_ITEMS;  // starts with local data
  loading        = true;

  get items(): PortfolioItem[] {
    const filtered = this.activeCategory === 'Tous'
      ? this.allItems
      : this.allItems.filter(i => i.category === this.activeCategory);
    return filtered.slice(0, 6);
  }

  ngOnInit() { this.loadFromApi(); }

  loadFromApi() {
    this.loading = true;
    this.portfolioSvc.getItems({ limit: 100 }).subscribe({
      next: (res) => {
        if (res.items?.length) this.allItems = res.items;
        this.loading = false;
      },
      error: () => { this.loading = false; /* keep local items */ },
    });
  }

  filter(cat: string) { this.activeCategory = cat; }

  getThumb(item: PortfolioItem): string {
    if (!item.thumbnail) return 'assets/images/music/portfolio/default_1.jpg';
    // API items have a server path; local items already have an assets path
    if (item.thumbnail.startsWith('music/')) return `assets/images/${item.thumbnail}`;
    return `/uploads/${item.thumbnail}`;
  }
}
