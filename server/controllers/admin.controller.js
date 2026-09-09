const User = require('../models/User');
const Seat = require('../models/Seat');
const Location = require('../models/Location');
const Booking = require('../models/Booking');
const BlockedDate = require('../models/BlockedDate');
const AuditLog = require('../models/AuditLog');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

// --- Users ---
exports.getUsers = async (req, res, next) => {
  try {
    const { search, location, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (location) filter.primaryLocation = location;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    const users = await User.find(filter).select('-passwordHash').skip((page - 1) * limit).limit(+limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.addUser = async (req, res, next) => {
  try {
    const { name, email, employeeId, primaryLocation, department, password } = req.body;
    const user = await User.create({ name, email, passwordHash: password || 'Temp@1234', employeeId, primaryLocation, allowedLocations: [primaryLocation], department, isEmailVerified: true });
    await AuditLog.create({ actorId: req.user._id, action: 'USER_ADDED', targetType: 'user', targetId: user._id.toString() });
    res.status(201).json(user);
  } catch (err) { next(err); }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'Cannot deactivate yourself' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    await Booking.updateMany({ userId: req.params.id, status: 'active' }, { status: 'cancelled', cancelledBy: 'admin', cancellationReason: 'Account deactivated' });
    await AuditLog.create({ actorId: req.user._id, action: 'USER_DEACTIVATED', targetType: 'user', targetId: req.params.id });
    res.json({ message: 'User deactivated' });
  } catch (err) { next(err); }
};

exports.activateUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: true });
    await AuditLog.create({ actorId: req.user._id, action: 'USER_ACTIVATED', targetType: 'user', targetId: req.params.id });
    res.json({ message: 'User activated' });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'Cannot delete yourself' });
    await Booking.updateMany({ userId: req.params.id, status: 'active' }, { status: 'cancelled', cancelledBy: 'admin' });
    await User.findByIdAndDelete(req.params.id);
    await AuditLog.create({ actorId: req.user._id, action: 'USER_DELETED', targetType: 'user', targetId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
};

exports.updateUserLocations = async (req, res, next) => {
  try {
    const { allowedLocations } = req.body;
    await User.findByIdAndUpdate(req.params.id, { allowedLocations });
    await AuditLog.create({ actorId: req.user._id, action: 'USER_LOCATIONS_UPDATED', targetType: 'user', targetId: req.params.id, metadata: { allowedLocations } });
    res.json({ message: 'Locations updated' });
  } catch (err) { next(err); }
};

// --- Seats ---
exports.getSeats = async (req, res, next) => {
  try {
    const seats = await Seat.find({ locationCode: req.params.locationCode });
    res.json(seats);
  } catch (err) { next(err); }
};

exports.addSeat = async (req, res, next) => {
  try {
    const seat = await Seat.create(req.validated);
    await Location.findOneAndUpdate({ code: req.validated.locationCode }, { $inc: { totalSeats: 1 } });
    await AuditLog.create({ actorId: req.user._id, action: 'SEAT_ADDED', targetType: 'seat', targetId: seat._id.toString() });
    res.status(201).json(seat);
  } catch (err) { next(err); }
};

exports.bulkAddSeats = async (req, res, next) => {
  try {
    const { locationCode, startNumber, endNumber, zone } = req.validated;
    const seats = [];
    for (let i = startNumber; i <= endNumber; i++) {
      seats.push({ locationCode, seatNumber: i, seatLabel: `${locationCode}-${i}`, zone });
    }
    const created = await Seat.insertMany(seats);
    await Location.findOneAndUpdate({ code: locationCode }, { $inc: { totalSeats: created.length } });
    await AuditLog.create({ actorId: req.user._id, action: 'SEATS_BULK_ADDED', targetType: 'seat', metadata: { locationCode, count: created.length } });
    res.status(201).json({ count: created.length });
  } catch (err) { next(err); }
};

exports.blockSeat = async (req, res, next) => {
  try {
    await Seat.findByIdAndUpdate(req.params.id, { isBlocked: true, blockedReason: req.body.reason || '', blockedBy: req.user._id });
    await AuditLog.create({ actorId: req.user._id, action: 'SEAT_BLOCKED', targetType: 'seat', targetId: req.params.id });
    res.json({ message: 'Seat blocked' });
  } catch (err) { next(err); }
};

exports.unblockSeat = async (req, res, next) => {
  try {
    await Seat.findByIdAndUpdate(req.params.id, { isBlocked: false, blockedReason: '', blockedBy: null });
    res.json({ message: 'Seat unblocked' });
  } catch (err) { next(err); }
};

exports.deleteSeat = async (req, res, next) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, { isActive: false });
    if (seat) await Location.findOneAndUpdate({ code: seat.locationCode }, { $inc: { totalSeats: -1 } });
    await AuditLog.create({ actorId: req.user._id, action: 'SEAT_REMOVED', targetType: 'seat', targetId: req.params.id });
    res.json({ message: 'Seat removed' });
  } catch (err) { next(err); }
};

// --- Locations ---
exports.getLocations = async (_req, res, next) => {
  try { res.json(await Location.find()); } catch (err) { next(err); }
};

exports.addLocation = async (req, res, next) => {
  try {
    const loc = await Location.create({ ...req.validated, createdBy: req.user._id });
    await AuditLog.create({ actorId: req.user._id, action: 'LOCATION_ADDED', targetType: 'location', targetId: loc._id.toString() });
    res.status(201).json(loc);
  } catch (err) { next(err); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(loc);
  } catch (err) { next(err); }
};

exports.deactivateLocation = async (req, res, next) => {
  try {
    await Location.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Location deactivated' });
  } catch (err) { next(err); }
};

// --- Bookings (admin) ---
exports.getAllBookings = async (req, res, next) => {
  try {
    const { location, status, date, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (location) filter.locationCode = location;
    if (status) filter.status = status;
    if (date) { const d = new Date(date); filter.bookingDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) }; }
    const bookings = await Booking.find(filter).populate('userId', 'name email').populate('seatId', 'seatLabel').skip((page - 1) * limit).limit(+limit).sort({ startDatetime: -1 });
    const total = await Booking.countDocuments(filter);
    res.json({ bookings, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled', cancelledBy: 'admin', cancellationReason: req.body.reason || 'Cancelled by admin' }, { new: true });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    await Notification.create({ userId: booking.userId, type: 'booking_cancelled', message: 'Your booking was cancelled by admin' });
    const io = req.app.get('io');
    if (io) io.to(`seats:${booking.locationCode}`).emit('seat:update', { seatId: booking.seatId, available: true });
    res.json({ message: 'Booking cancelled' });
  } catch (err) { next(err); }
};

exports.swapSeat = async (req, res, next) => {
  try {
    const { newSeatId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.status !== 'active') return res.status(404).json({ error: 'Active booking not found' });
    const oldSeatId = booking.seatId;
    booking.seatId = newSeatId;
    await booking.save();
    await Notification.create({ userId: booking.userId, type: 'seat_swapped', message: 'Your seat has been changed by admin' });
    const io = req.app.get('io');
    if (io) {
      io.to(`seats:${booking.locationCode}`).emit('seat:update', { seatId: oldSeatId, available: true });
      io.to(`seats:${booking.locationCode}`).emit('seat:update', { seatId: newSeatId, available: false });
    }
    res.json({ message: 'Seat swapped' });
  } catch (err) { next(err); }
};

// --- Block Dates ---
exports.getBlockedDates = async (_req, res, next) => {
  try { res.json(await BlockedDate.find().sort({ blockedDate: -1 })); } catch (err) { next(err); }
};

exports.blockDate = async (req, res, next) => {
  try {
    const { locationCode, blockedDate, reason } = req.validated;
    const bd = await BlockedDate.create({ locationCode, blockedDate: new Date(blockedDate), reason, blockedBy: req.user._id });
    const filter = { status: 'active', bookingDate: { $gte: new Date(blockedDate), $lt: new Date(new Date(blockedDate).getTime() + 86400000) } };
    if (locationCode !== 'ALL') filter.locationCode = locationCode;
    await Booking.updateMany(filter, { status: 'cancelled', cancelledBy: 'system', cancellationReason: reason || 'Date blocked by admin' });
    await AuditLog.create({ actorId: req.user._id, action: 'DATE_BLOCKED', targetType: 'date', metadata: { locationCode, blockedDate } });
    res.status(201).json(bd);
  } catch (err) { next(err); }
};

exports.unblockDate = async (req, res, next) => {
  try {
    await BlockedDate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Date unblocked' });
  } catch (err) { next(err); }
};

// --- Analytics ---
exports.analytics = async (req, res, next) => {
  try {
    const { location, startDate, endDate } = req.query;
    const match = { status: { $in: ['active', 'completed'] } };
    if (location) match.locationCode = location;
    if (startDate && endDate) match.bookingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const [dailyOccupancy, topSeats, byHour, byDay, byLocation] = await Promise.all([
      Booking.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 30 }]),
      Booking.aggregate([{ $match: match }, { $group: { _id: '$seatId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }, { $lookup: { from: 'seats', localField: '_id', foreignField: '_id', as: 'seat' } }, { $unwind: '$seat' }]),
      Booking.aggregate([{ $match: match }, { $group: { _id: { $substr: ['$startTime', 0, 2] }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Booking.aggregate([{ $match: match }, { $group: { _id: { $dayOfWeek: '$bookingDate' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Booking.aggregate([{ $match: { status: { $in: ['active', 'completed'] } } }, { $group: { _id: '$locationCode', count: { $sum: 1 } } }]),
    ]);
    res.json({ dailyOccupancy, topSeats, byHour, byDay, byLocation });
  } catch (err) { next(err); }
};

// --- Audit Log ---
exports.auditLog = async (req, res, next) => {
  try {
    const { action, actorId, location, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (actorId) filter.actorId = actorId;
    const logs = await AuditLog.find(filter).populate('actorId', 'name email').skip((page - 1) * limit).limit(+limit).sort({ createdAt: -1 });
    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total, page: +page });
  } catch (err) { next(err); }
};

// --- Announcements ---
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { location } = req.query;
    const filter = { isActive: true };
    if (location) filter.$or = [{ locationCode: location }, { locationCode: 'ALL' }];
    res.json(await Announcement.find(filter).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.create({ ...req.validated, createdBy: req.user._id });
    res.status(201).json(ann);
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Announcement removed' });
  } catch (err) { next(err); }
};

// --- Notifications ---
exports.getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (err) { next(err); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

// --- Sync ---
exports.triggerSync = async (req, res, next) => {
  try {
    const { syncAllUsers } = require('../services/onedrive.service');
    const users = await User.find().select('-passwordHash');
    await syncAllUsers(users);
    await AuditLog.create({ actorId: req.user._id, action: 'ONEDRIVE_SYNC', targetType: 'user', metadata: { manual: true } });
    res.json({ message: 'Sync triggered', syncedAt: new Date() });
  } catch (err) { next(err); }
};

exports.syncStatus = async (_req, res, next) => {
  try {
    const last = await AuditLog.findOne({ action: 'ONEDRIVE_SYNC' }).sort({ createdAt: -1 });
    res.json({ lastSync: last?.createdAt || null });
  } catch (err) { next(err); }
};
