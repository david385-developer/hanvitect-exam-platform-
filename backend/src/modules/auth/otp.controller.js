const OTP = require('./otp.model');
const { generateOTP, hashOTP, compareOTP, getOTPExpiry } = require('../../utils/otp');
const { sendOTPEmail } = require('../../utils/mockEmail');
const config = require('../../config');
const { AppError } = require('../../utils/errors');

// Generic send OTP (can be used for exam or other flows)
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const expiresAt = getOTPExpiry();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: hashedOTP,
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${config.otp.expiryMinutes} minutes.`,
    });
  } catch (error) {
    next(error);
  }
};

// Generic verify OTP
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP.', 400);
    }

    if (otpRecord.attempts >= config.otp.maxAttempts) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new AppError('Maximum OTP attempts exceeded. Please request a new OTP.', 400);
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    const isValid = await compareOTP(otp, otpRecord.otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = config.otp.maxAttempts - otpRecord.attempts;
      throw new AppError(
        `Invalid OTP. ${remaining} attempt(s) remaining.`,
        400
      );
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { verified: true, examSessionId: otpRecord.examSessionId },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
};
