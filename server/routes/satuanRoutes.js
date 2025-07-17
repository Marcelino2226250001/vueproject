// file: routes/satuanRoutes.js

const express = require('express');
const router = express.Router();
const Satuan = require('../models/Satuan');

// GET: Ambil semua data satuan
router.get('/', async (req, res) => {
  try {
    // Urutkan berdasarkan nama agar mudah dicari
    const data = await Satuan.find().sort({ nama: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data satuan' });
  }
});

// POST: Tambah satuan baru
router.post('/', async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama) {
      return res.status(400).json({ error: 'Nama satuan harus diisi' });
    }
    const satuan = await Satuan.create({ nama });
    res.status(201).json(satuan);
  } catch (err) {
    // Tangani error jika nama satuan sudah ada
    if (err.code === 11000) {
      return res.status(400).json({ error: `Satuan "${req.body.nama}" sudah ada.` });
    }
    res.status(500).json({ error: 'Gagal menyimpan data', detail: err.message });
  }
});

module.exports = router;