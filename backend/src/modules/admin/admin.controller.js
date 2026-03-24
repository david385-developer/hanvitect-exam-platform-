const User = require('../auth/user.model');
const Question = require('../exam/question.model');
const Result = require('../exam/result.model');
const ExamSession = require('../exam/examSession.model');
const { AppError } = require('../../utils/errors');

const getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExams = await ExamSession.countDocuments({ status: { $in: ['submitted', 'auto-submitted'] } });
    const passCount = await Result.countDocuments({ passFail: 'pass' });
    const failCount = await Result.countDocuments({ passFail: 'fail' });
    const wagering = await ExamSession.aggregate([
      { $group: { _id: null, cheatingEvents: { $sum: '$cheatingEvents' } } },
    ]);
    const violationsCount = (wagering[0] && wagering[0].cheatingEvents) || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalExams,
        passCount,
        failCount,
        violationsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, blocked } = req.query;
    const filter = {};
    if (blocked === 'true') filter.isBlocked = true;
    if (blocked === 'false') filter.isBlocked = false;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { total, users } });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;
    if (typeof isBlocked !== 'boolean') {
      throw new AppError('isBlocked boolean is required', 400);
    }
    const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const listQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, course, language } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (language) filter.language = language;

    const questions = await Question.find(filter)
      .select('-correctAnswer')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await Question.countDocuments(filter);
    res.json({ success: true, data: { total, questions } });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { course, language, question, options, correctAnswer } = req.body;
    if (!course || !language || !question || !options || !correctAnswer) {
      throw new AppError('Missing required fields', 400);
    }
    const created = await Question.create({ course, language, question, options, correctAnswer });
    res.status(201).json({ success: true, data: { id: created._id } });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { course, language, question, options, correctAnswer } = req.body;
    const update = { course, language, question, options };
    if (correctAnswer) update.correctAnswer = correctAnswer;
    const updated = await Question.findByIdAndUpdate(questionId, update, { new: true });
    if (!updated) throw new AppError('Question not found', 404);
    res.json({ success: true, data: { id: updated._id } });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const deleted = await Question.findByIdAndDelete(questionId);
    if (!deleted) throw new AppError('Question not found', 404);
    res.json({ success: true, message: 'Question removed' });
  } catch (error) {
    next(error);
  }
};

const listResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, course, from, to } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const results = await Result.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
    const total = await Result.countDocuments(filter);
    res.json({ success: true, data: { total, results } });
  } catch (error) {
    next(error);
  }
};

const listViolations = async (req, res, next) => {
  try {
    const stats = await ExamSession.aggregate([
      {
        $group: {
          _id: '$userId',
          totalCheating: { $sum: '$cheatingEvents' },
          sessions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalCheating: 1,
          sessions: 1,
        },
      },
      { $sort: { totalCheating: -1 } },
      { $limit: 50 },
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const courses = await Question.distinct('course');
    const languages = await Question.distinct('language');
    res.json({ success: true, data: { courses, languages } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  listUsers,
  updateUserStatus,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listResults,
  listViolations,
  getCourses,
};