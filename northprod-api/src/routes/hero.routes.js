const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadHeroVideo } = require('../config/multer');
const { HeroMedia } = require('../models/Service');
const { createError } = require('../middleware/error');

// GET /api/hero/active  (public)
router.get('/active', async (req, res, next) => {
  try {
    const hero = await HeroMedia.findOne({ isActive: true });
    res.json({ success: true, hero });
  } catch (err) { next(err); }
});

// GET /api/hero  (admin - list all)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const heroes = await HeroMedia.find().sort({ createdAt: -1 }).populate('uploadedBy', 'aka');
    res.json({ success: true, heroes });
  } catch (err) { next(err); }
});

// POST /api/hero  (admin - create)
router.post('/', protect, authorize('admin'), uploadHeroVideo.single('video'), async (req, res, next) => {
  try {
    const data = { ...req.body, uploadedBy: req.user._id };
    if (req.file) {
      data.mediaType = 'upload';
      data.filePath = `hero/${req.file.filename}`;
      data.fileName = req.file.originalname;
    }
    // Parse cta if sent as JSON string
    if (typeof data.cta === 'string') {
      try { data.cta = JSON.parse(data.cta); } catch { data.cta = []; }
    }
    const hero = await HeroMedia.create(data);
    res.status(201).json({ success: true, hero });
  } catch (err) { next(err); }
});

// PUT /api/hero/:id/activate  (admin - set as active)
router.put('/:id/activate', protect, authorize('admin'), async (req, res, next) => {
  try {
    // Deactivate all
    await HeroMedia.updateMany({}, { isActive: false });
    // Activate selected
    const hero = await HeroMedia.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!hero) return next(createError('Hero introuvable.', 404));
    res.json({ success: true, message: 'Hero activé.', hero });
  } catch (err) { next(err); }
});

// PUT /api/hero/:id  (admin - update)
router.put('/:id', protect, authorize('admin'), uploadHeroVideo.single('video'), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (typeof data.cta === 'string') {
      try { data.cta = JSON.parse(data.cta); } catch { data.cta = []; }
    }
    if (req.file) { data.mediaType = 'upload'; data.filePath = `hero/${req.file.filename}`; data.fileName = req.file.originalname; }
    const hero = await HeroMedia.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!hero) return next(createError('Hero introuvable.', 404));
    res.json({ success: true, hero });
  } catch (err) { next(err); }
});

// DELETE /api/hero/:id  (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await HeroMedia.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hero supprimé.' });
  } catch (err) { next(err); }
});

module.exports = router;
