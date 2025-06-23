const mongoose = require('mongoose');

const pembelianSchema = new mongoose.Schema({
  tanggal: Date,
  supplier: String,
  items: [
    {
      kode: String,
      nama_barang: String,
      jumlah: Number,
      harga_beli: Number,
      subtotal: Number,
      status: {
        type: String,
        enum: ["Belum Diterima", "Diterima"],
        default: "Belum Diterima"
      }
    }
  ],
  total: Number
});

module.exports = mongoose.model('Pembelian', pembelianSchema, 'pembelian');
