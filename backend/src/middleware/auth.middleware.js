const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');
const User = require('../modules/auth/user.model');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token.', 401);
    }
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AppError('User not found.', 401);
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
