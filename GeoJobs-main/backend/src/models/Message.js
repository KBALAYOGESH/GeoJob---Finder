const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 5000 }
}, { timestamps: true });

messageSchema.index({ threadId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message };

