const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const LogBarang = require('../models/LogBarang');

// Fungsi untuk generate kode barang baru
// file: productRoutes.js

async function generateKodeBarang() {
  try {
    // CARA PERBAIKAN: Gunakan find(), sort(), dan limit(1) untuk hasil yang pasti.
    const lastProducts = await Product.find({ kode: { $regex: '^BRG' } })
      .sort({ kode: -1 }) // Urutkan dari kode terbesar ke terkecil
      .limit(1);          // Ambil hanya 1 hasil teratas

    // Hasil dari find() adalah sebuah array, jadi kita ambil elemen pertamanya.
    const lastProduct = lastProducts[0]; 
    let nextNumber = 1;

    if (lastProduct) {
      // Ambil angka dari kode terakhir dan tambahkan 1
      const lastNumber = parseInt(lastProduct.kode.replace('BRG', ''));
      nextNumber = lastNumber + 1;
    }

    // Format kode baru dengan padding nol (contoh: BRG0002)
    const newKode = `BRG${nextNumber.toString().padStart(4, '0')}`;
    return newKode;

  } catch (error) {
    console.error("Gagal saat generate kode barang:", error);
    throw new Error("Gagal membuat kode barang unik.");
  }
}


// GET: Ambil semua data barang
router.get('/', async (req, res) => {
  try {
    // Mengurutkan data yang terbaru di atas
    const data = await Product.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// POST: Tambah barang baru dengan kode otomatis + log
router.post('/', async (req, res) => {
  try {
    // 1. Hapus properti 'kode' dari data yang dikirim klien (jika ada) untuk keamanan
    const { kode, ...dataFromClient } = req.body;

    // 2. Panggil fungsi untuk membuat kode baru
    const newKode = await generateKodeBarang();

    // 3. Gabungkan data asli dengan kode baru
    const finalData = {
      ...dataFromClient,
      kode: newKode
    };

    // 4. Simpan produk dengan data yang sudah lengkap
    const product = await Product.create(finalData);

    // Pastikan log menggunakan kode yang baru dibuat
    await LogBarang.create({
      kode: product.kode, // Gunakan product.kode
      nama_barang: product.nama,
      aksi: 'tambah',
      oleh: product.oleh || 'admin',
      tanggal: new Date()
    });

    res.status(201).json(product); // Kirim status 201 Created dan data produk baru

  } catch (err) {
    res.status(400).json({ error: 'Gagal menyimpan data', detail: err.message });
  }
});

// PUT: Edit barang + log
router.put('/:id', async (req, res) => {
  try {
    // Saat edit, kita tidak mengubah kode barang
    const data = req.body;
    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'Barang tidak ditemukan' });
    }

    await LogBarang.create({
      kode: updated.kode, // Gunakan updated.kode
      nama_barang: updated.nama,
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

    if (!deleted) {
      return res.status(404).json({ error: 'Barang tidak ditemukan' });
    }

    await LogBarang.create({
      kode: deleted.kode,
      nama_barang: deleted.nama,
      aksi: 'hapus',
      // Sebaiknya 'oleh' dikirim dari body, bukan query params
      oleh: req.body.oleh || 'admin',
      tanggal: new Date()
    });

    res.json({ message: 'Data berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus data' });
  }
});

module.exports = router;