const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { authRoutes, otpRoutes } = require('./modules/auth');
const { examRoutes } = require('./modules/exam');
const { errorMiddleware, sanitizeMiddleware } = require('./middleware');

const app = express();

// Security middleware
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors(
    corsOrigin === '*'
      ? { origin: corsOrigin }
      : {
          origin: corsOrigin,
          credentials: true, // required if frontend sends credentials
        }
  )
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests.' },
});

app.use(express.json({ limit: '10kb' }));

app.use(sanitizeMiddleware);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/otp', otpLimiter, otpRoutes);
app.use('/api/exam', examRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

module.exports = app;
