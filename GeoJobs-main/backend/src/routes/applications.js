const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { Job } = require('../models/Job');
const { Application, APPLICATION_STATUSES } = require('../models/Application');
const { Notification } = require('../models/Notification');

const router = express.Router();

function canManageJob(req, job) {
  return req.user.role === 'admin' || job.createdBy.toString() === req.user.id;
}

const applySchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    portfolio: z.string().optional(),
    notice: z.string().optional(),
    expectedSalary: z.string().optional(),
    coverLetter: z.string().min(10).max(20000).optional(),
    resumeFileId: z.string().min(10).optional()
  })
});

router.post('/jobs/:id/apply', requireAuth, requireRole('jobseeker', 'admin'), validate(applySchema), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (job.status !== 'published') return res.status(400).json({ error: { message: 'Job not accepting applications' } });

  try {
    const application = await Application.create({
      jobId: job._id,
      applicantUserId: req.user.id,
      fullName: req.validated.body.fullName,
      email: req.validated.body.email,
      phone: req.validated.body.phone,
      location: req.validated.body.location,
      portfolio: req.validated.body.portfolio,
      notice: req.validated.body.notice,
      expectedSalary: req.validated.body.expectedSalary,
      coverLetter: req.validated.body.coverLetter,
      resumeFileId: req.validated.body.resumeFileId
    });

    await Notification.create({
      userId: job.createdBy,
      type: 'application.created',
      title: 'New application received',
      body: `A candidate applied for ${job.title} at ${job.companyName}.`
    });

    res.status(201).json({ application });
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ error: { message: 'Already applied to this job' } });
    }
    throw e;
  }
}));

router.get('/applications/me', requireAuth, requireRole('jobseeker', 'admin'), asyncHandler(async (req, res) => {
  const items = await Application.find({ applicantUserId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('jobId')
    .lean();
  res.json({ items });
}));

router.get('/jobs/:id/applications', requireAuth, requireRole('recruiter', 'admin'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  const items = await Application.find({ jobId: job._id })
    .sort({ createdAt: -1 })
    .populate('applicantUserId', 'email role status createdAt')
    .lean();

  res.json({ items });
}));

const patchStatusSchema = z.object({
  body: z.object({
    status: z.enum(APPLICATION_STATUSES)
  })
});

router.patch('/applications/:id/status', requireAuth, requireRole('recruiter', 'admin'), validate(patchStatusSchema), asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ error: { message: 'Application not found' } });

  const job = await Job.findById(application.jobId);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  application.status = req.validated.body.status;
  await application.save();

  await Notification.create({
    userId: application.applicantUserId,
    type: 'application.status',
    title: 'Application status updated',
    body: `Your application status is now: ${application.status}.`
  });

  res.json({ application });
}));

module.exports = router;

