const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env, must } = require('../config/env');

function signAccessToken(user) {
  if (!env.jwtAccessSecret) must('JWT_ACCESS_SECRET');
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessTtl }
  );
}

function signRefreshToken(user) {
  if (!env.jwtRefreshSecret) must('JWT_REFRESH_SECRET');
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, typ: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshTtl }
  );
}

function verifyAccessToken(token) {
  if (!env.jwtAccessSecret) must('JWT_ACCESS_SECRET');
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  if (!env.jwtRefreshSecret) must('JWT_REFRESH_SECRET');
  return jwt.verify(token, env.jwtRefreshSecret);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  sha256
};

