// middleware/auth.js
// AFTER  (ganti seluruh fungsi)
const jwt = require('jsonwebtoken');

module.exports.requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    // Pastikan JWT_SECRET sudah ada di .env
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;          // simpan info user di request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};


// Middleware untuk role-based access
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
  };
};

module.exports = {
  requireAuth,
  requireRole
};