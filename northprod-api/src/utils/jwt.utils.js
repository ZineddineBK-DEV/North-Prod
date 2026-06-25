const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── Generate access token ─────────────────────────────────
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Generate refresh token ────────────────────────────────
const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

// ── Verify refresh token ──────────────────────────────────
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// ── Generate random opaque token (email verification, pwd reset) ─
const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

// ── Hash opaque token for storage ────────────────────────
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ── Send token response ───────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Succès') => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Strip sensitive fields
  const userData = user.toObject ? user.toObject() : { ...user };
  delete userData.password;
  delete userData.refreshToken;
  delete userData.emailVerificationToken;
  delete userData.passwordResetToken;

  res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    refreshToken,
    user: userData,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOpaqueToken,
  hashToken,
  sendTokenResponse,
};
