const express = require('express');
const multer = require('multer');
const path = require('path');

const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { env } = require('../config/env');
const { ensureDir, safeBaseName } = require('../utils/files');
const { File } = require('../models/File');
const { JobSeekerProfile } = require('../models/JobSeekerProfile');
const { RecruiterProfile } = require('../models/RecruiterProfile');

const router = express.Router();

function getUploadsAbs() {
  return path.join(process.cwd(), env.uploadsDir);
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const abs = getUploadsAbs();
    ensureDir(abs);
    cb(null, abs);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const base = safeBaseName(path.basename(file.originalname || 'resume', ext));
    const filename = `resume_${req.user.id}_${Date.now()}_${base}${ext}`;
    cb(null, filename);
  }
});

function fileFilter(_req, file, cb) {
  const allowed = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  if (!allowed.has(file.mimetype)) return cb(new Error('Only PDF/DOC/DOCX allowed'));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 }
});

router.get('/profile/me', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role === 'jobseeker') {
    const profile = await JobSeekerProfile.findOne({ userId: req.user.id }).lean();
    return res.json({ role: req.user.role, profile: profile || {} });
  }
  if (req.user.role === 'recruiter') {
    const profile = await RecruiterProfile.findOne({ userId: req.user.id }).lean();
    return res.json({ role: req.user.role, profile: profile || {} });
  }
  return res.json({ role: req.user.role, profile: {} });
}));

router.patch('/profile/me', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role === 'jobseeker') {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { ...req.body, userId: req.user.id } },
      { upsert: true, new: true }
    );
    return res.json({ profile });
  }

  if (req.user.role === 'recruiter') {
    const profile = await RecruiterProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { ...req.body, userId: req.user.id } },
      { upsert: true, new: true }
    );
    return res.json({ profile });
  }

  return res.status(400).json({ error: { message: 'Admin profile not supported' } });
}));

router.post(
  '/profile/me/resume',
  requireAuth,
  requireRole('jobseeker', 'admin'),
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: { message: 'Missing resume file' } });

    const publicUrl = `/uploads/${req.file.filename}`;
    const fileDoc = await File.create({
      ownerUserId: req.user.id,
      kind: 'resume',
      storage: 'local',
      key: req.file.filename,
      url: publicUrl,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    await JobSeekerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { userId: req.user.id, resumeFileId: fileDoc._id } },
      { upsert: true }
    );

    res.status(201).json({ file: fileDoc });
  })
);

module.exports = router;

