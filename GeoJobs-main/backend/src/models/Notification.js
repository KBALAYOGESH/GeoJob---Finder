const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  readAt: { type: Date }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };

