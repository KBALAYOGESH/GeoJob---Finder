const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  companyName: { type: String, trim: true },
  companyWebsite: { type: String, trim: true },
  companySize: { type: String, trim: true },
  about: { type: String, trim: true }
}, { timestamps: true });

const RecruiterProfile = mongoose.model('RecruiterProfile', recruiterProfileSchema);

module.exports = { RecruiterProfile };

