const crypto = require('crypto');
const User = require('../models/User');
const { createError } = require('../middleware/error');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashToken,
  sendTokenResponse,
} = require('../utils/jwt.utils');
const {
  sendEmailVerification,
  sendPasswordReset,
} = require('../services/email.service');

// ── POST /api/auth/register ───────────────────────────────
const register = async (req, res, next) => {
  try {
    const {
      aka, firstName, lastName, email, password,
      phone, musicalGenres, bio,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(createError('Cet email est déjà utilisé.', 409));

    const verificationToken = generateOpaqueToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      aka, firstName, lastName, email, password,
      phone, musicalGenres, bio,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    // Send verification email (non-blocking)
    sendEmailVerification(user, verificationToken).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-email ───────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return next(createError('Token manquant.', 400));

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return next(createError('Token invalide ou expiré.', 400));

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Email vérifié avec succès. Bienvenue !');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return next(createError('Email ou mot de passe incorrect.', 401));
    }

    if (!user.isActive) {
      return next(createError('Compte désactivé. Contactez l\'administration.', 403));
    }

    // Update last seen
    user.lastSeen = new Date();

    // Store refresh token for "remember me"
    if (rememberMe) {
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
    }
    await user.save();

    sendTokenResponse(user, 200, res, 'Connexion réussie.');
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh-token ──────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return next(createError('Refresh token manquant.', 401));

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return next(createError('Refresh token invalide.', 401));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    const resetToken = generateOpaqueToken();
    const hashedToken = hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h
    await user.save();

    sendPasswordReset(user, resetToken).catch(console.error);

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return next(createError('Données manquantes.', 400));

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return next(createError('Token invalide ou expiré.', 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // invalidate all sessions
    await user.save();

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ success: true, message: 'Déconnexion réussie.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, verifyEmail, login, refreshToken,
  forgotPassword, resetPassword, logout, getMe,
};
