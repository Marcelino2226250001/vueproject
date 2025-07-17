const express = require('express');
const router = express.Router();
const Pelanggan = require('../models/Pelanggan');
// [PERUBAHAN] Menggunakan model LogAktivitas yang benar
const LogAktivitas = require('../models/LogAktivitas');

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
    
    // [PERUBAHAN] Validasi di backend
    if (!nama) {
      return res.status(400).json({ error: 'Nama pelanggan harus diisi.' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }

    const pelanggan = new Pelanggan(req.body);
    await pelanggan.save();

    // [PERUBAHAN] Mencatat log ke LogAktivitas dengan skema yang benar
    await LogAktivitas.create({
      tipe: 'tambah',
      pengguna: oleh || 'admin',
      target: 'pelanggan',
      nama_item: pelanggan.nama,
      keterangan: `Menambahkan pelanggan baru: ${pelanggan.nama}`
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

    // [PERUBAHAN] Validasi di backend
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

    // [PERUBAHAN] Mencatat log ke LogAktivitas
    await LogAktivitas.create({
      tipe: 'edit',
      pengguna: oleh || 'admin',
      target: 'pelanggan',
      nama_item: pelanggan.nama,
      keterangan: `Mengubah data pelanggan: ${pelanggan.nama}`
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
      // [PERUBAHAN] Mencatat log ke LogAktivitas
      await LogAktivitas.create({
        tipe: 'hapus',
        pengguna: req.body.oleh || 'admin',
        target: 'pelanggan',
        nama_item: pelanggan.nama,
        keterangan: `Menghapus pelanggan: ${pelanggan.nama}`
      });
    }

    res.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan di server' });
  }
});

module.exports = router;
