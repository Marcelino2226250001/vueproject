const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  kode: String,
  nama: String,
  kategori: String,
  jumlah: Number,
  satuan: String,
  harga_beli: Number,
  harga_jual: Number,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

