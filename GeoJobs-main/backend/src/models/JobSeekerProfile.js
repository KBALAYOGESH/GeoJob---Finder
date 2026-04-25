const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, trim: true },
  degree: { type: String, trim: true },
  fieldOfStudy: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date }
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company: { type: String, trim: true },
  title: { type: String, trim: true },
  location: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  description: { type: String, trim: true }
}, { _id: false });

const jobSeekerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, trim: true },
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  skills: [{ type: String, trim: true }],
  education: [educationSchema],
  experience: [experienceSchema],
  resumeFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' }
}, { timestamps: true });

const JobSeekerProfile = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);

module.exports = { JobSeekerProfile };

