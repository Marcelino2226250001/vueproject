const express = require('express');
const router = express.Router();
const Supply = require('../models/supply');

// GET semua data supply
router.get('/', async (req, res) => {
  try {
    const data = await Supply.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah data supply
router.post('/', async (req, res) => {
  try {
    const newSupply = new Supply(req.body);
    const saved = await newSupply.save();
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

// Update data
// Update data
router.put('/:id', async (req, res) => {
  try {
    const updated = await Supply.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Data tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Hapus data
router.delete('/:id', async (req, res) => {
  try {
    await Supply.findByIdAndDelete(req.params.id);
    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
