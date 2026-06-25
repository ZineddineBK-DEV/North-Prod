const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailability, getPricing, createBooking,
  getMyBookings, getAllBookings, getBooking,
  updateBookingStatus, cancelBooking,
} = require('../controllers/booking.controller');

router.get('/availability', protect, getAvailability);
router.get('/pricing', getPricing); // public
router.get('/all', protect, authorize('production', 'admin'), getAllBookings);
router.post('/', protect, authorize('artist'), createBooking);
router.get('/', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, authorize('production', 'admin'), updateBookingStatus);
router.delete('/:id', protect, authorize('artist'), cancelBooking);

module.exports = router;
