const express = require('express');
const router = express.Router();
const Penjualan = require('../models/Penjualan');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const LogBarang = require('../models/LogBarang');

// POST - Tambah data
// POST - Tambah data
router.post('/', async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const data = req.body;

    for (const item of data.items) {
      const product = await Product.findOne({ kode: item.kode });

      if (!product) {
        throw new Error(`Barang dengan kode ${item.kode} tidak ditemukan`);
      }

      if (product.jumlah < item.jumlah) {
        throw new Error(`Stok barang "${product.nama}" tidak cukup`);
      }

      product.jumlah -= item.jumlah;
      await product.save({ session });

   
      await LogBarang.create([{
        tipe: 'penjualan',
        kode: item.kode,
        nama_barang: product.nama,
        aksi: `penjualan`,
        oleh: data.oleh || 'Tidak Diketahui', 
        tanggal: new Date()
      }], { session });
    }

    await Penjualan.create([data], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Transaksi berhasil disimpan dan stok dikurangi' });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Gagal simpan penjualan:', err.message);
    res.status(500).json({ message: 'Gagal simpan transaksi', error: err.message });
  }
});



// GET - Ambil semua data penjualan
router.get('/', async (req, res) => {
  try {
    const data = await Penjualan.find()
      .populate('pelanggan_id', 'nama status') // tambahkan ini!
      .sort({ tanggal: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data penjualan' });
  }
});


//  DELETE - Hapus penjualan by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Penjualan.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({ message: 'Berhasil dihapus' });
  } catch (err) {
    console.error('Gagal hapus penjualan:', err);
    res.status(500).json({ message: 'Gagal menghapus data' });
  }
});

router.get('/siap-kirim', async (req, res) => {
  try {
    const data = await Penjualan.find({ status_pengiriman: 'Siap Kirim' }).sort({ tanggal: -1 });
    res.json(data);
  } catch (err) {
    console.error('Gagal mengambil penjualan siap kirim:', err);
    res.status(500).json({ message: 'Gagal mengambil data' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status_pengiriman } = req.body;
    const allowedStatus = ['Belum Diproses', 'Siap Kirim', 'Dalam Perjalanan', 'Terkirim'];

    if (!allowedStatus.includes(status_pengiriman)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const updated = await Penjualan.findByIdAndUpdate(
      req.params.id,
      { status_pengiriman },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Data tidak ditemukan' });

    res.json({ message: 'Status pengiriman diperbarui', data: updated });
  } catch (err) {
    console.error('Gagal update status pengiriman:', err);
    res.status(500).json({ message: 'Gagal memperbarui status pengiriman' });
  }
});





module.exports = router;
