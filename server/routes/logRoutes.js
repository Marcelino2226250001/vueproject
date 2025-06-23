const express = require('express');
const router = express.Router();
const LogBarang = require('../models/LogBarang');

// GET: Ambil semua log

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.aksi) filter.aksi = req.query.aksi;
    if (req.query.oleh) filter.oleh = req.query.oleh;
    
    const data = await LogBarang.find(filter).sort({ tanggal: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas' });
  }
});

// Tambah di dalam logRoutes.js
router.post('/aktivitas', async (req, res) => {
  try {
    const log = new LogBarang(req.body);
    await log.save();
    res.json({ message: 'Log aktivitas berhasil disimpan' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan log aktivitas', error: error.message });
  }
});


module.exports = router;
