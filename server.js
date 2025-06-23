const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// The frontend URL is http://localhost:5173 based on your previous CORS setup.
// .env.example has FRONTEND_URL=http://localhost:3000. We should be consistent.
// For now, I'll use the value from .env.example if available, otherwise default to 3000 (matching .env.example).
// It's important that FRONTEND_URL in .env matches the actual frontend port.
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS for preflight requests
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { success: false, message: 'Too many requests, please try again later.' } // Custom message
});
app.use('/api', limiter); // Apply rate limiting to all /api routes

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit application if DB connection fails at startup
  });

// Import routes
const authRoutes = require('./routes/auth'); // Corrected path
const userRoutes = require('./routes/users'); // Assuming routes/users.js
const loanRoutes = require('./routes/loans'); // Assuming routes/loans.js
const paymentRoutes = require('./routes/payments'); // Assuming routes/payments.js
const adminRoutes = require('./routes/admin'); // Assuming routes/admin.js
const mpesaRoutes = require('./routes/mpesa'); // Assuming routes/mpesa.js
// const safaricomRouter = require('./path-to-api.js'); // Commented out: Adjust path as needed if this file exists

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mpesa', mpesaRoutes);
// if (safaricomRouter) app.use('/api/safaricom', safaricomRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CashCraft Loans API is running',
    timestamp: new Date().toISOString(),
    databaseState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware - should be defined after all routes
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler for API routes not found - should be the last middleware for /api
app.use('/api', (req, res, next) => { // Make it specific to /api base path
    res.status(404).json({
        success: false,
        message: 'API endpoint not found under /api'
    });
});


// General 404 handler for non-API routes (optional)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found. You tried to access ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️ MongoDB URI: ${process.env.MONGODB_URI ? 'Loaded' : 'Not Loaded (Check .env file)'}`);
  console.log(`🌐 CORS enabled for origin: ${frontendUrl}`);
});
