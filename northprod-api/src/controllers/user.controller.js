const User = require('../models/User');
const { createError } = require('../middleware/error');
const path = require('path');
const fs = require('fs');

// Helper: serialize user including virtuals
const serializeUser = (user) => user.toObject({ virtuals: true });

// ── GET /api/users/me ─────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { next(err); }
};

// ── PUT /api/users/me ─────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'aka', 'firstName', 'lastName', 'phone',
      'bio', 'musicalGenres', 'socialLinks', 'notificationPrefs',
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    });
    res.json({ success: true, message: 'Profil mis à jour.', user: serializeUser(user) });
  } catch (err) { next(err); }
};

// ── POST /api/users/me/avatar ─────────────────────────────
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(createError('Aucun fichier reçu.', 400));

    const user = await User.findById(req.user._id);
    if (user.avatar) {
      const oldPath = path.join(__dirname, '../../uploads', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const relativePath = `avatars/${req.file.filename}`;
    user.avatar = relativePath;
    await user.save();

    const serialized = serializeUser(user);
    res.json({ success: true, message: 'Avatar mis à jour.', avatarUrl: serialized.avatarUrl, user: serialized });
  } catch (err) { next(err); }
};

// ── POST /api/users/me/cover ──────────────────────────────
const uploadCover = async (req, res, next) => {
  try {
    if (!req.file) return next(createError('Aucun fichier reçu.', 400));

    const user = await User.findById(req.user._id);
    if (user.coverImage) {
      const oldPath = path.join(__dirname, '../../uploads', user.coverImage);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const relativePath = `covers/${req.file.filename}`;
    user.coverImage = relativePath;
    await user.save();

    const serialized = serializeUser(user);
    res.json({ success: true, message: 'Couverture mise à jour.', coverUrl: serialized.coverUrl, user: serialized });
  } catch (err) { next(err); }
};

// ── PUT /api/users/me/password ────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(createError('Les deux mots de passe sont requis.', 400));
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return next(createError('Mot de passe actuel incorrect.', 401));
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Mot de passe modifié.' });
  } catch (err) { next(err); }
};

// ── GET /api/users/:id (public profile) ───────────────────
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('aka avatar coverImage bio musicalGenres socialLinks createdAt');
    if (!user) return next(createError('Utilisateur introuvable.', 404));
    res.json({ success: true, user: serializeUser(user) });
  } catch (err) { next(err); }
};

module.exports = {
  getProfile, updateProfile, uploadAvatar, uploadCover,
  changePassword, getPublicProfile,
};
