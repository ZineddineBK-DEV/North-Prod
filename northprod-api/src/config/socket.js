const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      credentials: true,
    },
  });

  // ── Auth middleware for socket connections ──────────────
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

  // ── Connection handler ──────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: user ${socket.userId}`);

    // Join personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    // ── Messaging ─────────────────────────────────────────
    socket.on('message:send', (data) => {
      // data: { toUserId, messageId, content, fileUrl }
      io.to(`user:${data.toUserId}`).emit('message:receive', {
        from: socket.userId,
        ...data,
      });
    });

    socket.on('message:typing', (data) => {
      io.to(`user:${data.toUserId}`).emit('message:typing', {
        fromUserId: socket.userId,
      });
    });

    socket.on('message:stop-typing', (data) => {
      io.to(`user:${data.toUserId}`).emit('message:stop-typing', {
        fromUserId: socket.userId,
      });
    });

    // ── Room join (for group/project rooms) ───────────────
    socket.on('room:join', (roomId) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('room:leave', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌  Socket disconnected: user ${socket.userId}`);
    });
  });

  return io;
};

// Emit helpers used by controllers
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

module.exports = { initSocket, emitToUser, emitToRoom, emitToAll, getIO };
