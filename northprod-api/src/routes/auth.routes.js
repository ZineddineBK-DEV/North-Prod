const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register, verifyEmail, login, refreshToken,
  forgotPassword, resetPassword, logout, getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ── Validation rules ──────────────────────────────────────
const registerRules = [
  body('aka').trim().notEmpty().withMessage('Le nom de scène est obligatoire').isLength({ max: 60 }),
  body('firstName').trim().notEmpty().withMessage('Le prénom est obligatoire'),
  body('lastName').trim().notEmpty().withMessage('Le nom est obligatoire'),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
    .matches(/[0-9]/).withMessage('Au moins un chiffre'),
  body('phone').optional().matches(/^\+?[\d\s\-()]{8,20}$/).withMessage('Téléphone invalide'),
  body('musicalGenres').optional().isArray(),
  body('bio').optional().isLength({ max: 500 }),
];

const loginRules = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

const forgotRules = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
];

const resetRules = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Minimum 8 caractères'),
];

// ── Routes ────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/verify-email', verifyEmail);
router.post('/login', loginRules, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotRules, validate, forgotPassword);
router.post('/reset-password', resetRules, validate, resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
