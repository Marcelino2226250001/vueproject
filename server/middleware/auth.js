// middleware/auth.js
const jwt = require('jsonwebtoken');

/* ========= requireAuth ========= */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;          // {_id, username, role}
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/* ========= requireRole ========= */
const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    error: 'Insufficient permissions',
    message: `Access denied. Required role: ${roles.join(' or ')}`,
  });
};

/* ========= EXPORT ========= */
module.exports = {
  requireAuth,
  requireRole,
};
