import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PortfolioService } from '../../core/services/portfolio.service';
import { PortfolioItem } from '../../core/models/portfolio.model';

const CATEGORIES = ['Tous', 'Rap', 'Trap', 'R&B', 'Drill', 'Afrobeats', 'Mixage', 'Mastering'];
const PAGE_SIZE = 12;

// Local fallback items — shown when the API is unavailable, mirrors the homepage preview list
const LOCAL_ITEMS: PortfolioItem[] = [
  { _id:'r1', title:'Sur les Toits',      artist:'MC Tunis',  category:'Rap',       tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:1,  views:0, createdAt:'', thumbnail:'music/portfolio/rap_1.jpg' },
  { _id:'r2', title:'Nuit Blanche',       artist:'Freestyle', category:'Rap',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:2,  views:0, createdAt:'', thumbnail:'music/portfolio/rap_2.jpg' },
  { _id:'r3', title:'Rue de Carthage',    artist:'Single',    category:'Rap',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:3,  views:0, createdAt:'', thumbnail:'music/portfolio/rap_3.jpg' },
  { _id:'t1', title:'Dark Mode',          artist:'EP',        category:'Trap',      tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:4,  views:0, createdAt:'', thumbnail:'music/portfolio/trap_1.jpg' },
  { _id:'t2', title:'Minuit',             artist:'NP Beats',  category:'Trap',      tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:5,  views:0, createdAt:'', thumbnail:'music/portfolio/trap_2.jpg' },
  { _id:'t3', title:'Zone 7',             artist:'Collab',    category:'Trap',      tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:6,  views:0, createdAt:'', thumbnail:'music/portfolio/trap_3.jpg' },
  { _id:'b1', title:'Douce Nuit',         artist:'Album',     category:'R&B',       tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:7,  views:0, createdAt:'', thumbnail:'music/portfolio/rnb_1.jpg' },
  { _id:'b2', title:'Mélancolie',         artist:'Single',    category:'R&B',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:8,  views:0, createdAt:'', thumbnail:'music/portfolio/rnb_2.jpg' },
  { _id:'b3', title:"Nuage d'Été",        artist:'EP',        category:'R&B',       tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:9,  views:0, createdAt:'', thumbnail:'music/portfolio/rnb_3.jpg' },
  { _id:'d1', title:'Ariana Streets',     artist:'Prod',      category:'Drill',     tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:10, views:0, createdAt:'', thumbnail:'music/portfolio/drill_1.jpg' },
  { _id:'d2', title:'Block Night',        artist:'Collab',    category:'Drill',     tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:11, views:0, createdAt:'', thumbnail:'music/portfolio/drill_2.jpg' },
  { _id:'d3', title:'Underground',        artist:'Single',    category:'Drill',     tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:12, views:0, createdAt:'', thumbnail:'music/portfolio/drill_3.jpg' },
  { _id:'a1', title:'Danse Africaine',    artist:'EP',        category:'Afrobeats', tags:[], mediaType:'image', isFeatured:true,  isPublished:true, order:13, views:0, createdAt:'', thumbnail:'music/portfolio/afro_1.jpg' },
  { _id:'a2', title:'Soleil de Tunis',    artist:'Single',    category:'Afrobeats', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:14, views:0, createdAt:'', thumbnail:'music/portfolio/afro_2.jpg' },
  { _id:'a3', title:'Voyage',             artist:'Album',     category:'Afrobeats', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:15, views:0, createdAt:'', thumbnail:'music/portfolio/afro_3.jpg' },
  { _id:'m1', title:'Mixage Studio',      artist:'Projet',    category:'Mixage',    tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:16, views:0, createdAt:'', thumbnail:'music/portfolio/mix_1.jpg' },
  { _id:'m2', title:'Mastering Final',    artist:'2024',      category:'Mixage',    tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:17, views:0, createdAt:'', thumbnail:'music/portfolio/mix_2.jpg' },
  { _id:'x1', title:'Mastering Digital',  artist:'Streaming', category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:18, views:0, createdAt:'', thumbnail:'music/portfolio/master_1.jpg' },
  { _id:'x2', title:'Mastering Vinyl',    artist:'Digital',   category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:19, views:0, createdAt:'', thumbnail:'music/portfolio/master_2.jpg' },
  { _id:'x3', title:'Broadcast Master',   artist:'Radio',     category:'Mastering', tags:[], mediaType:'image', isFeatured:false, isPublished:true, order:20, views:0, createdAt:'', thumbnail:'music/portfolio/master_3.jpg' },
];

@Component({
  selector: 'app-portfolio-page',
  templateUrl: './portfolio-page.html',
  styleUrls: ['./portfolio-page.scss'],
  imports: [CommonModule, RouterLink],
})
export class PortfolioPageComponent implements OnInit, OnDestroy {
  @ViewChild('audioEl') audioEl?: ElementRef<HTMLAudioElement>;

  private svc   = inject(PortfolioService);
  private title = inject(Title);

  categories     = CATEGORIES;
  activeCategory = 'Tous';
  allItems: PortfolioItem[] = LOCAL_ITEMS;
  loading        = true;
  loadingMore    = false;

  visibleCount = PAGE_SIZE;

  // ── Side media player state ───────────────────────────────
  playerOpen   = false;
  current: PortfolioItem | null = null;
  isPlaying    = false;

  get filtered(): PortfolioItem[] {
    return this.activeCategory === 'Tous'
      ? this.allItems
      : this.allItems.filter(i => i.category === this.activeCategory);
  }

  get visibleItems(): PortfolioItem[] {
    return this.filtered.slice(0, this.visibleCount);
  }

  get hasMore(): boolean {
    return this.visibleCount < this.filtered.length;
  }

  ngOnInit() {
    this.title.setTitle('Portfolio — NORTH PROD');
    this.loadFromApi();
    document.addEventListener('keydown', this.onKeydown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  private onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.playerOpen) this.closePlayer();
  };

  loadFromApi() {
    this.loading = true;
    this.svc.getItems({ limit: 200 }).subscribe({
      next: (res) => {
        if (res.items?.length) this.allItems = res.items;
        this.loading = false;
      },
      error: () => { this.loading = false; /* keep local fallback items */ },
    });
  }

  filter(cat: string) {
    this.activeCategory = cat;
    this.visibleCount = PAGE_SIZE;
  }

  loadMore() {
    this.loadingMore = true;
    setTimeout(() => {
      this.visibleCount += PAGE_SIZE;
      this.loadingMore = false;
    }, 200);
  }

  getThumb(item: PortfolioItem): string {
    if (!item.thumbnail) return 'assets/images/music/portfolio/default_1.jpg';
    if (item.thumbnail.startsWith('music/')) return `assets/images/${item.thumbnail}`;
    return `/uploads/${item.thumbnail}`;
  }

  // ── Player controls ────────────────────────────────────────
  openItem(item: PortfolioItem) {
    this.current = item;
    this.playerOpen = true;
    this.isPlaying = false;
    // Defer so the <audio>/<video> element exists before we try to play it
    setTimeout(() => this.tryAutoplay(), 50);
  }

  closePlayer() {
    this.playerOpen = false;
    this.isPlaying = false;
    this.audioEl?.nativeElement?.pause();
  }

  private tryAutoplay() {
    const el = this.audioEl?.nativeElement;
    if (!el || this.current?.mediaType !== 'audio') return;
    el.play().then(() => this.isPlaying = true).catch(() => this.isPlaying = false);
  }

  togglePlay() {
    const el = this.audioEl?.nativeElement;
    if (!el) return;
    if (el.paused) { el.play(); this.isPlaying = true; }
    else { el.pause(); this.isPlaying = false; }
  }

  playNext() {
    if (!this.current) return;
    const list = this.filtered;
    const idx = list.findIndex(i => i._id === this.current!._id);
    const next = list[(idx + 1) % list.length];
    if (next) this.openItem(next);
  }

  playPrev() {
    if (!this.current) return;
    const list = this.filtered;
    const idx = list.findIndex(i => i._id === this.current!._id);
    const prev = list[(idx - 1 + list.length) % list.length];
    if (prev) this.openItem(prev);
  }

  getMediaUrl(item: PortfolioItem): string {
    if (!item.mediaUrl) return '';
    return item.mediaUrl.startsWith('http') ? item.mediaUrl : `/uploads/${item.mediaUrl}`;
  }
}
