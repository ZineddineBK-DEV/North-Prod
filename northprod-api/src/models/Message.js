const mongoose = require('mongoose');

// ── Thread (conversation between two users) ───────────────
const threadSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: { type: Date },
    // Unread count per participant
    unreadCounts: [
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// ── Ensure a thread is unique per pair of participants ─────
threadSchema.index({ participants: 1 }, { unique: false });

// ── Message ───────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Content ───────────────────────────────────────────
    content: {
      type: String,
      maxlength: [2000, 'Message trop long (max 2000 caractères)'],
    },

    // ── File attachment ───────────────────────────────────
    attachment: {
      name:     { type: String },
      url:      { type: String },
      mimeType: { type: String },
      size:     { type: Number },
    },

    // ── Status ────────────────────────────────────────────
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
messageSchema.index({ thread: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const Thread = mongoose.model('Thread', threadSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Thread, Message };
