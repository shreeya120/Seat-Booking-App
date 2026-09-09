const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const BlockedDate = require('../models/BlockedDate');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { createBooking } = require('../services/booking.service');

exports.getAvailableSeats = async (req, res, next) => {
  try {
    const { location, startDatetime, endDatetime } = req.query;
    if (!location || !startDatetime || !endDatetime) return res.status(400).json({ error: 'Missing params' });

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    const BUFFER = 3600000;

    // Check if date is blocked
    const dayStart = new Date(start); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(start); dayEnd.setHours(23, 59, 59, 999);
    const blocked = await BlockedDate.findOne({
      $or: [{ locationCode: location }, { locationCode: 'ALL' }],
      blockedDate: { $gte: dayStart, $lte: dayEnd },
    });
    if (blocked) return res.status(400).json({ error: `Date blocked: ${blocked.reason || 'Unavailable'}` });

    const bookedSeatIds = await Booking.distinct('seatId', {
      locationCode: location, status: 'active',
      startDatetime: { $lt: new Date(end.getTime() + BUFFER) },
      endDatetime: { $gt: new Date(start.getTime() - BUFFER) },
    });

    const seats = await Seat.find({ locationCode: location, isActive: true });
    const result = seats.map(s => ({
      ...s.toObject(),
      available: !s.isBlocked && !bookedSeatIds.some(id => id.toString() === s._id.toString()),
    }));
    res.json(result);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const booking = await createBooking(req.user._id, req.validated);
    await AuditLog.create({ actorId: req.user._id, action: 'BOOKING_CREATED', targetType: 'booking', targetId: booking._id.toString() });
    await Notification.create({ userId: req.user._id, type: 'booking_confirmed', message: `Seat ${booking.seatLabel} booked at ${booking.locationCode}` });

    const io = req.app.get('io');
    if (io) io.to(`seats:${booking.locationCode}`).emit('seat:update', { seatId: booking.seatId, available: false });

    res.status(201).json(booking);
  } catch (err) { next(err); }
};

exports.myBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id, status: 'active' }).populate('seatId').sort({ startDatetime: 1 });
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.myHistory = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id, status: { $in: ['cancelled', 'completed'] } }).populate('seatId').sort({ startDatetime: -1 }).limit(50);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id, status: 'active' });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.status = 'cancelled';
    booking.cancelledBy = 'employee';
    booking.cancellationReason = req.body.reason || '';
    await booking.save();

    await AuditLog.create({ actorId: req.user._id, action: 'BOOKING_CANCELLED', targetType: 'booking', targetId: booking._id.toString() });
    const io = req.app.get('io');
    if (io) io.to(`seats:${booking.locationCode}`).emit('seat:update', { seatId: booking.seatId, available: true });

    res.json({ message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

exports.getBlockedDates = async (req, res, next) => {
  try {
    const { location } = req.query;
    const filter = location ? { $or: [{ locationCode: location }, { locationCode: 'ALL' }] } : {};
    const dates = await BlockedDate.find(filter);
    res.json(dates);
  } catch (err) { next(err); }
};
