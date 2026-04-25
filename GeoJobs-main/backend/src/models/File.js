const mongoose = require('mongoose');

const FILE_KINDS = ['resume', 'avatar', 'other'];
const FILE_STORAGES = ['local', 's3'];

const fileSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, enum: FILE_KINDS, required: true, index: true },
  storage: { type: String, enum: FILE_STORAGES, required: true, default: 'local', index: true },
  bucket: { type: String, trim: true },
  key: { type: String, trim: true },
  url: { type: String, trim: true },
  mimeType: { type: String, trim: true },
  size: { type: Number }
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

module.exports = { File, FILE_KINDS, FILE_STORAGES };

