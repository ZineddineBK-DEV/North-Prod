const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Service } = require('../models/Service');
const { createError } = require('../middleware/error');

// GET /api/services  (public)
router.get('/', async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, services });
  } catch (err) { next(err); }
});

// GET /api/services/:id  (public)
router.get('/:id', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(createError('Service introuvable.', 404));
    res.json({ success: true, service });
  } catch (err) { next(err); }
});

// POST /api/services  (admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (err) { next(err); }
});

// PUT /api/services/:id  (admin)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return next(createError('Service introuvable.', 404));
    res.json({ success: true, service });
  } catch (err) { next(err); }
});

// DELETE /api/services/:id  (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service supprimé.' });
  } catch (err) { next(err); }
});

module.exports = router;
