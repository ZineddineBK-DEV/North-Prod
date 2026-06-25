require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB then start server ──────────────────
connectDB().then(() => {
  const server = http.createServer(app);

  // Attach Socket.io
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`\n🎵  NORTH PROD API running on port ${PORT}`);
    console.log(`   ENV  : ${process.env.NODE_ENV}`);
    console.log(`   Docs : http://localhost:${PORT}/api/health\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
