require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'routeline-dev-secret-change-me',
  JWT_EXPIRES_IN: '12h',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@routeline.lk',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  // How often (ms) the server advances every active bus along its route
  TRACKING_TICK_MS: 1000,
};
