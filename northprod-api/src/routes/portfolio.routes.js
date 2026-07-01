const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { uploadPortfolioMedia } = require('../config/multer');
const Portfolio = require('../models/Portfolio');
const { createError } = require('../middleware/error');

// GET /api/portfolio (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, featured, page = 1, limit = 12, q } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Portfolio.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Portfolio.countDocuments(filter),
    ]);

    res.json({ success: true, items, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/portfolio/:id (public)
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Portfolio.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!item || !item.isPublished) return next(createError('Élément introuvable.', 404));
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// POST /api/portfolio (admin)
router.post('/', protect, authorize('admin'), uploadPortfolioMedia.fields([{name:'thumbnail',maxCount:1},{name:'media',maxCount:1}]), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.files?.thumbnail?.[0]) data.thumbnail = `portfolio/${req.files.thumbnail[0].filename}`;
    if (req.files?.media?.[0])     data.mediaUrl  = `portfolio/${req.files.media[0].filename}`;
    const item = await Portfolio.create(data);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
});

// PUT /api/portfolio/:id (admin)
router.put('/:id', protect, authorize('admin'), uploadPortfolioMedia.fields([{name:'thumbnail',maxCount:1},{name:'media',maxCount:1}]), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.files?.thumbnail?.[0]) data.thumbnail = `portfolio/${req.files.thumbnail[0].filename}`;
    if (req.files?.media?.[0])     data.mediaUrl  = `portfolio/${req.files.media[0].filename}`;
    const item = await Portfolio.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return next(createError('Élément introuvable.', 404));
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// DELETE /api/portfolio/:id (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Élément supprimé.' });
  } catch (err) { next(err); }
});

module.exports = router;
