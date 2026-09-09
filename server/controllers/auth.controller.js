const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createOtp, verifyOtp } = require('../services/otp.service');
const { sendEmail, otpEmail } = require('../services/email.service');
const AuditLog = require('../models/AuditLog');

const allowedDomains = () => (process.env.ALLOWED_EMAIL_DOMAINS || 'ascendion.com,nitor.com').split(',');

const isEmailAllowed = (email) => allowedDomains().some(d => email.endsWith(`@${d.trim()}`));

const signToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, primaryLocation, department } = req.validated;
    if (!isEmailAllowed(email)) return res.status(400).json({ error: `Only ${allowedDomains().join(', ')} emails allowed` });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const isDev = process.env.NODE_ENV !== 'production';

    await User.create({ name, email, passwordHash: password, employeeId, primaryLocation, allowedLocations: [primaryLocation], department, isEmailVerified: isDev });

    if (isDev) {
      // Dev mode: skip OTP, auto-verify, user can login immediately
      console.log('[Dev] Auto-verified user:', email);
      return res.status(201).json({ message: 'Account created. You can login now.', autoVerified: true });
    }

    const otp = await createOtp(email, 'email_verification');
    try {
      await sendEmail(email, 'Verify your Ascendion account - OTP inside', otpEmail(otp, 'email_verification'));
    } catch (emailErr) {
      console.warn('[Email] Failed to send OTP:', emailErr.message);
    }
    res.status(201).json({ message: 'OTP sent to your email' });
  } catch (err) { next(err); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.validated;
    await verifyOtp(email, otp, 'email_verification');
    await User.findOneAndUpdate({ email }, { isEmailVerified: true });
    res.json({ message: 'Email verified. You can now login.' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });
    if (!user.isEmailVerified) return res.status(403).json({ error: 'Email not verified' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();
    setCookie(res, signToken(user._id, user.role));
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, primaryLocation: user.primaryLocation, allowedLocations: user.allowedLocations } });
  } catch (err) { next(err); }
};

exports.logout = (_req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated;
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.json({ message: 'If the email exists, an OTP has been sent.' });
    const otp = await createOtp(email, 'password_reset');
    await sendEmail(email, 'Reset your password - OTP inside', otpEmail(otp, 'password_reset'));
    res.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.validated;
    await verifyOtp(email, otp, 'password_reset');
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.passwordHash = newPassword;
    await user.save();
    await AuditLog.create({ actorId: user._id, action: 'PASSWORD_RESET', targetType: 'user', targetId: user._id.toString() });
    res.json({ message: 'Password reset successful' });
  } catch (err) { next(err); }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'OTP sent if account exists' });
    const purpose = user.isEmailVerified ? 'password_reset' : 'email_verification';
    const otp = await createOtp(email, purpose);
    await sendEmail(email, 'Your OTP', otpEmail(otp, purpose));
    res.json({ message: 'OTP sent if account exists' });
  } catch (err) { next(err); }
};
