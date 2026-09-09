const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locationCode: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  startDatetime: { type: Date, required: true },
  endDatetime: { type: Date, required: true },
  crossesMidnight: { type: Boolean, default: false },
  durationHours: { type: Number, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  cancellationReason: { type: String, default: '' },
  cancelledBy: { type: String, enum: ['employee', 'admin', 'system', ''], default: '' },
  bookedAt: { type: Date, default: Date.now },
}, { timestamps: true });

bookingSchema.index({ locationCode: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ startDatetime: 1, endDatetime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
