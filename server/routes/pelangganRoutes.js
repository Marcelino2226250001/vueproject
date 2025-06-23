const express = require('express');
const router = express.Router();
const Pelanggan = require('../models/Pelanggan');
const LogBarang = require('../models/LogBarang');


// GET semua pelanggan
router.get('/', async (req, res) => {
  const data = await Pelanggan.find();
  res.json(data);
});

// POST tambah pelanggan
router.post('/', async (req, res) => {
  const pelanggan = new Pelanggan(req.body);
  await pelanggan.save();

  await LogBarang.create({
    tipe: 'pelanggan',
    kode: pelanggan.kode || '-', // jika tidak ada kode, beri default '-'
    nama_barang: pelanggan.nama,
    aksi: 'tambah pelanggan',
    oleh: req.body.oleh || 'Tidak Diketahui',
    tanggal: new Date()
  });

  res.json({ message: 'Pelanggan ditambahkan' });
});


// PUT edit pelanggan
router.put('/:id', async (req, res) => {
  const pelanggan = await Pelanggan.findByIdAndUpdate(req.params.id, req.body, { new: true });

  await LogBarang.create({
    tipe: 'pelanggan',
    kode: pelanggan.kode || '-',
    nama_barang: pelanggan.nama,
    aksi: 'ubah pelanggan',
    oleh: req.body.oleh || 'Tidak Diketahui',
    tanggal: new Date()
  });

  res.json({ message: 'Pelanggan diperbarui' });
});


// DELETE pelanggan
router.delete('/:id', async (req, res) => {
  const pelanggan = await Pelanggan.findById(req.params.id);
  await Pelanggan.findByIdAndDelete(req.params.id);

  if (pelanggan) {
    await LogBarang.create({
      tipe: 'pelanggan',
      kode: pelanggan.kode || '-',
      nama_barang: pelanggan.nama,
      aksi: 'hapus pelanggan',
      oleh: req.body.oleh || 'Tidak Diketahui',
      tanggal: new Date()
    });
  }

  res.json({ message: 'Pelanggan dihapus' });
});


module.exports = router;
