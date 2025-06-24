const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';

// Enhanced logging middleware
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
};

// Middleware untuk autentikasi
const authenticate = (req, res, next) => {
  console.log('🔍 Authentication check started');
  
  // Cek JWT token terlebih dahulu
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('✅ JWT authentication successful:', decoded.username);
      return next();
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      // Lanjut ke session-based auth
    }
  }
  
  // Fallback ke session-based authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    console.log('✅ Session authentication successful:', req.user.username);
    return next();
  }
  
  console.log('❌ Authentication failed - no valid JWT or session');
  return res.status(401).json({ error: 'Not authenticated' });
};

// Login endpoint - Enhanced dengan debugging
router.post('/login', logRequest, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🚀 Login attempt started');
    console.log('Username:', username);
    console.log('Password provided:', !!password);
    
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    // Cari user di database dengan logging
    console.log('🔍 Looking for user in database:', username);
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('❌ User not found in database:', username);
      // Log semua users untuk debugging (hanya di development)
      if (process.env.NODE_ENV !== 'production') {
        const allUsers = await User.find({}, 'username role').lean();
        console.log('Available users:', allUsers);
      }
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    console.log('✅ User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password
    });

    // Verifikasi password dengan logging detail
    console.log('🔐 Verifying password...');
    console.log('Stored password hash:', user.password?.substring(0, 10) + '...');
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    console.log('✅ Login successful for user:', username);

    // Prepare user data
    const userData = {
      id: user._id,
      userId: user._id, // Tambahan untuk kompatibilitas
      username: user.username,
      role: user.role
    };

    // Force use JWT for Railway deployment
    const useJWT = true; // Selalu gunakan JWT untuk production
    
    if (useJWT) {
      // JWT approach
      const token = jwt.sign(
        userData,
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('🎟️ JWT token generated for user:', username);
      
      const response = {
        success: true,
        token,
        user: userData,
        message: 'Login berhasil'
      };
      
      console.log('📤 Sending response:', JSON.stringify(response, null, 2));
      res.json(response);
    } else {
      // Session approach
      req.session.user = userData;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          return res.status(500).json({ error: 'Gagal menyimpan session' });
        }
        
        console.log('✅ Session saved for user:', username, 'Session ID:', req.sessionID);
        
        const response = {
          success: true,
          user: userData,
          sessionId: req.sessionID,
          message: 'Login berhasil'
        };
        
        console.log('📤 Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
      });
    }

  } catch (error) {
    console.error('💥 Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create default admin user if not exists
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔧 Creating default admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return res.json({ message: 'Admin user already exists' });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Default admin user created');
    
    res.json({ 
      message: 'Default admin user created successfully',
      username: 'admin',
      defaultPassword: 'admin'
    });
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Get current user endpoint
router.get('/me', authenticate, async (req, res) => {
  try {
    console.log('👤 Getting user info for:', req.user.username);
    
    // Fetch fresh user data from database
    const user = await User.findById(req.user.id || req.user.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found in database:', req.user.id || req.user.userId);
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    
    const response = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    console.log('✅ User info retrieved:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  console.log('👋 Logout request from user:', req.user?.username || 'unknown');
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Session destroy error:', err);
        return res.status(500).json({ error: 'Logout gagal' });
      }
      
      res.clearCookie('inventaris.sid');
      console.log('✅ Logout successful');
      res.json({ success: true, message: 'Logout berhasil' });
    });
  } else {
    console.log('✅ Logout successful (no session)');
    res.json({ success: true, message: 'Logout berhasil' });
  }
});

// Debug endpoints
router.get('/debug/users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  try {
    const users = await User.find({}, 'username role createdAt').lean();
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/session-status', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    sessionExists: !!req.session,
    userInSession: !!req.session?.user,
    user: req.session?.user || null,
    cookies: req.headers.cookie || 'No cookies',
    authorization: req.headers.authorization || 'No auth header',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint yang memerlukan autentikasi
router.get('/protected-test', authenticate, (req, res) => {
  res.json({
    message: 'Anda berhasil mengakses endpoint yang dilindungi',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Export
module.exports = router;
module.exports.authenticate = authenticate;