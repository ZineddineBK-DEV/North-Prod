const mongoose = require('mongoose');

const PROJECT_STAGES = [
  'pending',        // En attente
  'recording',      // Enregistrement
  'mixing',         // Mixage
  'mastering',      // Mastering
  'finalization',   // Finalisation
  'delivered',      // Livré
];

const STAGE_PROGRESS = {
  pending:      0,
  recording:   20,
  mixing:      40,
  mastering:   60,
  finalization:80,
  delivered:  100,
};

// ── Sub-schema: history entry ─────────────────────────────
const historyEntrySchema = new mongoose.Schema(
  {
    stage:     { type: String, enum: PROJECT_STAGES },
    comment:   { type: String, maxlength: 1000 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre du projet est obligatoire'],
      trim: true,
      maxlength: [120, 'Titre trop long'],
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },

    // ── Status pipeline ───────────────────────────────────
    stage: {
      type: String,
      enum: PROJECT_STAGES,
      default: 'pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ── History / change log ──────────────────────────────
    history: [historyEntrySchema],

    // ── Description & notes ───────────────────────────────
    description: { type: String, maxlength: 2000 },
    genre:        { type: String },
    bpm:          { type: Number },
    key:          { type: String },

    // ── File references ───────────────────────────────────
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],

    isArchived: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: stage label (French) ─────────────────────────
projectSchema.virtual('stageLabel').get(function () {
  const labels = {
    pending:      'En attente',
    recording:    'Enregistrement',
    mixing:       'Mixage',
    mastering:    'Mastering',
    finalization: 'Finalisation',
    delivered:    'Livré',
  };
  return labels[this.stage] || this.stage;
});

// ── Pre-save: auto-update progress from stage ─────────────
projectSchema.pre('save', function (next) {
  if (this.isModified('stage')) {
    this.progress = STAGE_PROGRESS[this.stage] ?? this.progress;
    if (this.stage === 'delivered' && !this.deliveredAt) {
      this.deliveredAt = new Date();
    }
  }
  next();
});

// ── Static helpers ────────────────────────────────────────
projectSchema.statics.getStages = () => PROJECT_STAGES;
projectSchema.statics.getStageProgress = () => STAGE_PROGRESS;

// ── Indexes ───────────────────────────────────────────────
projectSchema.index({ artist: 1, stage: 1 });
projectSchema.index({ engineer: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
