const express = require('express');
const examController = require('./exam.controller');
const validate = require('../../validators/validate');
const {
  examFormSchema,
  sendExamOTPSchema,
  startExamSchema,
  submitAnswersSchema,
  cheatingEventSchema,
  createQuestionSchema,
  requestExamOTPSchema,
  verifyExamOTPSchema,
} = require('../../validators/exam.validator');
const { authMiddleware, roleMiddleware } = require('../../middleware');

const router = express.Router();

// Public: Verify OTP before exam start (no JWT - uses email + otp + examSessionId)
router.post(
  '/send-otp',
  validate(sendExamOTPSchema),
  examController.sendExamOTP
);

router.post(
  '/verify-otp',
  validate(verifyExamOTPSchema),
  examController.verifyExamOTP
);

router.post(
  '/form',
  authMiddleware,
  validate(examFormSchema),
  examController.submitExamForm
);

router.post(
  '/request-otp',
  authMiddleware,
  validate(requestExamOTPSchema),
  examController.requestExamOTP
);

router.post(
  '/start',
  authMiddleware,
  validate(startExamSchema),
  examController.startExam
);

router.get(
  '/session/:examSessionId/questions',
  authMiddleware,
  examController.getQuestions
);

router.post(
  '/cheating',
  authMiddleware,
  validate(cheatingEventSchema),
  examController.logCheatingEvent
);

router.post(
  '/submit',
  authMiddleware,
  validate(submitAnswersSchema),
  examController.submitExam
);

router.get(
  '/session/:examSessionId/result',
  authMiddleware,
  examController.getResult
);

router.get(
  '/session/:examSessionId/status',
  authMiddleware,
  examController.getSessionStatus
);

// Admin only
router.post(
  '/questions',
  authMiddleware,
  roleMiddleware('admin'),
  validate(createQuestionSchema),
  examController.createQuestion
);

module.exports = router;
