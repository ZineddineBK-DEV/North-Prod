const mongoose = require('mongoose');

const PORTFOLIO_CATEGORIES = [
  'Rap', 'Trap', 'Drill', 'LoFi', 'Old School',
  'Freestyle', 'R&B', 'Afrobeats', 'Pop', 'Rock',
  'Jazz', 'Soul', 'Electronic', 'Mixage', 'Mastering', 'Autre',
];

const portfolioSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true, maxlength: 120 },
    artist:   { type: String, trim: true, maxlength: 100 },
    category: { type: String, enum: PORTFOLIO_CATEGORIES, required: true },
    tags:     [{ type: String, trim: true }],

    description: { type: String, maxlength: 1000 },

    // ── Media ─────────────────────────────────────────────
    thumbnail:  { type: String },           // image path
    mediaType:  { type: String, enum: ['image', 'video', 'audio'], default: 'image' },
    mediaUrl:   { type: String },           // file path or embed URL
    embedUrl:   { type: String },           // YouTube/SoundCloud embed

    // ── Display ───────────────────────────────────────────
    isFeatured:  { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    order:       { type: Number, default: 0 },

    // ── Stats ─────────────────────────────────────────────
    views:       { type: Number, default: 0 },

    year:        { type: Number },
  },
  { timestamps: true }
);

portfolioSchema.index({ category: 1, isPublished: 1 });
portfolioSchema.index({ isFeatured: 1 });
portfolioSchema.index({ order: 1 });
portfolioSchema.index({ title: 'text', artist: 'text', tags: 'text' });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
