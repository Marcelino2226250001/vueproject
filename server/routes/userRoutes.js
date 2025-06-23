const express = require('express');
const router = express.Router();
const User = require('../models/User');

// API Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('LOGIN REQUEST:', { username, password: '***' });
  console.log('Session ID:', req.sessionID);

  try {
    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    const user = await User.findOne({ username });
    console.log('USER DARI DATABASE:', user ? { 
      id: user._id, 
      username: user.username, 
      role: user.role 
    } : 'Not found');
    
    if (!user) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Simpan user ke session
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    console.log('Session after login:', req.session.user);

    // Return user data
    const userData = { 
      id: user._id,
      username: user.username, 
      role: user.role 
    };

    res.json(userData);
    console.log('Login successful, sent data:', userData);

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET: Mendapatkan user yang sedang login
router.get('/me', (req, res) => {
  try {
    console.log('GET /me - Session ID:', req.sessionID);
    console.log('GET /me - Session user:', req.session?.user);
    
    // Jika menggunakan session
    if (req.session && req.session.user) {
      const userData = {
        id: req.session.user.id,
        username: req.session.user.username,
        role: req.session.user.role
      };
      console.log('Returning user data:', userData);
      res.json(userData);
    } else {
      console.log('No active session found');
      res.status(401).json({ error: 'Not authenticated' });
    }
  } catch (error) {
    console.error('GET /me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Logout
router.post('/logout', (req, res) => {
  try {
    console.log('Logout request for session:', req.sessionID);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Gagal logout' });
      }
      console.log('Logout successful');
      res.json({ message: 'Logout berhasil' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug endpoint untuk melihat session
router.get('/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    cookies: req.headers.cookie
  });
});

module.exports = router;