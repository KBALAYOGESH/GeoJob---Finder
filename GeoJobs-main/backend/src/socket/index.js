const { Server } = require('socket.io');

const { verifyAccessToken } = require('../services/tokenService');
const { Thread } = require('../models/Thread');
const { Message } = require('../models/Message');

async function findOrCreateThread(userA, userB) {
  const participants = [userA, userB].sort();
  let thread = await Thread.findOne({ participants: { $all: participants, $size: 2 } });
  if (!thread) thread = await Thread.create({ participants, lastMessageAt: new Date() });
  return thread;
}

function initSocket(httpServer, { corsOrigin = true } = {}) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token'));
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    socket.on('message:send', async (data, ack) => {
      try {
        const toUserId = (data?.toUserId || '').toString();
        const text = (data?.text || '').toString().trim();
        if (!toUserId || text.length < 1) throw new Error('Invalid message');

        const thread = await findOrCreateThread(userId, toUserId);
        const msg = await Message.create({
          threadId: thread._id,
          fromUserId: userId,
          toUserId,
          text
        });

        thread.lastMessageAt = new Date();
        await thread.save();

        const payload = { message: msg.toObject() };
        io.to(`user:${userId}`).emit('message:new', payload);
        io.to(`user:${toUserId}`).emit('message:new', payload);

        if (typeof ack === 'function') ack({ ok: true, threadId: thread._id.toString(), message: payload.message });
      } catch (e) {
        if (typeof ack === 'function') ack({ ok: false, error: e.message || 'Send failed' });
      }
    });
  });

  return io;
}

module.exports = { initSocket };

