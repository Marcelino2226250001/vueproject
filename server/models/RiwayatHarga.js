// file: models/PriceHistory.js

const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product' // Mereferensikan ke model Product
  },
  kode_barang: {
    type: String,
    required: true,
  },
  harga_beli_lama: {
    type: Number,
    required: true
  },
  harga_beli_baru: {
    type: Number,
    required: true
  },
  harga_jual_lama: {
    type: Number,
    required: true
  },
  harga_jual_baru: {
    type: Number,
    required: true
  },
  oleh: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Otomatis menambahkan createdAt dan updatedAt
});

module.exports = mongoose.model('PriceHistory', priceHistorySchema);