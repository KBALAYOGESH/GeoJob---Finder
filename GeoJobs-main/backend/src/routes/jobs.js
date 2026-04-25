const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { Job, JOB_STATUSES, JOB_TYPES } = require('../models/Job');

const router = express.Router();

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function canManageJob(req, job) {
  return req.user.role === 'admin' || job.createdBy.toString() === req.user.id;
}

// Public / authenticated job search
router.get('/jobs', asyncHandler(async (req, res) => {
  const {
    q,
    location,
    category,
    type,
    status,
    salaryMin,
    salaryMax,
    sort = 'latest',
    page = '1',
    limit = '10'
  } = req.query;

  const pg = Math.max(1, toInt(page, 1));
  const lim = Math.min(50, Math.max(1, toInt(limit, 10)));
  const skip = (pg - 1) * lim;

  const filter = {};

  // Default visibility: only published jobs unless admin/recruiter explicitly asks for own
  const reqStatus = typeof status === 'string' ? status : undefined;
  if (reqStatus && JOB_STATUSES.includes(reqStatus)) {
    filter.status = reqStatus;
  } else {
    filter.status = 'published';
  }

  if (typeof location === 'string' && location.trim()) filter.location = new RegExp(location.trim(), 'i');
  if (typeof category === 'string' && category.trim()) filter.category = category.trim();
  if (typeof type === 'string' && JOB_TYPES.includes(type)) filter.type = type;

  const min = toInt(salaryMin, undefined);
  const max = toInt(salaryMax, undefined);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.$and = filter.$and || [];
    if (Number.isFinite(min)) filter.$and.push({ salaryMax: { $gte: min } });
    if (Number.isFinite(max)) filter.$and.push({ salaryMin: { $lte: max } });
  }

  let query = Job.find(filter);

  if (typeof q === 'string' && q.trim()) {
    query = Job.find({ ...filter, $text: { $search: q.trim() } }, { score: { $meta: 'textScore' } });
    if (sort === 'relevance') query = query.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
  }

  if (sort === 'latest') query = query.sort({ createdAt: -1 });
  if (sort === 'salary_desc') query = query.sort({ salaryMax: -1, createdAt: -1 });

  const [items, total] = await Promise.all([
    query.skip(skip).limit(lim).lean(),
    Job.countDocuments(filter)
  ]);

  res.json({
    page: pg,
    limit: lim,
    total,
    items
  });
}));

router.get('/jobs/:id', asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean();
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (job.status !== 'published') {
    return res.status(403).json({ error: { message: 'Job not published' } });
  }
  res.json({ job });
}));

const createJobSchema = z.object({
  body: z.object({
    companyName: z.string().min(1).max(120),
    title: z.string().min(2).max(140),
    description: z.string().min(20).max(20000),
    category: z.string().min(1).max(80).optional(),
    type: z.enum(JOB_TYPES).optional(),
    location: z.string().min(1).max(120).optional(),
    salaryMin: z.number().int().nonnegative().optional(),
    salaryMax: z.number().int().nonnegative().optional(),
    currency: z.string().min(3).max(5).optional(),
    skills: z.array(z.string().min(1).max(60)).max(40).optional(),
    status: z.enum(JOB_STATUSES).optional()
  })
});

router.post('/jobs', requireAuth, requireRole('recruiter', 'admin'), validate(createJobSchema), asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.validated.body, createdBy: req.user.id });
  res.status(201).json({ job });
}));

const patchJobSchema = z.object({
  body: z.object({
    companyName: z.string().min(1).max(120).optional(),
    title: z.string().min(2).max(140).optional(),
    description: z.string().min(20).max(20000).optional(),
    category: z.string().min(1).max(80).optional(),
    type: z.enum(JOB_TYPES).optional(),
    location: z.string().min(1).max(120).optional(),
    salaryMin: z.number().int().nonnegative().optional(),
    salaryMax: z.number().int().nonnegative().optional(),
    currency: z.string().min(3).max(5).optional(),
    skills: z.array(z.string().min(1).max(60)).max(40).optional(),
    status: z.enum(JOB_STATUSES).optional()
  })
});

router.patch('/jobs/:id', requireAuth, requireRole('recruiter', 'admin'), validate(patchJobSchema), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  Object.assign(job, req.validated.body);
  await job.save();

  res.json({ job });
}));

router.delete('/jobs/:id', requireAuth, requireRole('recruiter', 'admin'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  await job.deleteOne();
  res.json({ ok: true });
}));

router.post('/jobs/:id/publish', requireAuth, requireRole('recruiter', 'admin'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  job.status = 'published';
  await job.save();
  res.json({ job });
}));

router.post('/jobs/:id/close', requireAuth, requireRole('recruiter', 'admin'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });
  if (!canManageJob(req, job)) return res.status(403).json({ error: { message: 'Forbidden' } });

  job.status = 'closed';
  await job.save();
  res.json({ job });
}));

module.exports = router;

