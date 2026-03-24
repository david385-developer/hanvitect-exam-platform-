const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../validators/validate');
const { loginSchema } = require('../../validators/auth.validator');
const { authMiddleware, roleMiddleware } = require('../../middleware');

const router = express.Router();

// Admin auth routes (no public registration)
router.post('/login', validate(loginSchema), authController.loginAdmin);
router.get('/me', authMiddleware, roleMiddleware('admin'), authController.getMe);

module.exports = router;
