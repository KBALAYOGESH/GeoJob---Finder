const dotenv = require('dotenv');

dotenv.config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/geojobs',

  // Auth (enabled in later todo)
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '30d',

  uploadsDir: process.env.UPLOADS_DIR || 'uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5)
};

module.exports = { env, must };

