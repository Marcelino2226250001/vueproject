const mongoose = require('mongoose');

const pelangganSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  alamat: String,
  no_telp: String,
  email: String,
  jenis: { type: String, enum: ['Tetap', 'Umum'], default: 'Tetap' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pelanggan', pelangganSchema, 'pelanggan');
