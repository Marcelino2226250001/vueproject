const express = require('express');
const router = express.Router();
const Pembelian = require('../models/Pembelian');
const Product = require('../models/Product');
const LogBarang = require('../models/LogBarang');


// POST: Simpan transaksi pembelian
// routes/pembelianroutes.js

// POST: Simpan transaksi pembelian
router.post('/', async (req, res) => {
  try {
    const { tanggal, supplier, items, total, oleh } = req.body;

    if (!tanggal || !supplier || !Array.isArray(items) || items.length === 0 || typeof total !== 'number') {
      return res.status(400).json({ message: 'Data pembelian tidak lengkap atau tidak valid' });
    }

    // Tambahkan status 'Belum Diterima' ke setiap item
    const itemsWithStatus = items.map(item => ({
      ...item,
      status: 'Belum Diterima'
    }));

    // Simpan ke database
    const pembelian = await Pembelian.create({ tanggal, supplier, items: itemsWithStatus, total });

    // Catat log untuk setiap item yang dibeli
    for (const item of itemsWithStatus) {
  await LogBarang.create({
    tipe: 'pembelian',
    kode: item.kode,
    nama_barang: item.nama_barang,
    aksi: `tambah pembelian`,
    oleh: oleh || 'Tidak Diketahui',
    tanggal: new Date()
  });
}


    res.json({ message: 'Transaksi pembelian berhasil disimpan', data: pembelian });
  } catch (err) {
    console.error('Gagal simpan pembelian:', err);
    res.status(500).json({ message: 'Gagal menyimpan transaksi pembelian' });
  }
});





// GET: Ambil semua data pembelian
// GET: Laporan pembelian dengan filter
router.get('/laporan', async (req, res) => {
  try {
    const { dari, sampai, supplier, jenis } = req.query;

    const filter = {};

    // Filter tanggal
    if (dari && sampai) {
      const dariDate = new Date(dari);
      const sampaiDate = new Date(sampai);
      sampaiDate.setHours(23, 59, 59, 999);
      filter.tanggal = {
        $gte: dariDate,
        $lte: sampaiDate,
      };
    }

    // Gunakan regex untuk fleksibilitas pencarian supplier
    if (supplier) {
      filter.supplier = { $regex: supplier, $options: 'i' };
    }

    if (jenis) {
      filter['items.nama_barang'] = { $regex: jenis, $options: 'i' };
    }

    const data = await Pembelian.find(filter).sort({ tanggal: -1 });
    res.json(data);
  } catch (err) {
    console.error('Gagal ambil laporan pembelian:', err);
    res.status(500).json({ message: 'Gagal mengambil laporan pembelian' });
  }
});

// DELETE: Hapus semua riwayat pembelian
router.delete('/semua', async (req, res) => {
  try {
    await Pembelian.deleteMany({});
    res.json({ message: 'Semua data pembelian telah dihapus.' });
  } catch (err) {
    console.error('Gagal hapus semua pembelian:', err);
    res.status(500).json({ message: 'Gagal menghapus semua pembelian' });
  }
});

// pembelianroutes.js
router.get('/belum-diterima', async (req, res) => {
  try {
    const semua = await Pembelian.find();
    const belumDiterima = semua.filter(p => 
      p.items.every(item => (item.status || 'Belum Diterima') === 'Belum Diterima')

    );
    res.json(belumDiterima);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
});






// DELETE: Hapus 1 data pembelian berdasarkan ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data sebelum dihapus untuk keperluan log
    const data = await Pembelian.findById(id);
    if (!data) return res.status(404).json({ message: 'Data tidak ditemukan' });

    await Pembelian.findByIdAndDelete(id);

    // Catat log penghapusan
    for (const item of data.items) {
      await LogBarang.create({
        tipe: 'pembelian',
        kode: item.kode,
        nama_barang: item.nama_barang,
        aksi: `hapus pembelian`,
        oleh: req.body.oleh || 'Tidak Diketahui',
        tanggal: new Date()
      });
    }

    res.json({ message: 'Data pembelian berhasil dihapus.' });
  } catch (err) {
    console.error('Gagal menghapus pembelian:', err);
    res.status(500).json({ message: 'Gagal menghapus pembelian' });
  }
});



module.exports = router;
