const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const LogBarang = require('../models/LogBarang');

// GET: Ambil semua data barang
router.get('/', async (req, res) => {
  try {
    const data = await Product.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// POST: Tambah barang baru + log
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const product = await Product.create(data);

    await LogBarang.create({
      kode: data.kode,
      nama_barang: data.nama,
      aksi: 'tambah',
      oleh: data.oleh || 'admin',
      tanggal: new Date()
    });

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: 'Gagal menyimpan data', detail: err.message });
  }
});

// PUT: Edit barang + log
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });

    await LogBarang.create({
      kode: data.kode,
      nama_barang: data.nama,
      aksi: 'edit',
      oleh: data.oleh || 'admin',
      tanggal: new Date()
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update data' });
  }
});

// DELETE: Hapus barang + log
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    await LogBarang.create({
      kode: deleted.kode,
      nama_barang: deleted.nama,
      aksi: 'hapus',
      oleh: req.query.oleh || 'admin',
      tanggal: new Date()
    });

    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

module.exports = router;
