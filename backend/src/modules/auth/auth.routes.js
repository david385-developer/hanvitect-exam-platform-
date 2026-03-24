const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../validators/validate');
const { registerSchema, loginSchema } = require('../../validators/auth.validator');
const { authMiddleware } = require('../../middleware');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
