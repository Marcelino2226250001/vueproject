// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Cek validitas token & kembalikan user
router.get('/verify', requireAuth, (req, res) => {
  return res.json({
    valid: true,
    user: req.user,     // info user hasil middleware
    // ⬇️ opsional: kirim token baru bila ingin refresh
    // token: generateNewJwt(req.user)
  });
});

router.get('/ping', (req, res) => res.json({ ok: true }));

module.exports = router;
