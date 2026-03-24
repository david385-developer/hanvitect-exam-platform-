const bcrypt = require('bcrypt');
const config = require('../config');

const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

const generateOTP = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

const hashOTP = async (otp) => {
  return bcrypt.hash(otp, SALT_ROUNDS);
};

const compareOTP = async (plainOTP, hashedOTP) => {
  return bcrypt.compare(plainOTP, hashedOTP);
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + config.otp.expiryMinutes);
  return expiry;
};

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  getOTPExpiry,
};
