const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// ── Ensure upload directories exist ──────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Storage factory ───────────────────────────────────────
const makeStorage = (subdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(__dirname, '../../uploads', subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${uuidv4()}${ext}`;
      cb(null, unique);
    },
  });

// ── MIME type filters ─────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Seules les images sont acceptées (jpeg, jpg, png, webp, gif)'));
};

const projectFileFilter = (req, file, cb) => {
  const allowedExts = /wav|mp3|aiff|flac|jpg|jpeg|png|psd|mp4|mov/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExts.test(ext)) return cb(null, true);
  cb(new Error('Format non supporté. Formats acceptés: wav, mp3, aiff, flac, jpg, png, psd, mp4, mov'));
};

const videoFilter = (req, file, cb) => {
  const allowed = /mp4|mov|webm|avi/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) return cb(null, true);
  cb(new Error('Seuls les fichiers vidéo sont acceptés (mp4, mov, webm, avi)'));
};

// ── 2 GB in bytes ─────────────────────────────────────────
const MAX_PROJECT_FILE_SIZE = 2 * 1024 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB for avatars/covers/portfolio

// ── Multer instances ──────────────────────────────────────
const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

const uploadCover = multer({
  storage: makeStorage('covers'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

const uploadProjectFile = multer({
  storage: makeStorage('projects'),
  fileFilter: projectFileFilter,
  limits: { fileSize: MAX_PROJECT_FILE_SIZE },
});

const portfolioMediaFilter = (req, file, cb) => {
  const imageOk = /jpeg|jpg|png|webp|gif/.test(file.mimetype);
  const audioOk = /audio\//.test(file.mimetype) || /mp3|wav|aiff|flac|ogg/.test(require('path').extname(file.originalname).toLowerCase());
  if (imageOk || audioOk) return cb(null, true);
  cb(new Error('Format non supporté. Images ou audio uniquement.'));
};

const uploadPortfolioMedia = multer({
  storage: makeStorage('portfolio'),
  fileFilter: portfolioMediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadHeroVideo = multer({
  storage: makeStorage('hero'),
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for hero video
});

const uploadMessageAttachment = multer({
  storage: makeStorage('messages'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — images only
});

module.exports = {
  uploadAvatar,
  uploadCover,
  uploadProjectFile,
  uploadPortfolioMedia,
  uploadHeroVideo,
  uploadMessageAttachment,
};
