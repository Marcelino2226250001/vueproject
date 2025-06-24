const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Ganti ke bcrypt standar
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Sesuaikan dengan path model Anda

// JWT Secret - pastikan ada di environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';

// Middleware untuk autentikasi
const authenticate = (req, res, next) => {
  // Cek JWT token terlebih dahulu
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('JWT authentication successful:', decoded.username);
      return next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      // Lanjut ke session-based auth
    }
  }
  
  // Fallback ke session-based authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('Session authentication successful:', req.user.username);
    return next();
  }
  
  console.log('Authentication failed - no valid JWT or session');
  return res.status(401).json({ error: 'Not authenticated' });
};

// Login endpoint - Enhanced
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt for user:', username);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    // Cari user di database
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    console.log('Login successful for user:', username);

    // Prepare user data
    const userData = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    // Decide authentication method based on environment or preference
    const useJWT = process.env.USE_JWT === 'true' || process.env.NODE_ENV === 'production';
    
    if (useJWT) {
      // JWT approach
      const token = jwt.sign(
        userData,
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('JWT token generated for user:', username);
      
      res.json({
        success: true,
        token,
        user: userData,
        message: 'Login berhasil'
      });
    } else {
      // Session approach
      req.session.user = userData;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Gagal menyimpan session' });
        }
        
        console.log('Session saved for user:', username, 'Session ID:', req.sessionID);
        
        res.json({
          success: true,
          user: userData,
          sessionId: req.sessionID,
          message: 'Login berhasil'
        });
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('Getting user info for:', req.user.username);
    
    // Optional: Fetch fresh user data from database
    const user = await User.findById(req.user.id || req.user.userId).select('-password');
    
    if (!user) {
      console.log('User not found in database:', req.user.id || req.user.userId);
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      // Tambahkan field lain yang diperlukan
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  console.log('Logout request from user:', req.user?.username || 'unknown');
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout gagal' });
      }
      
      res.clearCookie('inventaris.sid'); // Sesuaikan dengan nama session
      res.json({ success: true, message: 'Logout berhasil' });
    });
  } else {
    res.json({ success: true, message: 'Logout berhasil' });
  }
});

// Session status endpoint (untuk debugging)
router.get('/session-status', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    userInSession: !!req.session?.user,
    user: req.session?.user || null,
    cookies: req.headers.cookie || 'No cookies',
    authorization: req.headers.authorization || 'No auth header'
  });
});

// Test endpoint yang memerlukan autentikasi
router.get('/protected-test', authenticate, (req, res) => {
  res.json({
    message: 'Anda berhasil mengakses endpoint yang dilindungi',
    user: req.user,
    timestamp: new Date()
  });
});

// Export middleware untuk digunakan di route lain
module.exports = router;
module.exports.authenticate = authenticate;