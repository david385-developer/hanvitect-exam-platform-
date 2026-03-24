/**
 * Mock email function for development.
 * Replace with actual email service (SendGrid, Nodemailer, etc.) in production.
 */
const sendOTPEmail = async (email, otp) => {
  // Mock: log to console instead of sending
  console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
  return { success: true };
};

module.exports = { sendOTPEmail };
