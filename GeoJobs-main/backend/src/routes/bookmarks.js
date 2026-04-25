const express = require('express');

const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { Bookmark } = require('../models/Bookmark');
const { Job } = require('../models/Job');

const router = express.Router();

router.post('/jobs/:id/bookmark', requireAuth, requireRole('jobseeker', 'admin'), asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).lean();
  if (!job) return res.status(404).json({ error: { message: 'Job not found' } });

  try {
    const bookmark = await Bookmark.create({ userId: req.user.id, jobId: job._id });
    res.status(201).json({ bookmark });
  } catch (e) {
    if (e && e.code === 11000) return res.status(200).json({ ok: true });
    throw e;
  }
}));

router.delete('/jobs/:id/bookmark', requireAuth, requireRole('jobseeker', 'admin'), asyncHandler(async (req, res) => {
  await Bookmark.deleteOne({ userId: req.user.id, jobId: req.params.id });
  res.json({ ok: true });
}));

router.get('/bookmarks', requireAuth, requireRole('jobseeker', 'admin'), asyncHandler(async (req, res) => {
  const items = await Bookmark.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('jobId')
    .lean();
  res.json({ items });
}));

module.exports = router;

