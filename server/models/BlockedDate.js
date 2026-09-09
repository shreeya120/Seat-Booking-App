const mongoose = require('mongoose');

const blockedDateSchema = new mongoose.Schema({
  locationCode: { type: String, required: true },
  blockedDate: { type: Date, required: true },
  reason: { type: String, default: '' },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('BlockedDate', blockedDateSchema);
