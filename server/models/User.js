const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  employeeId: { type: String, required: true, trim: true },
  department: { type: String, default: '' },
  primaryLocation: { type: String, required: true },
  allowedLocations: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
