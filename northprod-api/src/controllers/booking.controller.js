const Booking = require('../models/Booking');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { createError } = require('../middleware/error');
const { sendBookingConfirmation, sendBookingRejection } = require('../services/email.service');

// ── GET /api/bookings/availability ────────────────────────
// Returns confirmed bookings for a given date (calendar)
const getAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return next(createError('Date requise.', 400));

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime duration type status');

    res.json({ success: true, date, bookings });
  } catch (err) { next(err); }
};

// ── GET /api/bookings/pricing ─────────────────────────────
const getPricing = async (req, res, next) => {
  res.json({ success: true, pricing: Booking.getPricing() });
};

// ── POST /api/bookings ────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { type, date, startTime, duration, participants, musicalGenre, notes } = req.body;

    const booking = await Booking.create({
      artist: req.user._id,
      type, date, startTime, duration,
      participants, musicalGenre, notes,
    });

    // Notify all production team members
    const productionTeam = await User.find({ role: 'production', isActive: true }).select('_id');
    const notifPromises = productionTeam.map((member) =>
      Notification.createAndEmit({
        recipient: member._id,
        type: 'booking_pending',
        title: 'Nouvelle demande de réservation',
        message: `${req.user.aka} a soumis une demande de réservation pour le ${new Date(date).toLocaleDateString('fr-FR')}.`,
        link: `/production/bookings/${booking._id}`,
        resourceId: booking._id,
        resourceType: 'Booking',
      })
    );
    await Promise.allSettled(notifPromises);

    res.status(201).json({
      success: true,
      message: 'Demande de réservation soumise. Réponse sous 24h.',
      booking,
    });
  } catch (err) { next(err); }
};

// ── GET /api/bookings ─────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { artist: req.user._id };
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('project', 'title stage progress'),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, bookings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/bookings/all (production/admin) ──────────────
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('artist', 'aka email avatar')
        .populate('validatedBy', 'aka'),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, bookings, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/bookings/:id ─────────────────────────────────
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('artist', 'aka email avatar phone')
      .populate('validatedBy', 'aka')
      .populate('project');

    if (!booking) return next(createError('Réservation introuvable.', 404));

    // Artists can only see their own bookings
    if (req.user.role === 'artist' && booking.artist._id.toString() !== req.user._id.toString()) {
      return next(createError('Accès refusé.', 403));
    }

    res.json({ success: true, booking });
  } catch (err) { next(err); }
};

// ── PUT /api/bookings/:id/status (production/admin) ───────
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ['confirmed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(createError('Statut invalide.', 400));
    }

    const booking = await Booking.findById(req.params.id).populate('artist');
    if (!booking) return next(createError('Réservation introuvable.', 404));
    if (booking.status !== 'pending') {
      return next(createError('Cette réservation a déjà été traitée.', 409));
    }

    booking.status = status;
    booking.validatedBy = req.user._id;
    booking.rejectionReason = rejectionReason || '';

    if (status === 'confirmed') {
      booking.confirmedAt = new Date();

      // Auto-create a project linked to this booking
      const project = await Project.create({
        title: `Session - ${booking.artist.aka} - ${new Date(booking.date).toLocaleDateString('fr-FR')}`,
        artist: booking.artist._id,
        engineer: req.user._id,
        booking: booking._id,
        stage: 'pending',
      });
      booking.project = project._id;

      // Notify artist
      await Notification.createAndEmit({
        recipient: booking.artist._id,
        type: 'booking_confirmed',
        title: 'Réservation confirmée ✅',
        message: `Votre réservation du ${new Date(booking.date).toLocaleDateString('fr-FR')} a été confirmée.`,
        link: `/artist/bookings/${booking._id}`,
        resourceId: booking._id,
        resourceType: 'Booking',
      });

      sendBookingConfirmation(booking.artist, booking).catch(console.error);
    }

    if (status === 'rejected') {
      booking.rejectedAt = new Date();
      await Notification.createAndEmit({
        recipient: booking.artist._id,
        type: 'booking_rejected',
        title: 'Demande de réservation non disponible',
        message: `Votre demande du ${new Date(booking.date).toLocaleDateString('fr-FR')} n'a pas pu être confirmée.`,
        link: `/artist/bookings`,
        resourceId: booking._id,
        resourceType: 'Booking',
      });

      sendBookingRejection(booking.artist, booking, rejectionReason).catch(console.error);
    }

    await booking.save();
    res.json({ success: true, message: `Réservation ${status === 'confirmed' ? 'confirmée' : 'refusée'}.`, booking });
  } catch (err) { next(err); }
};

// ── DELETE /api/bookings/:id (artist cancels pending) ─────
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(createError('Réservation introuvable.', 404));
    if (booking.artist.toString() !== req.user._id.toString()) {
      return next(createError('Accès refusé.', 403));
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return next(createError('Cette réservation ne peut plus être annulée.', 409));
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    res.json({ success: true, message: 'Réservation annulée.', booking });
  } catch (err) { next(err); }
};

module.exports = {
  getAvailability, getPricing, createBooking,
  getMyBookings, getAllBookings, getBooking,
  updateBookingStatus, cancelBooking,
};
