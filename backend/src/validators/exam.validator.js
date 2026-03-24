const Joi = require('joi');
const config = require('../config');

const sendExamOTPSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
    'string.email': 'Please provide a valid email',
  }),
  course: Joi.string().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
  }),
  education: Joi.string().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
  }),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Terms must be accepted',
    'any.required': 'Terms must be accepted',
  }),
});

const examFormSchema = Joi.object({
  course: Joi.string().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
  }),
  education: Joi.string().trim().required().messages({
    'any.required': 'All fields required',
    'string.empty': 'All fields required',
  }),
  termsAccepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'Terms must be accepted',
    'any.required': 'Terms must be accepted',
  }),
});

const startExamSchema = Joi.object({
  selectedLanguages: Joi.array()
    .items(Joi.string().trim())
    .length(config.exam.maxLanguages)
    .required()
    .messages({
      'array.length': `Exactly ${config.exam.maxLanguages} languages must be selected`,
    }),
});

const submitAnswersSchema = Joi.object({
  examSessionId: Joi.string().hex().length(24).required(),
  answers: Joi.object()
    .pattern(Joi.string().hex().length(24), Joi.string().allow(''))
    .required(),
});

const cheatingEventSchema = Joi.object({
  examSessionId: Joi.string().hex().length(24).required(),
  eventType: Joi.string()
    .valid('tab_switch', 'window_blur', 'dev_tools', 'camera_off')
    .required(),
});

// Admin: Create question
const createQuestionSchema = Joi.object({
  course: Joi.string().trim().required(),
  language: Joi.string().trim().required(),
  question: Joi.string().trim().required(),
  options: Joi.array().items(Joi.string().trim()).min(2).max(6).required(),
  correctAnswer: Joi.string().trim().required(),
});

// Request/Resend OTP for exam (protected - user from JWT)
const requestExamOTPSchema = Joi.object({
  examSessionId: Joi.string().hex().length(24).required(),
});

// Verify OTP before exam start
const verifyExamOTPSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  examSessionId: Joi.string().hex().length(24).required(),
});

module.exports = {
  examFormSchema,
  sendExamOTPSchema,
  startExamSchema,
  submitAnswersSchema,
  cheatingEventSchema,
  createQuestionSchema,
  requestExamOTPSchema,
  verifyExamOTPSchema,
};
