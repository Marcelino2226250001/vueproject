const express = require('express');
const router = express.Router();
const Supply = require('../models/Supply');
const LogBarang = require('../models/LogBarang'); // Model log

// GET semua data supply
router.get('/', async (req, res) => {
  try {
    const data = await Supply.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah data supply + log
router.post('/', async (req, res) => {
  try {
    const newSupply = new Supply(req.body);
    const saved = await newSupply.save();

    await LogBarang.create({
      tipe: 'supply',
      kode: saved.kode_barang,
      nama_barang: saved.nama_barang,
      aksi: 'tambah',
      oleh: req.body.oleh || 'admin',
      tanggal: new Date()
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Ambil data 1 supply
router.get('/:id', async (req, res) => {
  try {
    const item = await Supply.findById(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(404).json({ message: 'Data tidak ditemukan' });
  }
});

// Update data supply + log
router.put('/:id', async (req, res) => {
  try {
    const updated = await Supply.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Data tidak ditemukan' });

    await LogBarang.create({
      tipe: 'supply',
      kode: updated.kode_barang,
      nama_barang: updated.nama_barang,
      aksi: 'edit',
      oleh: req.body.oleh || 'admin',
      tanggal: new Date()
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Hapus data supply + log
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Supply.findByIdAndDelete(req.params.id);

    if (deleted) {
      await LogBarang.create({
        tipe: 'supply',
        kode: deleted.kode_barang,
        nama_barang: deleted.nama_barang,
        aksi: 'hapus',
        oleh: req.query.oleh || 'admin',
        tanggal: new Date()
      });
    }

    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
