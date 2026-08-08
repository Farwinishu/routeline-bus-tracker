const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const admin = db.admins.all().find(a => a.email.toLowerCase() === String(email).toLowerCase());
  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = jwt.sign({ sub: admin.id, email: admin.email, name: admin.name }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
  res.json({ token, admin: { email: admin.email, name: admin.name } });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
