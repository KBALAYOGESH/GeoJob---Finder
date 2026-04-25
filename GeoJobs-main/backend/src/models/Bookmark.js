const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true }
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = { Bookmark };

