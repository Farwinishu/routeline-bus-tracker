const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing admin token. Please sign in again.' });

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

module.exports = { requireAdmin };
