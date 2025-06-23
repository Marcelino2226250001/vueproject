const mongoose = require('mongoose');

const penjualanSchema = new mongoose.Schema({
  tanggal: {
    type: Date,
    default: Date.now
  },
  pelanggan: {
    nama: String,
    status: String
  },
  pelanggan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pelanggan',
    default: null
  },
  items: [
    {
      kode: String,
      nama_barang: String,
      jumlah: Number,
      harga_jual: Number,
      subtotal: Number
    }
  ],
  total: Number,
  status_pengiriman: {
    type: String,
    enum: ['Belum Diproses', 'Siap Kirim', 'Dalam Perjalanan', 'Terkirim'],
    default: 'Belum Diproses'
  }
});

module.exports = mongoose.model('Penjualan', penjualanSchema, 'penjualan');
