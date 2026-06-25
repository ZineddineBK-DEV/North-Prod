const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────
// SERVICE MODEL (pricing cards)
// ─────────────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    price:       { type: Number, required: true },
    unit:        { type: String, required: true }, // 'heure', 'titre', 'track'
    icon:        { type: String },                  // font-awesome or flaticon class
    features:    [{ type: String }],                // bullet list of features
    isPopular:   { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ isActive: 1, order: 1 });

// ─────────────────────────────────────────────────────────
// HERO MEDIA MODEL (admin-controlled hero video/image)
// ─────────────────────────────────────────────────────────
const heroMediaSchema = new mongoose.Schema(
  {
    // Only one active hero at a time
    isActive: { type: Boolean, default: false },

    mediaType: {
      type: String,
      enum: ['upload', 'youtube', 'vimeo'],
      required: true,
    },

    // For uploaded video
    filePath: { type: String },
    fileName: { type: String },

    // For YouTube/Vimeo embed
    embedUrl: { type: String },
    videoId:  { type: String },

    // Overlay content
    title:    { type: String, maxlength: 120 },
    subtitle: { type: String, maxlength: 200 },
    cta: [
      {
        label: { type: String },
        link:  { type: String },
        style: { type: String, enum: ['primary', 'secondary', 'outline'], default: 'primary' },
      },
    ],

    // Playback
    autoplay: { type: Boolean, default: true },
    muted:    { type: Boolean, default: true },
    loop:     { type: Boolean, default: true },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

heroMediaSchema.index({ isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);
const HeroMedia = mongoose.model('HeroMedia', heroMediaSchema);

module.exports = { Service, HeroMedia };
