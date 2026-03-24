const User = require('./user.model');
const { generateToken } = require('../../utils/jwt');
const { AppError } = require('../../utils/errors');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    console.log('[AUTH][REGISTER] incoming:', {
      name,
      email,
      role: 'user',
    });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered.', 400);
    }

    const user = await User.create({ name, email, password, role: 'user' });
    const token = generateToken({ userId: user._id, role: user.role });

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

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'user') {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked. Contact admin.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken({ userId: user._id, role: user.role });
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

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'admin') {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Account is blocked. Contact owner.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = generateToken({ userId: user._id, role: user.role });
    res.json({
      success: true,
      message: 'Admin login successful',
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
  loginUser,
  loginAdmin,
  getMe,
};
