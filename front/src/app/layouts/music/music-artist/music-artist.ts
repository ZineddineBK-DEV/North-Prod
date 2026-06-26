import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { PortfolioItem } from '../../../core/models/portfolio.model';

const CATEGORIES = ['Tous','Rap','Trap','R&B','Drill','Afrobeats','Mixage','Mastering'];

@Component({
  selector: 'app-music-artist',
  templateUrl: './music-artist.html',
  styleUrls: ['./music-artist.scss'],
  imports: [RouterLink],
})
export class MusicArtist implements OnInit {
  private portfolioSvc = inject(PortfolioService);
  categories = CATEGORIES;
  activeCategory = 'Tous';
  items: PortfolioItem[] = [];
  loading = true;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params = this.activeCategory !== 'Tous' ? { category: this.activeCategory, limit: 6 } : { limit: 6 };
    this.portfolioSvc.getItems(params).subscribe({
      next: (res) => { this.items = res.items; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  filter(cat: string) { this.activeCategory = cat; this.load(); }
  getThumb(item: PortfolioItem) { return item.thumbnail ? `/uploads/${item.thumbnail}` : 'assets/images/music/default-portfolio.jpg'; }
}
