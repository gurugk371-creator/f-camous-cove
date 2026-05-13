/* ================================================================
   routes/auth.js — Faculty login route
   POST /api/auth/faculty-login
   ================================================================ */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
require('dotenv').config();

/**
 * POST /api/auth/faculty-login
 * Body: { name, email, empid }
 * Returns a JWT session token on success.
 */
router.post('/faculty-login', (req, res) => {
  const { name, email, empid } = req.body;

  // Validate all fields present
  if (!name || !email || !empid) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and Employee ID are required.'
    });
  }

  const validEmail = (process.env.FACULTY_EMAIL || '').toLowerCase();
  const validEmpid = process.env.FACULTY_EMPID || '';

  // Check credentials against .env
  if (email.toLowerCase() !== validEmail || empid.trim() !== validEmpid) {
    return res.status(401).json({
      success: false,
      message: '⛔ Access Denied! Only authorized faculty can login.'
    });
  }

  // Create JWT Payload
  const payload = {
    faculty: {
      email: email.toLowerCase(),
      empid: empid.trim(),
      name
    }
  };

  // Issue a signed JWT token expires in 1 day
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret_123',
    { expiresIn: '1d' }
  );

  console.log(`[AUTH] Faculty login success: ${name} (${email})`);

  return res.status(200).json({
    success: true,
    message: `Welcome, ${name}! 👨‍🏫`,
    token,
    faculty: { name, email: email.toLowerCase(), empid: empid.trim() }
  });
});

module.exports = router;
