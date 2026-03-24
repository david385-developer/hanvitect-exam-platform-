const express = require('express');
const otpController = require('./otp.controller');
const validate = require('../../validators/validate');
const { sendOTPSchema, verifyOTPSchema } = require('../../validators/otp.validator');

const router = express.Router();

// Public routes - no auth required
router.post('/send', validate(sendOTPSchema), otpController.sendOTP);
router.post('/verify', validate(verifyOTPSchema), otpController.verifyOTP);

module.exports = router;
