const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const { Thread } = require('../models/Thread');
const { Message } = require('../models/Message');

const router = express.Router();

router.get('/threads', requireAuth, asyncHandler(async (req, res) => {
  const items = await Thread.find({ participants: req.user.id })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();
  res.json({ items });
}));

const messagesSchema = z.object({
  params: z.object({
    id: z.string().min(10)
  })
});

router.get('/threads/:id/messages', requireAuth, validate(messagesSchema), asyncHandler(async (req, res) => {
  const thread = await Thread.findOne({ _id: req.validated.params.id, participants: req.user.id }).lean();
  if (!thread) return res.status(404).json({ error: { message: 'Thread not found' } });

  const items = await Message.find({ threadId: thread._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  res.json({ items: items.reverse() });
}));

module.exports = router;

