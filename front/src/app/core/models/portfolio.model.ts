export interface PortfolioItem {
  _id: string;
  title: string;
  artist?: string;
  category: string;
  tags: string[];
  description?: string;
  thumbnail?: string;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl?: string;
  embedUrl?: string;
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
  views: number;
  year?: number;
  createdAt: string;
}

export interface Service {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  unit: string;
  icon?: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  order: number;
}

export interface HeroMedia {
  _id: string;
  isActive: boolean;
  mediaType: 'upload' | 'youtube' | 'vimeo';
  filePath?: string;
  embedUrl?: string;
  videoId?: string;
  title?: string;
  subtitle?: string;
  cta: Array<{ label: string; link: string; style: string }>;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
}
