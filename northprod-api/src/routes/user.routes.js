const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadAvatar: multerAvatar, uploadCover: multerCover } = require('../config/multer');
const {
  getProfile, updateProfile, uploadAvatar, uploadCover,
  changePassword, getPublicProfile,
} = require('../controllers/user.controller');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, multerAvatar.single('avatar'), uploadAvatar);
router.post('/me/cover', protect, multerCover.single('cover'), uploadCover);
router.put('/me/password', protect, changePassword);
router.get('/:id', protect, getPublicProfile);

module.exports = router;
