const User = require('../models/User');
const Booking = require('../models/Booking');
const Project = require('../models/Project');
const File = require('../models/File');
const { Message } = require('../models/Message');
const { createError } = require('../middleware/error');

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalArtists, totalProduction,
      totalBookings, pendingBookings, confirmedBookings,
      totalProjects, activeProjects, deliveredProjects,
      totalFiles,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'artist', isActive: true }),
      User.countDocuments({ role: 'production', isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Project.countDocuments(),
      Project.countDocuments({ stage: { $nin: ['delivered'] }, isArchived: false }),
      Project.countDocuments({ stage: 'delivered' }),
      File.countDocuments({ isDeleted: false }),
    ]);

    // Revenue from completed bookings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const revenueThisMonth = await Booking.aggregate([
      { $match: { status: 'confirmed', confirmedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    // Bookings by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const bookingsByMonth = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Bookings by type
    const bookingsByType = await Booking.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    // Recent registrations (last 5)
    const recentUsers = await User.find({ role: 'artist' })
      .sort({ createdAt: -1 }).limit(5)
      .select('aka email avatar createdAt musicalGenres');

    // Pending bookings (last 5)
    const pendingBookingsList = await Booking.find({ status: 'pending' })
      .sort({ createdAt: 1 }).limit(5)
      .populate('artist', 'aka email avatar');

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, artists: totalArtists, production: totalProduction },
        bookings: { total: totalBookings, pending: pendingBookings, confirmed: confirmedBookings },
        projects: { total: totalProjects, active: activeProjects, delivered: deliveredProjects },
        files: { total: totalFiles },
        revenue: {
          thisMonth: revenueThisMonth[0]?.total || 0,
          byMonth: bookingsByMonth,
          byType: bookingsByType,
        },
      },
      recentUsers,
      pendingBookingsList,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$text = { $search: search };

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-password -refreshToken -emailVerificationToken -passwordResetToken'),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['role', 'isActive', 'isEmailVerified'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Prevent demoting yourself
    if (req.params.id === req.user._id.toString() && updates.role && updates.role !== 'admin') {
      return next(createError('Vous ne pouvez pas modifier votre propre rôle.', 403));
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password -refreshToken');
    if (!user) return next(createError('Utilisateur introuvable.', 404));
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(createError('Vous ne pouvez pas supprimer votre propre compte.', 403));
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (err) { next(err); }
};

module.exports = { getStats, getUsers, updateUser, deleteUser };
