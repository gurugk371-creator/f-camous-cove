/* ================================================================
   middleware/auth.js — Faculty authentication middleware
   Credentials verified server-side from .env (never in browser JS)
   ================================================================ */

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * requireFaculty
 * Reads Authorization header: "Bearer <jwt_token>"
 * Verifies JWT and attaches faculty payload to request.
 */
function requireFaculty(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization required. Please login as faculty.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_123');
    
    // Check if structure is valid
    if (!decoded || !decoded.faculty) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid authentication token structure.'
      });
    }

    const { email, empid } = decoded.faculty;
    const validEmail = (process.env.FACULTY_EMAIL || '').toLowerCase();
    const validEmpid = process.env.FACULTY_EMPID || '';

    // Optionally double check against current .env config
    if (email !== validEmail || empid !== validEmpid) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your faculty credentials have expired or changed.'
      });
    }

    // Attach faculty info to request
    req.faculty = decoded.faculty;
    next();

  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
}

module.exports = { requireFaculty };
