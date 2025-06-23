const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  tipe: { type: String, default: 'barang' }, 
  kode: String,
  nama_barang: String,
  aksi: String,
  oleh: String,
  tanggal: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('LogBarang', logSchema, 'log_aktivitas_barang');
