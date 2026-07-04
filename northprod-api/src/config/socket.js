const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// Track connected users (userId → socketId) for online status
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      credentials: true,
    },
  });

  // ── Auth middleware ─────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ──────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌  Socket connected: user ${userId} (${socket.userRole})`);

    // Track online + join personal room
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Broadcast online status to everyone
    socket.broadcast.emit('user:online', { userId });

    // ── Messaging ─────────────────────────────────────────
    socket.on('message:send', (data) => {
      io.to(`user:${data.toUserId}`).emit('message:receive', {
        from: userId,
        ...data,
      });
    });

    socket.on('message:typing', (data) => {
      io.to(`user:${data.toUserId}`).emit('message:typing', { fromUserId: userId });
    });

    socket.on('message:stop-typing', (data) => {
      io.to(`user:${data.toUserId}`).emit('message:stop-typing', { fromUserId: userId });
    });

    // Client confirms message was read
    socket.on('message:read', (data) => {
      // data: { threadId, toUserId }
      io.to(`user:${data.toUserId}`).emit('message:read', {
        threadId: data.threadId,
        readBy: userId,
      });
    });

    // ── Rooms ─────────────────────────────────────────────
    socket.on('room:join',  (roomId) => socket.join(`room:${roomId}`));
    socket.on('room:leave', (roomId) => socket.leave(`room:${roomId}`));

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌  Socket disconnected: user ${userId}`);
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  return io;
};

// ── Emit helpers ──────────────────────────────────────────
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};
const emitToRoom = (roomId, event, data) => {
  if (io) io.to(`room:${roomId}`).emit(event, data);
};
const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};
const getIO = () => io;
const isUserOnline = (userId) => onlineUsers.has(userId);

module.exports = { initSocket, emitToUser, emitToRoom, emitToAll, getIO, isUserOnline };
