const router = require('express').Router();
const { auth } = require('../middleware/auth');
const bookingCtrl = require('../controllers/booking.controller');
const Location = require('../models/Location');

router.get('/available', auth, bookingCtrl.getAvailableSeats);

module.exports = router;
