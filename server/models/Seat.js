const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  locationCode: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  seatLabel: { type: String, required: true },
  zone: { type: String, default: '' },
  amenities: [{ type: String }],
  isBlocked: { type: Boolean, default: false },
  blockedReason: { type: String, default: '' },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

seatSchema.index({ locationCode: 1, isActive: 1, isBlocked: 1 });

module.exports = mongoose.model('Seat', seatSchema);
