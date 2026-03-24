const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      index: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 2 && v.length <= 6;
        },
        message: 'Options must have 2-6 items',
      },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient question selection by course + language
questionSchema.index({ course: 1, language: 1 });

module.exports = mongoose.model('Question', questionSchema);
