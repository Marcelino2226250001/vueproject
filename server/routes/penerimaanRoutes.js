const express = require('express');
const router = express.Router();
const Penerimaan = require('../models/PenerimaanBarang');
const Product = require('../models/Product');
const Pembelian = require('../models/Pembelian');
const mongoose = require('mongoose');

// POST penerimaan barang + update stok
router.post('/', async (req, res) => {
  const { pembelian_id, diterima_oleh, tanggal_diterima, items } = req.body;

  try {
    // Update stok produk
    for (const item of items) {
      await Product.updateOne(
        { kode: item.kode },
        { $inc: { jumlah: item.jumlah } }
      );
    }

    // Simpan ke koleksi penerimaan
    const penerimaan = new Penerimaan({
      pembelian_id,
      diterima_oleh,
      tanggal_diterima: tanggal_diterima || new Date(),
      items
    });
    await penerimaan.save();

    // Update semua item jadi 'Diterima'
    await Pembelian.updateOne(
      { _id: pembelian_id },
      {
        $set: {
          'items.$[].status': 'Diterima'
        }
      }
    );

    res.json({ message: 'Penerimaan berhasil dicatat dan stok diperbarui' });

  } catch (error) {
    console.error("Error saat menyimpan penerimaan:", error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan penerimaan', error: error.message });
  }
});

// GET penerimaan berdasarkan pembelian_id
router.get('/by-pembelian/:pembelian_id', async (req, res) => {
  try {
    const pembelianId = new mongoose.Types.ObjectId(req.params.pembelian_id);
    const penerimaan = await Penerimaan.findOne({ pembelian_id: pembelianId });

    if (!penerimaan) {
      return res.status(404).json({ message: 'Penerimaan tidak ditemukan' });
    }

    res.json(penerimaan);
  } catch (err) {
    console.error("Error ambil penerimaan:", err);
    res.status(500).json({ message: 'Gagal mengambil data penerimaan', error: err.message });
  }
});
// DELETE penerimaan berdasarkan pembelian_id (rollback)
router.delete('/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const penerimaan = await Penerimaan.findById(id);

    if (!penerimaan) {
      return res.status(404).json({ message: 'Data penerimaan tidak ditemukan' });
    }

    // Rollback stok produk
    for (const item of penerimaan.items) {
      await Product.updateOne(
        { kode: item.kode },
        { $inc: { jumlah: -item.jumlah } }
      );
    }

    // Kembalikan status item menjadi 'Belum Diterima'
    const pembelian = await Pembelian.findById(penerimaan.pembelian_id);
if (pembelian) {
  pembelian.items = pembelian.items.map(item => ({
    ...item.toObject(),
    status: 'Belum Diterima'
  }));
  await pembelian.save();
}


    // Hapus data penerimaan
    await Penerimaan.deleteOne({ _id: id });

    res.json({ message: 'Penerimaan berhasil dibatalkan dan stok dikembalikan' });

  } catch (error) {
    console.error("Error saat membatalkan penerimaan:", error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membatalkan penerimaan', error: error.message });
  }
});



module.exports = router;
