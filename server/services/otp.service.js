const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OtpToken = require('../models/OtpToken');

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const createOtp = async (email, purpose) => {
  const recentCount = await OtpToken.countDocuments({
    email, purpose, createdAt: { $gte: new Date(Date.now() - 3600000) },
  });
  if (recentCount >= 3) throw Object.assign(new Error('OTP rate limit exceeded. Try again later.'), { status: 429 });

  const otp = generateOtp();
  const hashed = await bcrypt.hash(otp, 10);
  await OtpToken.create({
    email, otp: hashed, purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return otp;
};

const verifyOtp = async (email, otp, purpose) => {
  const token = await OtpToken.findOne({ email, purpose, used: false, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!token) throw Object.assign(new Error('OTP expired or not found'), { status: 400 });
  if (token.attempts >= 3) throw Object.assign(new Error('Max OTP attempts exceeded'), { status: 400 });

  const valid = await bcrypt.compare(otp, token.otp);
  if (!valid) {
    token.attempts += 1;
    await token.save();
    throw Object.assign(new Error('Invalid OTP'), { status: 400 });
  }
  token.used = true;
  await token.save();
  return true;
};

module.exports = { createOtp, verifyOtp };
