const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
      index: true,
    },
    course: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correct: {
      type: Number,
      required: true,
    },
    wrong: {
      type: Number,
      required: true,
    },
    unanswered: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passFail: {
      type: String,
      enum: ['pass', 'fail'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Result', resultSchema);
