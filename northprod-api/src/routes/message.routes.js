// message.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadMessageAttachment } = require('../config/multer');
const {
  getThreads, getOrCreateThread, getMessages, sendMessage, getUnreadCount, getStudioContact, getContacts,
} = require('../controllers/message.controller');

router.get('/threads', protect, getThreads);
router.get('/unread-count', protect, getUnreadCount);
router.get('/contacts', protect, getContacts);
router.get('/contact', protect, getStudioContact);
router.get('/thread/:userId', protect, getOrCreateThread);
router.get('/thread/:userId/messages', protect, getMessages);
router.post('/', protect, uploadMessageAttachment.single('attachment'), sendMessage);

module.exports = router;
