const mongoose = require('mongoose');

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'intern', 'remote'];
const JOB_STATUSES = ['draft', 'published', 'closed'];

const jobSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  companyName: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true, index: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, trim: true, index: true },
  type: { type: String, enum: JOB_TYPES, index: true },
  location: { type: String, trim: true, index: true },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  currency: { type: String, default: 'GBP', trim: true },
  skills: [{ type: String, trim: true, index: true }],
  status: { type: String, enum: JOB_STATUSES, default: 'draft', index: true }
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', skills: 'text', companyName: 'text', location: 'text' });

const Job = mongoose.model('Job', jobSchema);

module.exports = { Job, JOB_TYPES, JOB_STATUSES };

