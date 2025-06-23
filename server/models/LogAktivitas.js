const mongoose = require('mongoose');

const logAktivitasSchema = new mongoose.Schema({
  tanggal: { type: Date, default: Date.now },
  target: String,         // 'barang', 'pelanggan', 'penjualan', dst
  tipe: String,           // 'tambah', 'ubah', 'hapus', dst
  nama_item: String,      // nama pelanggan/barang
  keterangan: String,     // penjelasan
  pengguna: String        // username yang melakukan
});

module.exports = mongoose.model('LogAktivitas', logAktivitasSchema, 'log_aktivitas');
