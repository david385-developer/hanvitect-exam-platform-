const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../validators/validate');
const { registerSchema, loginSchema } = require('../../validators/auth.validator');
const { authMiddleware, roleMiddleware } = require('../../middleware');

const router = express.Router();

// User routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.loginUser);
router.get('/me', authMiddleware, roleMiddleware('user'), authController.getMe);

module.exports = router;
