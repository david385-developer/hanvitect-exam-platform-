require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  otp: {
    expiryMinutes: 5,
    maxAttempts: 3,
  },
  exam: {
    cheatingThreshold: 3,
    passPercentage: 50,
    questionsPerLanguage: 5,
    maxLanguages: 6,
    totalQuestions: 30,
  },
};
