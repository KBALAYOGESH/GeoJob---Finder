const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const bookmarksRoutes = require('./routes/bookmarks');
const profileRoutes = require('./routes/profile');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const recommendationsRoutes = require('./routes/recommendations');
const threadsRoutes = require('./routes/threads');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { env } = require('./config/env');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }));

  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/uploads', express.static(env.uploadsDir));

  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api', jobsRoutes);
  app.use('/api', applicationsRoutes);
  app.use('/api', bookmarksRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', notificationsRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', recommendationsRoutes);
  app.use('/api', threadsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

