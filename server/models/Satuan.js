// file: models/Satuan.js

const mongoose = require('mongoose');

const satuanSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    unique: true, // Pastikan setiap nama satuan unik
    trim: true
  }
}, {
  timestamps: true // Otomatis menambahkan createdAt dan updatedAt
});

module.exports = mongoose.model('Satuan', satuanSchema, 'satuan');