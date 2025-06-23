export default {
  admin: '*', // akses semua route
  sales: ['/penjualan', '/penjualan/riwayat','/dashboard'],
  gudang: ['/barang', '/supply', '/laporan/pembelian','/dashboard'],
  keuangan: ['/laporan/pembelian', '/laporan', '/penjualan/riwayat'],
  penerimaan: ['/pembelian', '/penerimaan', '/laporan/pembelian','/dashboard'],
  order: ['/penjualan/riwayat'],
  'antar barang': ['/antar-barang']
};
