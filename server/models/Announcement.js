const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  locationCode: { type: String, required: true },
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
