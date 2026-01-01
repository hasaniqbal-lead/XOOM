require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const SocketService = require('./socket/socketService');
const ScheduleProcessor = require('./jobs/scheduleProcessor');

// Import routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const announcementRoutes = require('./routes/announcements');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');

// Debug maps routes loading
let mapsRoutes;
try {
  mapsRoutes = require('./routes/maps');
  console.log('✓ Maps routes loaded successfully');
  console.log('  Type:', typeof mapsRoutes);
  console.log('  Has stack:', !!mapsRoutes.stack);
} catch (error) {
  console.error('❌ Error loading maps routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

const publicRidesRoutes = require('./routes/publicRides');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    process.env.ADMIN_URL || 'http://localhost:5174'
  ],
  credentials: true
};

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Initialize Schedule Processor
const scheduleProcessor = new ScheduleProcessor(io);

// Make io accessible in routes
app.set('io', io);
app.set('socketService', socketService);
app.set('scheduleProcessor', scheduleProcessor);

// Trust proxy for rate limiting behind Nginx
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/auth', limiter);

// Static files for uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);
app.use('/driver', driverRoutes);
app.use('/admin', adminRoutes);
app.use('/announcements', announcementRoutes);
app.use('/reviews', reviewRoutes);
app.use('/notifications', notificationRoutes);
app.use('/maps', mapsRoutes);
app.use('/public', publicRidesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║          XOOM Backend Server              ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Socket.IO enabled`);
  console.log(`✓ Schedule processor enabled`);
  console.log('\nAPI Endpoints:');
  console.log('  POST   /auth/signup');
  console.log('  POST   /auth/login');
  console.log('  POST   /rides');
  console.log('  POST   /rides/:id/accept');
  console.log('  GET    /driver/nearby');
  console.log('  GET    /announcements');
  console.log('  GET    /admin/dashboard');
  console.log('\nReady to accept connections...\n');
  
  // Start schedule processor
  scheduleProcessor.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  scheduleProcessor.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Closing server gracefully...');
  scheduleProcessor.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
