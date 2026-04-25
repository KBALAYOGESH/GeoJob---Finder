const express = require('express');

const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { Job } = require('../models/Job');
const { Application } = require('../models/Application');
const { JobSeekerProfile } = require('../models/JobSeekerProfile');

const router = express.Router();

function norm(s) {
  return (s || '').toString().trim().toLowerCase();
}

function overlapScore(a = [], b = []) {
  const set = new Set(a.map(norm).filter(Boolean));
  let score = 0;
  for (const x of b.map(norm)) if (x && set.has(x)) score += 1;
  return score;
}

router.get('/recommendations', requireAuth, requireRole('jobseeker', 'admin'), asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ userId: req.user.id }).lean();
  const skills = (profile?.skills || []).map(norm).filter(Boolean);
  const userLocation = norm(profile?.location || '');

  const recentApps = await Application.find({ applicantUserId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('jobId')
    .lean();

  const preferredCategories = new Map();
  for (const a of recentApps) {
    const job = a.jobId;
    if (!job) continue;
    const c = norm(job.category || '');
    if (!c) continue;
    preferredCategories.set(c, (preferredCategories.get(c) || 0) + 1);
  }

  const jobs = await Job.find({ status: 'published' }).sort({ createdAt: -1 }).limit(300).lean();

  const scored = jobs.map((job) => {
    const jobSkills = (job.skills || []).map(norm).filter(Boolean);
    const skill = overlapScore(skills, jobSkills);
    const loc = userLocation && norm(job.location).includes(userLocation) ? 1 : 0;
    const catBoost = preferredCategories.get(norm(job.category || '')) ? 1 : 0;
    const recency = job.createdAt ? Math.max(0, 30 - Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const score = (skill * 3) + (loc * 2) + (catBoost * 2) + (recency * 0.05);
    return { job, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const items = scored.slice(0, 20).map((x) => x.job);

  res.json({ items });
}));

module.exports = router;

