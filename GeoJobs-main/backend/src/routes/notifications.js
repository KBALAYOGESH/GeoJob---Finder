const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { Notification } = require('../models/Notification');

const router = express.Router();

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

router.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  const { page = '1', limit = '20' } = req.query;
  const pg = Math.max(1, toInt(page, 1));
  const lim = Math.min(100, Math.max(1, toInt(limit, 20)));
  const skip = (pg - 1) * lim;

  const [items, total] = await Promise.all([
    Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
    Notification.countDocuments({ userId: req.user.id })
  ]);

  res.json({ page: pg, limit: lim, total, items });
}));

const readSchema = z.object({
  params: z.object({
    id: z.string().min(10)
  })
});

router.patch('/notifications/:id/read', requireAuth, validate(readSchema), asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.validated.params.id, userId: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!n) return res.status(404).json({ error: { message: 'Notification not found' } });
  res.json({ notification: n });
}));

module.exports = router;

