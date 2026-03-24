const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    education: {
      type: String,
      required: true,
      trim: true,
    },
    selectedLanguages: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && (v.length === 0 || v.length === 6);
        },
        message: 'Exactly 6 languages must be selected when starting exam',
      },
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    cheatingEvents: {
      type: Number,
      default: 0,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'submitted', 'auto-submitted'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

examSessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
