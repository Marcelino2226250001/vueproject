
const express = require('express');
const router = express.Router();
const RiwayatHarga = require('../models/RiwayatHarga');

// GET: Ambil semua riwayat perubahan harga
router.get('/', async (req, res) => {
  try {
    // Urutkan berdasarkan yang terbaru
    const data = await RiwayatHarga.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data riwayat harga' });
  }
});

module.exports = router;