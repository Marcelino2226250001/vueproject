const express = require('express');
const router = express.Router();
const Pelanggan = require('../models/Pelanggan');
// [PERUBAHAN] Kembali menggunakan model LogBarang untuk konsistensi
const LogBarang = require('../models/LogBarang');

// Fungsi validasi email sederhana
const isValidEmail = (email) => /.+@.+\..+/.test(email);

// GET semua pelanggan
router.get('/', async (req, res) => {
  try {
    const data = await Pelanggan.find().sort({ nama: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pelanggan' });
  }
});

// POST tambah pelanggan
router.post('/', async (req, res) => {
  try {
    const { nama, email, oleh } = req.body;
    
    // Validasi di backend
    if (!nama) {
      return res.status(400).json({ error: 'Nama pelanggan harus diisi.' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const pelanggan = new Pelanggan(req.body);
    await pelanggan.save();

    // [PERUBAHAN] Mencatat log ke LogBarang sesuai format yang diminta
    await LogBarang.create({
      tipe: 'pelanggan',
      kode: pelanggan.kode || '-', // Pelanggan mungkin tidak memiliki kode
      nama_barang: pelanggan.nama, // Menggunakan field nama_barang untuk nama pelanggan
      aksi: 'tambah pelanggan',
      oleh: oleh || 'admin',
      tanggal: new Date()
    });

    res.status(201).json({ message: 'Pelanggan berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan di server' });
  }
});

// PUT edit pelanggan
router.put('/:id', async (req, res) => {
  try {
    const { nama, email, oleh } = req.body;

    // Validasi di backend
    if (!nama) {
      return res.status(400).json({ error: 'Nama pelanggan harus diisi.' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const pelanggan = await Pelanggan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pelanggan) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }

    // [PERUBAHAN] Mencatat log ke LogBarang
    await LogBarang.create({
      tipe: 'pelanggan',
      kode: pelanggan.kode || '-',
      nama_barang: pelanggan.nama,
      aksi: 'ubah pelanggan',
      oleh: oleh || 'admin',
      tanggal: new Date()
    });

    res.json({ message: 'Pelanggan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan di server' });
  }
});

// DELETE pelanggan
router.delete('/:id', async (req, res) => {
  try {
    const pelanggan = await Pelanggan.findByIdAndDelete(req.params.id);

    if (pelanggan) {
      // [PERUBAHAN] Mencatat log ke LogBarang
      await LogBarang.create({
        tipe: 'pelanggan',
        kode: pelanggan.kode || '-',
        nama_barang: pelanggan.nama,
        aksi: 'hapus pelanggan',
        oleh: req.body.oleh || 'admin',
        tanggal: new Date()
      });
    }

    res.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan di server' });
  }
});

module.exports = router;
