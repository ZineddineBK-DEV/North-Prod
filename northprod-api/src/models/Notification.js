const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'booking_pending',
  'booking_confirmed',
  'booking_rejected',
  'booking_reminder',
  'project_updated',
  'project_delivered',
  'file_uploaded',
  'message_received',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },

    // ── Contextual link ───────────────────────────────────
    link: { type: String },           // e.g. /artist/bookings/123
    resourceId:   { type: mongoose.Schema.Types.ObjectId },
    resourceType: { type: String },   // 'Booking', 'Project', 'File', 'Message'

    // ── Read status ───────────────────────────────────────
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// ── Static: create & emit helper ─────────────────────────
notificationSchema.statics.createAndEmit = async function (data) {
  const { emitToUser } = require('../config/socket');
  const notification = await this.create(data);
  emitToUser(data.recipient.toString(), 'notification:new', notification);
  return notification;
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
