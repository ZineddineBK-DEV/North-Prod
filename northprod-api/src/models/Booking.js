const mongoose = require('mongoose');

const BOOKING_TYPES = ['record_hourly', 'record_forfait', 'location', 'mix_mastering'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'];

const PRICING = {
  record_hourly:  { label: 'Séance Record', unit: 'heure', price: 99 },
  record_forfait: { label: 'Séance Record (Forfait/Titre)', unit: 'titre', price: 120 },
  location:       { label: 'Location Studio', unit: 'heure', price: 190 },
  mix_mastering:  { label: 'Mixage / Mastering', unit: 'track', price: 80 },
};

const bookingSchema = new mongoose.Schema(
  {
    // ── Participants ──────────────────────────────────────
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Session details ───────────────────────────────────
    type: {
      type: String,
      enum: BOOKING_TYPES,
      required: [true, 'Le type de réservation est obligatoire'],
    },
    date: {
      type: Date,
      required: [true, 'La date est obligatoire'],
    },
    startTime: {
      type: String, // "HH:mm"
      required: [true, "L'heure de début est obligatoire"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format heure invalide (HH:mm)'],
    },
    duration: {
      type: Number, // in hours (or tracks for mix_mastering)
      required: [true, 'La durée est obligatoire'],
      min: [0.5, 'Durée minimale 0.5'],
    },
    endTime: { type: String }, // computed

    // ── Pricing snapshot (frozen at booking time) ─────────
    pricePerUnit: { type: Number },
    totalPrice:   { type: Number },
    unit:         { type: String },

    // ── Status ────────────────────────────────────────────
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },

    // ── Extra info ────────────────────────────────────────
    participants: {
      type: Number,
      default: 1,
      min: 1,
      max: 20,
    },
    musicalGenre: { type: String, default: '' },
    notes:        { type: String, maxlength: 1000 },

    // ── Linked project (created after confirmation) ───────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    // ── Timestamps for status changes ─────────────────────
    confirmedAt: { type: Date },
    rejectedAt:  { type: Date },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save: compute pricing & endTime ───────────────────
bookingSchema.pre('save', function (next) {
  if (this.isModified('type') || this.isModified('duration') || this.isNew) {
    const pricing = PRICING[this.type];
    if (pricing) {
      this.pricePerUnit = pricing.price;
      this.unit = pricing.unit;
      this.totalPrice = Math.round(pricing.price * this.duration * 100) / 100;
    }
  }

  // Compute endTime from startTime + duration (only for time-based)
  if (this.startTime && this.duration && this.type !== 'mix_mastering') {
    const [h, m] = this.startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + Math.round(this.duration * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    this.endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }

  next();
});

// ── Static: get pricing info ──────────────────────────────
bookingSchema.statics.getPricing = () => PRICING;

// ── Indexes ───────────────────────────────────────────────
bookingSchema.index({ artist: 1, date: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1, startTime: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
