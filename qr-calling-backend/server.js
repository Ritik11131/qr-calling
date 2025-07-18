const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const callRoutes = require('./routes/calls');
const notificationRoutes = require('./routes/notifications');
const agoraRoutes = require('./routes/agora');
const testNotificationRoutes = require('./routes/test-notifications');
const { generalRateLimit } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalRateLimit);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('call-initiated', (data) => {
    socket.to(data.receiverId).emit('incoming-call', data);
  });

  socket.on('call-answered', (data) => {
    socket.to(data.callerId).emit('call-accepted', data);
  });

  socket.on('call-rejected', (data) => {
    socket.to(data.callerId).emit('call-rejected', data);
  });

  socket.on('call-ended', (data) => {
    socket.to(data.participantId).emit('call-ended', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'QR Calling API',
    version: '1.0.0',
    description: 'Backend API for QR Code calling application',
    endpoints: {
      auth: '/api/auth',
      qr: '/api/qr',
      calls: '/api/calls',
      notifications: '/api/notifications',
      agora: '/api/agora'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/test-notifications', testNotificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };