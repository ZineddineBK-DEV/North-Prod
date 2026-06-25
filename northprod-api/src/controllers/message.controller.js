const { Thread, Message } = require('../models/Message');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/error');
const { emitToUser } = require('../config/socket');

// ── GET /api/messages/threads ─────────────────────────────
const getThreads = async (req, res, next) => {
  try {
    const threads = await Thread.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'aka avatar role lastSeen')
      .populate('lastMessage', 'content createdAt sender');

    res.json({ success: true, threads });
  } catch (err) { next(err); }
};

// ── GET /api/messages/thread/:userId ─────────────────────
// Get or create thread between current user and another user
const getOrCreateThread = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id.toString();
    if (userId === myId) return next(createError('Impossible de discuter avec soi-même.', 400));

    let thread = await Thread.findOne({
      participants: { $all: [myId, userId] },
    }).populate('participants', 'aka avatar role lastSeen');

    if (!thread) {
      thread = await Thread.create({
        participants: [myId, userId],
        unreadCounts: [
          { user: myId, count: 0 },
          { user: userId, count: 0 },
        ],
      });
      thread = await thread.populate('participants', 'aka avatar role lastSeen');
    }

    res.json({ success: true, thread });
  } catch (err) { next(err); }
};

// ── GET /api/messages/thread/:userId/messages ─────────────
const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const thread = await Thread.findOne({
      participants: { $all: [req.user._id.toString(), userId] },
    });
    if (!thread) return res.json({ success: true, messages: [], total: 0 });

    const [messages, total] = await Promise.all([
      Message.find({ thread: thread._id, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('sender', 'aka avatar role'),
      Message.countDocuments({ thread: thread._id, isDeleted: false }),
    ]);

    // Mark as read
    await Message.updateMany(
      { thread: thread._id, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    // Reset unread count
    await Thread.updateOne(
      { _id: thread._id, 'unreadCounts.user': req.user._id },
      { $set: { 'unreadCounts.$.count': 0 } }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // oldest first
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};

// ── POST /api/messages ────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { toUserId, content } = req.body;
    if (!toUserId) return next(createError('Destinataire requis.', 400));
    if (!content?.trim() && !req.file) return next(createError('Message ou fichier requis.', 400));

    // Get or create thread
    let thread = await Thread.findOne({
      participants: { $all: [req.user._id.toString(), toUserId] },
    });
    if (!thread) {
      thread = await Thread.create({
        participants: [req.user._id, toUserId],
        unreadCounts: [
          { user: req.user._id, count: 0 },
          { user: toUserId, count: 0 },
        ],
      });
    }

    // Build attachment if file was uploaded
    let attachment;
    if (req.file) {
      attachment = {
        name: req.file.originalname,
        url: `/uploads/messages/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    const message = await Message.create({
      thread: thread._id,
      sender: req.user._id,
      receiver: toUserId,
      content: content?.trim() || '',
      attachment,
    });

    // Update thread
    await Thread.findByIdAndUpdate(thread._id, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { 'unreadCounts.$[elem].count': 1 },
    }, {
      arrayFilters: [{ 'elem.user': toUserId }],
    });

    await message.populate('sender', 'aka avatar role');

    // Real-time delivery
    emitToUser(toUserId, 'message:receive', { message, threadId: thread._id });

    // Push notification
    await Notification.createAndEmit({
      recipient: toUserId,
      type: 'message_received',
      title: `Nouveau message de ${req.user.aka}`,
      message: content?.substring(0, 80) || 'Vous avez reçu un fichier.',
      link: `/artist/messages`,
      resourceId: message._id,
      resourceType: 'Message',
    });

    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};

// ── GET /api/messages/unread-count ────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
      isDeleted: false,
    });
    res.json({ success: true, count });
  } catch (err) { next(err); }
};

module.exports = { getThreads, getOrCreateThread, getMessages, sendMessage, getUnreadCount };
