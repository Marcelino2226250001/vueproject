// middleware/auth.js
const requireAuth = (req, res, next) => {
  console.log('Auth middleware - Session ID:', req.sessionID);
  console.log('Auth middleware - Session user:', req.session?.user);
  console.log('Auth middleware - Cookies:', req.headers.cookie);

  if (req.session && req.session.user) {
    // User is authenticated
    req.user = req.session.user;
    next();
  } else {
    // User is not authenticated
    console.log('Authentication failed - no session user');
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
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