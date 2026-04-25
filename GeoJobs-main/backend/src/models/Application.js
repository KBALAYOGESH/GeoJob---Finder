const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['applied', 'shortlisted', 'rejected', 'withdrawn'];

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: APPLICATION_STATUSES, default: 'applied', index: true },
  fullName: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  portfolio: { type: String, trim: true },
  notice: { type: String, trim: true },
  expectedSalary: { type: String, trim: true },
  coverLetter: { type: String, trim: true },
  resumeFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' }
}, { timestamps: true });

applicationSchema.index({ jobId: 1, applicantUserId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = { Application, APPLICATION_STATUSES };

