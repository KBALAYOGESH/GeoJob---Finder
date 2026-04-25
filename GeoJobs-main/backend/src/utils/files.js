const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeBaseName(name) {
  const base = path.basename(name || 'file');
  return base.replace(/[^\w.\-]+/g, '_');
}

module.exports = { ensureDir, safeBaseName };

