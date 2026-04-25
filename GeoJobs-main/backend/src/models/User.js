const mongoose = require('mongoose');

const USER_ROLES = ['jobseeker', 'recruiter', 'admin'];
const USER_STATUSES = ['active', 'blocked'];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: USER_ROLES, index: true },
  status: { type: String, required: true, enum: USER_STATUSES, default: 'active', index: true },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User, USER_ROLES, USER_STATUSES };

