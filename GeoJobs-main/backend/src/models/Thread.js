const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
  lastMessageAt: { type: Date, index: true }
}, { timestamps: true });

threadSchema.index({ participants: 1 });

const Thread = mongoose.model('Thread', threadSchema);

module.exports = { Thread };

