<template>
  <div>
    <h2>Laporan Stok Barang</h2>

    <table>
      <thead>
        <tr>
          <th>Kode</th>
          <th>Nama</th>
          <th>Jumlah</th>
          <th>Harga Beli</th>
          <th>Total Nilai</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="barangList.length === 0">
          <td colspan="5">Tidak ada data</td>
        </tr>
        <tr v-for="barang in barangList" :key="barang._id">
          <td>{{ barang.kode }}</td>
          <td>{{ barang.nama }}</td>
          <td>{{ barang.jumlah }}</td>
          <td>Rp {{ formatRupiah(barang.harga_beli) }}</td>
          <td>Rp {{ formatRupiah(barang.jumlah * barang.harga_beli) }}</td>
        </tr>
      </tbody>
      <tfoot v-if="barangList.length > 0">
        <tr>
          <th colspan="4" style="text-align: right;">Total Nilai Stok:</th>
          <th>Rp {{ formatRupiah(totalNilai) }}</th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      barangList: []
    };
  },
  computed: {
    totalNilai() {
      return this.barangList.reduce((total, barang) => {
        return total + (barang.jumlah * barang.harga_beli);
      }, 0);
    }
  },
  methods: {
   async fetchBarang() {
  try {
    const res = await axios.get('/api/products');

    this.barangList = res.data.filter(barang =>
      barang.nama && barang.nama.trim() !== '' &&
      barang.kode && barang.kode.trim() !== '' &&
      barang.kategori && barang.kategori.trim() !== '' &&
      barang.jumlah > 0 &&
      barang.harga_beli > 0
    );
  } catch (err) {
    console.error('Gagal mengambil data:', err);
  }
}
,
    formatRupiah(value) {
      if (typeof value !== 'number') return value;
      return value.toLocaleString('id-ID');
    }
  },
 mounted() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    this.$router.push('/login');
    return;
  }

  this.fetchBarang();
}

};
</script>


<style scoped>
h2 {
  margin-bottom: 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  border: 1px solid #333;
  padding: 8px;
  text-align: left;
}
tfoot {
  font-weight: bold;
  background-color: #f4f4f4;
}
</style>
