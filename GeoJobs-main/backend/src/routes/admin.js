const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { User, USER_ROLES, USER_STATUSES } = require('../models/User');
const { Job } = require('../models/Job');
const { Application } = require('../models/Application');

const router = express.Router();

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

router.get('/admin/metrics', requireAuth, requireRole('admin'), asyncHandler(async (_req, res) => {
  const [users, jobs, applications] = await Promise.all([
    User.countDocuments({}),
    Job.countDocuments({}),
    Application.countDocuments({})
  ]);

  res.json({ users, jobs, applications });
}));

router.get('/admin/users', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { q, page = '1', limit = '20', role, status } = req.query;
  const pg = Math.max(1, toInt(page, 1));
  const lim = Math.min(100, Math.max(1, toInt(limit, 20)));
  const skip = (pg - 1) * lim;

  const filter = {};
  if (typeof q === 'string' && q.trim()) filter.email = new RegExp(q.trim(), 'i');
  if (typeof role === 'string' && USER_ROLES.includes(role)) filter.role = role;
  if (typeof status === 'string' && USER_STATUSES.includes(status)) filter.status = status;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    User.countDocuments(filter)
  ]);

  res.json({ page: pg, limit: lim, total, items });
}));

const patchUserSchema = z.object({
  params: z.object({
    id: z.string().min(10)
  }),
  body: z.object({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional()
  })
});

router.patch('/admin/users/:id', requireAuth, requireRole('admin'), validate(patchUserSchema), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.validated.params.id,
    { $set: req.validated.body },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });
  res.json({ user });
}));

router.get('/admin/jobs', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const { q, page = '1', limit = '20', status } = req.query;
  const pg = Math.max(1, toInt(page, 1));
  const lim = Math.min(100, Math.max(1, toInt(limit, 20)));
  const skip = (pg - 1) * lim;

  const filter = {};
  if (typeof status === 'string' && status.trim()) filter.status = status.trim();
  if (typeof q === 'string' && q.trim()) {
    filter.$or = [
      { title: new RegExp(q.trim(), 'i') },
      { companyName: new RegExp(q.trim(), 'i') },
      { location: new RegExp(q.trim(), 'i') }
    ];
  }

  const [items, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    Job.countDocuments(filter)
  ]);

  res.json({ page: pg, limit: lim, total, items });
}));

module.exports = router;

