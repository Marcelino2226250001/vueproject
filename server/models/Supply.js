const mongoose = require('mongoose');

const supplySchema = new mongoose.Schema({
  supplier: String,
  kode_barang: String,
  nama_barang: String,
  harga: Number,
  satuan: String
});

module.exports = mongoose.model('Supply', supplySchema, 'supply');
