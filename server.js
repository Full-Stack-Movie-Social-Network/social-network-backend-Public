// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express(); 
 
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-social-network', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Basic Test Route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🎬 Movie Social Network API is running!',
    timestamp: new Date().toISOString()
  });
});

// Test Models Route
app.get('/api/test-models', async (req, res) => {
  try {
    const { User, Movie, Review, Follow, Bookmark, Like } = require('./models');
    
    res.json({ 
      message: '✅ All models loaded successfully!',
      models: {
        User: 'Ready',
        Movie: 'Ready',
        Review: 'Ready',
        Follow: 'Ready',
        Bookmark: 'Ready',
        Like: 'Ready'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: '❌ Error loading models',
      error: error.message 
    });
  }
});

// Test Authorization Header
app.get('/api/test-auth', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  res.json({
    message: 'Testing authorization header',
    authHeader: authHeader || 'No Authorization header found',
    token: token || 'No token extracted',
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const movieRoutes = require('./routes/movie.routes');
const reviewRoutes = require('./routes/review.routes');
const followRoutes = require('./routes/follow.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const likeRoutes = require('./routes/like.routes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/likes', likeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
