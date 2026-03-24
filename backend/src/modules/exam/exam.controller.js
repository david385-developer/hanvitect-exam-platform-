const mongoose = require('mongoose');
const ExamSession = require('./examSession.model');
const Question = require('./question.model');
const Result = require('./result.model');
const OTP = require('../auth/otp.model');
const User = require('../auth/user.model');
const { generateOTP, hashOTP, compareOTP, getOTPExpiry } = require('../../utils/otp');
const { sendOTPEmail } = require('../../utils/mockEmail');
const config = require('../../config');
const { AppError } = require('../../utils/errors');

// Public: Exam form submit + OTP send
const sendExamOTP = async (req, res, next) => {
  try {
    console.log('Exam Form Body:', req.body);
    const { name, email, course, education, termsAccepted } = req.body;

    if (!name || !email || !course || !education) {
      throw new AppError('All fields required', 400);
    }
    if (termsAccepted !== true) {
      throw new AppError('Terms must be accepted', 400);
    }

    const session = await ExamSession.create({
      userId: null,
      name,
      email,
      course,
      education,
      selectedLanguages: [],
      questions: [],
      status: 'pending',
    });

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    await OTP.deleteMany({ email, examSessionId: session._id });
    await OTP.create({
      email,
      otp: hashedOTP,
      expiresAt,
      attempts: 0,
      examSessionId: session._id,
    });

    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        examSessionId: session._id,
        email,
        name,
        course,
        education,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Protected: form submit for authenticated flow
const submitExamForm = async (req, res, next) => {
  try {
    const { course, education, termsAccepted } = req.body;
    const userId = req.user._id;
    console.log('Exam Form Body:', req.body);

    if (!course || !education) {
      throw new AppError('All fields required', 400);
    }
    if (termsAccepted !== true) {
      throw new AppError('Terms must be accepted', 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    const existingPending = await ExamSession.findOne({
      userId,
      status: 'pending',
    });
    if (existingPending) {
      await ExamSession.findByIdAndDelete(existingPending._id);
    }

    const session = await ExamSession.create({
      userId,
      name: user.name,
      email: user.email,
      course,
      education,
      selectedLanguages: [],
      questions: [],
      status: 'pending',
    });

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    await OTP.deleteMany({ email: user.email, examSessionId: session._id });
    await OTP.create({
      email: user.email,
      otp: hashedOTP,
      expiresAt,
      attempts: 0,
      examSessionId: session._id,
    });

    await sendOTPEmail(user.email, otp);

    res.status(201).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        examSessionId: session._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP before exam start (public - no JWT, uses email + otp + examSessionId)
const verifyExamOTP = async (req, res, next) => {
  try {
    const { email, otp, examSessionId } = req.body;

    const session = await ExamSession.findById(examSessionId);
    if (!session) throw new AppError('Invalid exam session.', 404);
    if (session.status !== 'pending')
      throw new AppError('Session already verified or expired.', 400);

    if (session.userId) {
      const user = await User.findById(session.userId);
      if (!user || user.email !== email) {
        throw new AppError('Email does not match session.', 400);
      }
    } else {
      if ((session.email || '').toLowerCase() !== email.toLowerCase()) {
        throw new AppError('Email does not match session.', 400);
      }
    }

    const otpRecord = await OTP.findOne({
      email,
      examSessionId: new mongoose.Types.ObjectId(examSessionId),
    });
    if (!otpRecord)
      throw new AppError('Invalid or expired OTP. Request a new one.', 400);

    if (otpRecord.attempts >= config.otp.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new AppError('Maximum OTP attempts exceeded.', 400);
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new AppError('OTP has expired.', 400);
    }

    const isValid = await compareOTP(otp, otpRecord.otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new AppError(
        `Invalid OTP. ${config.otp.maxAttempts - otpRecord.attempts} attempt(s) remaining.`,
        400
      );
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    session.otpVerified = true;
    await session.save();

    res.json({
      success: true,
      message: 'OTP verified. You can now start the exam.',
      data: { examSessionId: session._id },
    });
  } catch (error) {
    next(error);
  }
};

// Request OTP for exam (resend) - protected
const requestExamOTP = async (req, res, next) => {
  try {
    const { examSessionId } = req.body;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
      status: 'pending',
    });
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);

    const user = await User.findById(userId);
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    await OTP.deleteMany({ examSessionId: session._id });
    await OTP.create({
      email: user.email,
      otp: hashedOTP,
      expiresAt,
      attempts: 0,
      examSessionId: session._id,
    });

    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: 'OTP resent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// STEP 3: Start exam - select 6 languages, fetch 5 questions per language
const startExam = async (req, res, next) => {
  try {
    const { selectedLanguages } = req.body;
    const userId = req.user._id;
    console.log('User from token:', req.user);

    let session = await ExamSession.findOne({
      userId,
      otpVerified: true,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (!session) {
      session = await ExamSession.findOne({
        userId,
        status: 'pending',
      }).sort({ createdAt: -1 });
    }

    if (!session) {
      throw new AppError('Complete exam form and OTP verification first.', 400);
    }
    if (!session.otpVerified) {
      throw new AppError('OTP verification required before starting.', 400);
    }
    if (session.status !== 'pending') {
      throw new AppError('Exam already started or completed.', 400);
    }

    if (
      !Array.isArray(selectedLanguages) ||
      selectedLanguages.length !== config.exam.maxLanguages
    ) {
      throw new AppError(
        `Exactly ${config.exam.maxLanguages} languages must be selected.`,
        400
      );
    }

    const questionIds = [];
    for (const lang of selectedLanguages) {
      const questions = await Question.aggregate([
        { $match: { course: session.course, language: lang } },
        { $sample: { size: config.exam.questionsPerLanguage } },
      ]);
      if (questions.length < config.exam.questionsPerLanguage) {
        throw new AppError(
          `Not enough questions for language "${lang}". Need at least ${config.exam.questionsPerLanguage}.`,
          400
        );
      }
      questionIds.push(...questions.map((q) => q._id));
    }

    session.selectedLanguages = selectedLanguages;
    session.questions = questionIds;
    session.status = 'in-progress';
    session.startTime = new Date();
    await session.save();

    const questions = await Question.find({ _id: { $in: questionIds } })
      .select('-correctAnswer')
      .lean();

    const orderedQuestions = questionIds.map((id) =>
      questions.find((q) => q._id.toString() === id.toString())
    );

    res.json({
      success: true,
      message: 'Exam started.',
      data: {
        sessionId: session._id,
        examSessionId: session._id,
        questions: orderedQuestions,
        totalQuestions: config.exam.totalQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get questions for active session (without correct answers)
const getQuestions = async (req, res, next) => {
  try {
    const { examSessionId } = req.params;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
      status: 'in-progress',
    });
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);

    const questions = await Question.find({ _id: { $in: session.questions } })
      .select('-correctAnswer')
      .lean();

    const orderedQuestions = session.questions.map((qId) =>
      questions.find((q) => q._id.toString() === qId.toString())
    );

    const answersObj =
      session.answers instanceof Map
        ? Object.fromEntries(session.answers)
        : session.answers || {};

    res.json({
      success: true,
      data: {
        questions: orderedQuestions,
        answers: answersObj,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Log cheating event
const logCheatingEvent = async (req, res, next) => {
  try {
    const { examSessionId, eventType } = req.body;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
      status: 'in-progress',
    });
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);

    session.cheatingEvents += 1;
    if (session.cheatingEvents > config.exam.cheatingThreshold) {
      session.status = 'auto-submitted';
      session.endTime = new Date();
      await session.save();
      await calculateAndSaveResult(session);
      return res.json({
        success: true,
        message: 'Exam auto-submitted due to cheating threshold exceeded.',
        data: { autoSubmitted: true },
      });
    }
    await session.save();

    res.json({
      success: true,
      message: 'Cheating event logged.',
      data: { cheatingEvents: session.cheatingEvents },
    });
  } catch (error) {
    next(error);
  }
};

// Submit exam
const submitExam = async (req, res, next) => {
  try {
    const { examSessionId, answers } = req.body;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
      status: 'in-progress',
    });
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);

    const questionIds = session.questions.map((id) => id.toString());
    const submittedQuestionIds = Object.keys(answers || {});

    for (const qId of submittedQuestionIds) {
      if (!questionIds.includes(qId)) {
        throw new AppError('Invalid question in answers.', 400);
      }
    }

    session.answers = new Map(Object.entries(answers || {}));
    session.status = 'submitted';
    session.endTime = new Date();
    await session.save();

    const result = await calculateAndSaveResult(session);

    res.json({
      success: true,
      message: 'Exam submitted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

async function calculateAndSaveResult(session) {
  const questions = await Question.find({ _id: { $in: session.questions } });
  const answerMap = session.answers instanceof Map ? session.answers : new Map(Object.entries(session.answers || {}));

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  for (const q of questions) {
    const selected = answerMap.get(q._id.toString()) || '';
    if (!selected || selected.trim() === '') {
      unanswered++;
    } else if (selected === q.correctAnswer) {
      correct++;
    } else {
      wrong++;
    }
  }

  const total = questions.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passFail = percentage >= config.exam.passPercentage ? 'pass' : 'fail';

  const result = await Result.create({
    userId: session.userId,
    examSessionId: session._id,
    course: session.course,
    totalQuestions: total,
    correct,
    wrong,
    unanswered,
    percentage,
    passFail,
  });

  return {
    totalQuestions: total,
    correct,
    wrong,
    unanswered,
    percentage,
    passFail,
  };
}

// Get result for a session
const getResult = async (req, res, next) => {
  try {
    const { examSessionId } = req.params;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
    });
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);
    if (!['submitted', 'auto-submitted'].includes(session.status))
      throw new AppError('Exam not yet submitted.', 400);

    const result = await Result.findOne({
      examSessionId,
      userId,
    });
    if (!result) throw new AppError('Result not found.', 404);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get session status
const getSessionStatus = async (req, res, next) => {
  try {
    const { examSessionId } = req.params;
    const userId = req.user._id;

    const session = await ExamSession.findOne({
      _id: examSessionId,
      userId,
    }).select('-answers');
    if (!session) throw new AppError('Invalid or unauthorized session.', 404);

    res.json({
      success: true,
      data: {
        status: session.status,
        otpVerified: session.otpVerified,
        cheatingEvents: session.cheatingEvents,
        startTime: session.startTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// User: own results history
const getSelfResults = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const results = await Result.find({ userId }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create question
const createQuestion = async (req, res, next) => {
  try {
    const { course, language, question, options, correctAnswer } = req.body;

    if (!options.includes(correctAnswer)) {
      throw new AppError('Correct answer must be one of the options.', 400);
    }

    const q = await Question.create({
      course,
      language,
      question,
      options,
      correctAnswer,
    });

    res.status(201).json({
      success: true,
      message: 'Question created.',
      data: { id: q._id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitExamForm,
  sendExamOTP,
  verifyExamOTP,
  requestExamOTP,
  startExam,
  getQuestions,
  logCheatingEvent,
  submitExam,
  getResult,
  getSessionStatus,
  getSelfResults,
  createQuestion,
};
