const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../middlewares/validate');
const { User, USER_ROLES } = require('../models/User');
const { RefreshToken } = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  sha256
} = require('../services/tokenService');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    password: z.string().min(8).max(72),
    role: z.enum(USER_ROLES)
  })
});

router.post('/auth/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, role } = req.validated.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: { message: 'Email already registered' } });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, role });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = verifyRefreshToken(refreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(decoded.exp * 1000)
  });

  res.status(201).json({ user, tokens: { accessToken, refreshToken } });
}));

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((s) => s.toLowerCase().trim()),
    password: z.string().min(1).max(72)
  })
});

router.post('/auth/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });
  if (user.status !== 'active') return res.status(403).json({ error: { message: 'User blocked' } });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { message: 'Invalid credentials' } });

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = verifyRefreshToken(refreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(decoded.exp * 1000)
  });

  res.json({ user, tokens: { accessToken, refreshToken } });
}));

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10)
  })
});

router.post('/auth/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: { message: 'Invalid refresh token' } });
  }

  const tokenDoc = await RefreshToken.findOne({
    userId: decoded.sub,
    tokenHash: sha256(refreshToken),
    revokedAt: null
  });

  if (!tokenDoc) return res.status(401).json({ error: { message: 'Refresh token revoked' } });

  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const user = await User.findById(decoded.sub);
  if (!user) return res.status(401).json({ error: { message: 'Invalid token user' } });
  if (user.status !== 'active') return res.status(403).json({ error: { message: 'User blocked' } });

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  const newDecoded = verifyRefreshToken(newRefreshToken);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(newRefreshToken),
    expiresAt: new Date(newDecoded.exp * 1000)
  });

  res.json({ tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
}));

const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10)
  })
});

router.post('/auth/logout', validate(logoutSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.validated.body;

  await RefreshToken.updateOne(
    { tokenHash: sha256(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  res.json({ ok: true });
}));

module.exports = router;

