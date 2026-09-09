const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/booking.controller');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { bookingSchema } = require('../validations/schemas');

const bookingLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many booking requests' } });

router.get('/mine', auth, ctrl.myBookings);
router.get('/mine/history', auth, ctrl.myHistory);
router.get('/blocked-dates', auth, ctrl.getBlockedDates);
router.post('/', auth, bookingLimiter, validate(bookingSchema), ctrl.create);
router.delete('/:id', auth, ctrl.cancel);

module.exports = router;
