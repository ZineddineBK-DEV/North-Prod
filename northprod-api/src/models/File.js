const mongoose = require('mongoose');

const FILE_CATEGORIES = ['audio', 'image', 'video', 'document', 'other'];

// ── Sub-schema: comment on a file version ─────────────────
const fileCommentSchema = new mongoose.Schema(
  {
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const fileSchema = new mongoose.Schema(
  {
    // ── Ownership & project link ──────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── File metadata ─────────────────────────────────────
    originalName: { type: String, required: true },
    storedName:   { type: String, required: true }, // UUID filename on disk
    filePath:     { type: String, required: true }, // relative path under /uploads/
    mimeType:     { type: String },
    size:         { type: Number }, // bytes
    category:     { type: String, enum: FILE_CATEGORIES, default: 'other' },
    extension:    { type: String },

    // ── Versioning ────────────────────────────────────────
    versionNumber: { type: Number, default: 1 }, // v1, v2, v3...
    parentFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null, // null = first version
    },
    isLatestVersion: { type: Boolean, default: true },

    // ── Comments per version ──────────────────────────────
    comments: [fileCommentSchema],

    // ── Soft delete ───────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: public URL ───────────────────────────────────
fileSchema.virtual('url').get(function () {
  return `/uploads/${this.filePath}`;
});

// ── Virtual: human readable size ──────────────────────────
fileSchema.virtual('sizeHuman').get(function () {
  if (!this.size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let s = this.size;
  let u = 0;
  while (s >= 1024 && u < units.length - 1) { s /= 1024; u++; }
  return `${s.toFixed(1)} ${units[u]}`;
});

// ── Detect category from extension ────────────────────────
fileSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('extension')) {
    const ext = (this.extension || '').toLowerCase();
    if (['wav', 'mp3', 'aiff', 'flac', 'ogg', 'aac'].includes(ext)) {
      this.category = 'audio';
    } else if (['jpg', 'jpeg', 'png', 'psd', 'webp', 'gif'].includes(ext)) {
      this.category = 'image';
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
      this.category = 'video';
    } else {
      this.category = 'other';
    }
  }
  next();
});

// ── Indexes ───────────────────────────────────────────────
fileSchema.index({ project: 1, isDeleted: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ parentFile: 1 });

const File = mongoose.model('File', fileSchema);
module.exports = File;
