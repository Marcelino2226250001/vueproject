const mongoose = require('mongoose');

const penerimaanSchema = new mongoose.Schema({
  pembelian_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pembelian'
  },
  diterima_oleh: String,
  tanggal_diterima: Date,
  items: [
    {
      kode: String,
      nama_barang: String,
      jumlah: Number
    }
  ]
});

module.exports = mongoose.model('PenerimaanBarang', penerimaanSchema, 'penerimaan_barang');
