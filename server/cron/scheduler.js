const { CronJob } = require('cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { enqueueEmail } = require('../jobs/emailJob');
const { bookingConfirmEmail } = require('../services/email.service');

// Complete past bookings — Saturday 2:00 AM IST
const completePastBookings = new CronJob('0 2 * * 6', async () => {
  const result = await Booking.updateMany(
    { status: 'active', endDatetime: { $lt: new Date() } },
    { status: 'completed' },
  );
  console.log(`[Cron] Completed ${result.modifiedCount} past bookings`);
}, null, false, 'Asia/Kolkata');

// Day-before reminder — Daily 8:00 AM IST
const dayBeforeReminder = new CronJob('0 8 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await Booking.find({ status: 'active', bookingDate: { $gte: tomorrow, $lt: dayAfter } }).populate('userId', 'name email').populate('seatId', 'seatLabel');
  for (const b of bookings) {
    if (b.userId?.email) {
      enqueueEmail(b.userId.email, `Reminder: seat booked tomorrow at ${b.locationCode}`,
        `<p>Hi ${b.userId.name}, you have seat <strong>${b.seatId?.seatLabel}</strong> booked tomorrow (${b.startTime}–${b.endTime}).</p>`);
    }
  }
  console.log(`[Cron] Sent ${bookings.length} reminders`);
}, null, false, 'Asia/Kolkata');

// Weekly digest — Monday 8:00 AM IST
const weeklyDigest = new CronJob('0 8 * * 1', async () => {
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  const users = await User.find({ isActive: true, isEmailVerified: true });
  for (const u of users) {
    const bookings = await Booking.find({ userId: u._id, status: 'active', startDatetime: { $gte: now, $lte: weekEnd } }).populate('seatId', 'seatLabel');
    if (bookings.length) {
      const list = bookings.map(b => `<li>${b.seatId?.seatLabel} — ${b.locationCode} — ${b.startTime}→${b.endTime}</li>`).join('');
      enqueueEmail(u.email, 'Your bookings this week', `<p>Hi ${u.name},</p><ul>${list}</ul>`);
    }
  }
}, null, false, 'Asia/Kolkata');

const startCrons = () => {
  completePastBookings.start();
  dayBeforeReminder.start();
  weeklyDigest.start();
  console.log('[Cron] All scheduled jobs started');
};

module.exports = { startCrons };
