const User = require('./user.model');
const { generateToken } = require('../../utils/jwt');
const { AppError } = require('../../utils/errors');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Debug: log non-sensitive request data
    console.log('[AUTH][REGISTER] incoming:', {
      name,
      email,
      role: role || 'user',
    });

    const existingUser = await User.findOne({ email });
    console.log('[AUTH][REGISTER] existingUser:', !!existingUser);
    if (existingUser) {
      throw new AppError('Email already registered.', 400);
    }

    const user = await User.create({ name, email, password, role });
    console.log('[AUTH][REGISTER] user created:', {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const token = generateToken({ userId: user._id, role: user.role });
    console.log('[AUTH][REGISTER] jwt generated for userId:', user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('[AUTH][LOGIN] incoming:', { email });
    const user = await User.findOne({ email }).select('+password');
    console.log('[AUTH][LOGIN] user found:', !!user);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    console.log('[AUTH][LOGIN] password match:', isMatch);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken({ userId: user._id, role: user.role });
    console.log('[AUTH][LOGIN] jwt generated for userId:', user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
