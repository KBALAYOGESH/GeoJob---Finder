const { verifyAccessToken } = require('../services/tokenService');
const { User } = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [kind, token] = header.split(' ');
    if (kind !== 'Bearer' || !token) return res.status(401).json({ error: { message: 'Missing bearer token' } });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: { message: 'Invalid token user' } });
    if (user.status !== 'active') return res.status(403).json({ error: { message: 'User blocked' } });

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Not authenticated' } });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: { message: 'Forbidden' } });
    next();
  };
}

module.exports = { requireAuth, requireRole };

