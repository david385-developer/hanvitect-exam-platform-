const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const userAuthRoutes = require('./modules/auth/userAuth.routes');
const adminAuthRoutes = require('./modules/auth/adminAuth.routes');
const { examRoutes } = require('./modules/exam');
const adminRoutes = require('./modules/admin/admin.routes');
const { authMiddleware, roleMiddleware } = require('./middleware');
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
app.use('/api/auth/user', authLimiter, userAuthRoutes);
app.use('/api/auth/admin', authLimiter, adminAuthRoutes);
app.use('/api/otp', otpLimiter, require('./modules/auth/otp.routes'));
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);

// Auth status for both user and admin sessions
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// Admin alias routes for strict requirement convenience
const adminController = require('./modules/admin/admin.controller');

const usersRouter = require('express').Router();
usersRouter.use(authMiddleware, roleMiddleware('admin'));
usersRouter.get('/', adminController.listUsers);
usersRouter.patch('/:userId/block', adminController.updateUserStatus);
app.use('/api/users', usersRouter);

const questionsRouter = require('express').Router();
questionsRouter.use(authMiddleware, roleMiddleware('admin'));
questionsRouter.get('/', adminController.listQuestions);
questionsRouter.post('/', adminController.createQuestion);
questionsRouter.put('/:questionId', adminController.updateQuestion);
questionsRouter.delete('/:questionId', adminController.deleteQuestion);
app.use('/api/questions', questionsRouter);

const resultsRouter = require('express').Router();
resultsRouter.use(authMiddleware, roleMiddleware('admin'));
resultsRouter.get('/', adminController.listResults);
app.use('/api/results', resultsRouter);

const violationsRouter = require('express').Router();
violationsRouter.use(authMiddleware, roleMiddleware('admin'));
violationsRouter.get('/', adminController.listViolations);
app.use('/api/violations', violationsRouter);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

module.exports = app;
