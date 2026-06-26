const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MUSICAL_GENRES = [
  'Rap', 'Trap', 'Drill', 'LoFi', 'Old School',
  'Freestyle', 'R&B', 'Afrobeats', 'Pop', 'Rock',
  'Jazz', 'Soul', 'Electronic', 'Autre',
];

const ROLES = ['artist', 'production', 'admin'];

const userSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────
    aka: {
      type: String,
      required: [true, 'Le nom de scène (AKA) est obligatoire'],
      trim: true,
      maxlength: [60, 'AKA trop long (max 60 caractères)'],
    },
    firstName: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },

    // ── Auth ──────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{8,20}$/, 'Numéro de téléphone invalide'],
    },

    // ── Role & Status ─────────────────────────────────────
    role: {
      type: String,
      enum: ROLES,
      default: 'artist',
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // ── Password reset ────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Remember me / Refresh token ───────────────────────
    refreshToken: { type: String, select: false },

    // ── Profile ───────────────────────────────────────────
    bio: {
      type: String,
      maxlength: [500, 'Biographie trop longue (max 500 caractères)'],
    },
    musicalGenres: {
      type: [String],
      enum: MUSICAL_GENRES,
      default: [],
    },
    avatar: { type: String, default: null },   // path relative to /uploads/
    coverImage: { type: String, default: null },

    // ── Social links ──────────────────────────────────────
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook:  { type: String, default: '' },
      youtube:   { type: String, default: '' },
      spotify:   { type: String, default: '' },
      soundcloud:{ type: String, default: '' },
      tiktok:    { type: String, default: '' },
    },

    // ── Notification preferences ──────────────────────────
    notificationPrefs: {
      email: { type: Boolean, default: true },
      web:   { type: Boolean, default: true },
    },

    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ──────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('avatarUrl').get(function () {
  if (!this.avatar) return null;
  return `/uploads/${this.avatar}`;
});

userSchema.virtual('coverUrl').get(function () {
  if (!this.coverImage) return null;
  return `/uploads/${this.coverImage}`;
});

// ── Pre-save: hash password ───────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ─────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Index ─────────────────────────────────────────────────
// Note: email index is created automatically via unique:true in the field definition
userSchema.index({ role: 1 });
userSchema.index({ aka: 'text', firstName: 'text', lastName: 'text' });

const User = mongoose.model('User', userSchema);
module.exports = User;
