<template>
  <div>
    <v-row class="mb-4" align="center">
      <v-col>
        <h2>Laporan Stok Barang</h2>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="exportPDF">
          <v-icon left>mdi-file-pdf-box</v-icon>
          Ekspor ke PDF
        </v-btn>
      </v-col>
    </v-row>

    <table id="tabel-stok">
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
// Impor library PDF
import jsPDF from 'jspdf';
// [PERUBAHAN] Impor autoTable sebagai fungsi terpisah
import autoTable from 'jspdf-autotable';

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
    },
    formatRupiah(value) {
      if (typeof value !== 'number') return value;
      return value.toLocaleString('id-ID');
    },
    exportPDF() {
      try {
        const doc = new jsPDF();

        doc.text("Laporan Stok Barang", 14, 15);
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

        // [PERUBAHAN] Memanggil autoTable sebagai fungsi
        autoTable(doc, {
          html: '#tabel-stok',
          startY: 28,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save('laporan-stok-barang.pdf');
      } catch (error) {
        console.error("Gagal membuat PDF Laporan Stok:", error);
        alert("Terjadi kesalahan saat membuat file PDF. Silakan periksa konsol.");
      }
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
