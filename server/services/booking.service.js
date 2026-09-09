const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const BlockedDate = require('../models/BlockedDate');
const User = require('../models/User');
const { computeBookingDatetimes } = require('../utils/dateHelpers');

const BUFFER_MS = 3600000; // 1 hour buffer between bookings on same seat

const createBooking = async (userId, data) => {
  const { seatId, locationCode, bookingDate, startTime, endTime } = data;
  const { startDatetime, endDatetime, crossesMidnight, durationHours } = computeBookingDatetimes(bookingDate, startTime, endTime);

  // Duration check
  if (durationHours < 3 || durationHours > 12) {
    throw Object.assign(new Error('Duration must be 3-12 hours'), { status: 400 });
  }

  // Weekend check
  const bookDay = new Date(bookingDate).getDay();
  if (bookDay === 0 || bookDay === 6) {
    throw Object.assign(new Error('Bookings not allowed on weekends (Saturday/Sunday)'), { status: 400 });
  }

  // Blocked date check
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const blocked = await BlockedDate.findOne({
    $or: [{ locationCode }, { locationCode: 'ALL' }],
    blockedDate: { $gte: dayStart, $lte: dayEnd },
  });
  if (blocked) {
    throw Object.assign(new Error(`Date blocked: ${blocked.reason || 'Unavailable'}`), { status: 400 });
  }

  const user = await User.findById(userId);
  const isAdmin = user && user.role === 'admin';

  // --- Employee-only limits ---
  if (!isAdmin) {
    // Rule: Max 15 days in advance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 15);
    if (dayStart >= maxDate) {
      throw Object.assign(new Error('Employees can only book up to 15 days in advance'), { status: 400 });
    }

    // Rule: Max 10 active bookings within the next 15 days
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const activeInWindow = await Booking.countDocuments({
      userId,
      status: 'active',
      bookingDate: { $gte: tomorrow, $lt: maxDate },
    });
    if (activeInWindow >= 10) {
      throw Object.assign(new Error('Max 10 active bookings allowed in the next 15 days. Cancel an existing booking or wait.'), { status: 400 });
    }
  }

  // Rule: 1 booking per person per date (employees only, admin can book multiple)
  if (!isAdmin) {
    const existingOnDate = await Booking.findOne({
      userId,
      status: 'active',
      bookingDate: { $gte: dayStart, $lte: dayEnd },
    });
    if (existingOnDate) {
      throw Object.assign(new Error('You already have a booking on this date. One booking per day allowed.'), { status: 400 });
    }
  }

  // Seat availability check
  const seat = await Seat.findOne({ _id: seatId, locationCode, isActive: true, isBlocked: false });
  if (!seat) {
    throw Object.assign(new Error('Seat not available'), { status: 400 });
  }

  // 1-hour buffer: check if this seat has any booking that overlaps
  // (existing booking's time range + 1hr buffer on each side)
  const conflict = await Booking.findOne({
    seatId,
    status: 'active',
    startDatetime: { $lt: new Date(endDatetime.getTime() + BUFFER_MS) },
    endDatetime: { $gt: new Date(startDatetime.getTime() - BUFFER_MS) },
  });
  if (conflict) {
    throw Object.assign(new Error('Seat unavailable — there is an existing booking within the 1-hour buffer window. Please choose another seat or time.'), { status: 409 });
  }

  const booking = await Booking.create({
    seatId, userId, locationCode, bookingDate: dayStart,
    startTime, endTime, startDatetime, endDatetime,
    crossesMidnight, durationHours,
  });

  return { ...booking.toObject(), seatLabel: seat.seatLabel };
};

module.exports = { createBooking };
