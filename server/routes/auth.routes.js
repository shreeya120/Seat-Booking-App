const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { registerSchema, loginSchema, otpSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validations/schemas');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts' } });
const otpLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3, message: { error: 'OTP rate limit exceeded' } });

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/verify-otp', validate(otpSchema), ctrl.verifyOtp);
router.post('/login', loginLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', auth, ctrl.me);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);
router.post('/resend-otp', otpLimiter, ctrl.resendOtp);

module.exports = router;
