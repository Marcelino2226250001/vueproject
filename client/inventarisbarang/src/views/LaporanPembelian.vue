<template>
  <div>
    <h2 class="text-xl font-bold mb-4">Laporan Pembelian</h2>

    <!-- Filter -->
    <v-card class="mb-6 pa-4" flat>
      <v-row dense>
        <v-col cols="12" md="3">
          <v-text-field v-model="dari" type="date" label="Dari" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="sampai" type="date" label="Sampai" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="supplier" label="Supplier" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="jenis" label="Jenis/Nama Barang" density="compact" hide-details />
        </v-col>
        <v-col cols="12" class="text-right">
          <v-btn color="primary" @click="fetchLaporan(true)" class="mr-2">Tampilkan</v-btn>
          <v-btn v-if="role !== 'gudang' && role !== 'penerimaan'" color="error" @click="confirmHapusSemua">
  Bersihkan Riwayat
</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Tabel -->
    <v-card flat>
      <v-data-table
        :headers="headers"
        :items="laporan"
        :items-per-page="5"
        class="elevation-1"
        item-value="_id"
        density="comfortable"
      >
        <template v-slot:item.tanggal="{ item }">
          {{ formatDate(item.tanggal) }}
        </template>

        <template v-slot:item.barang="{ item }">
          <ul class="pl-4">
            <li v-for="(i, idx) in item.items" :key="idx">
              {{ i.nama_barang }} ({{ i.jumlah }})
            </li>
          </ul>
        </template>

        <template v-slot:item.jumlah="{ item }">
          {{ totalJumlah(item.items || []) }}
        </template>

        <template v-slot:item.total="{ item }">
          Rp {{ (item.total || 0).toLocaleString('id-ID') }}
        </template>

        <template v-slot:no-data>
          <div class="text-center text-grey py-4">Tidak ada data pembelian</div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      role: '',
      dari: '',
      sampai: '',
      supplier: '',
      jenis: '',
      laporan: [],
      loggedInUser: null,
      headers: [
        { title: 'Tanggal', key: 'tanggal' },
        { title: 'Supplier', key: 'supplier' },
        { title: 'Barang', key: 'barang', sortable: false },
        { title: 'Jumlah', key: 'jumlah', sortable: false },
        { title: 'Total', key: 'total' }
      ]
    };
  },
  methods: {
    async fetchLaporan(useFilter = false) {
      try {
        const params = useFilter
          ? {
              dari: this.dari,
              sampai: this.sampai,
              supplier: this.supplier,
              jenis: this.jenis
            }
          : {};
        const res = await axios.get('/api/pembelian/laporan', { params });
        this.laporan = res.data;
      } catch (err) {
        console.error('Gagal mengambil laporan:', err);
        alert('Gagal mengambil laporan');
      }
    },
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID');
    },
    totalJumlah(items) {
      if (!Array.isArray(items)) return 0;
      return items.reduce((sum, item) => sum + item.jumlah, 0);
    },
    confirmHapusSemua() {
      if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pembelian? Tindakan ini tidak dapat dibatalkan.')) {
        this.hapusSemuaPembelian();
      }
    },
    async hapusSemuaPembelian() {
      try {
        // Simpan data laporan sebelum dihapus untuk logging
        const laporanSebelumHapus = [...this.laporan];

        // Hapus semua data pembelian
        await axios.delete('/api/pembelian/semua');

        // Catat aktivitas untuk setiap item yang dihapus
        for (const pembelian of laporanSebelumHapus) {
          if (pembelian.items && Array.isArray(pembelian.items)) {
            for (const item of pembelian.items) {
              await axios.post('/api/log/aktivitas', {
                tanggal: new Date(),
                tipe: 'pembelian',
                kode: item.kode || '',
                nama_barang: item.nama_barang,
                aksi: 'bersihkan riwayat',
                oleh: this.loggedInUser?.username || 'user'
              });
            }
          }
        }

        // Reset data laporan
        this.laporan = [];
        alert('Riwayat pembelian berhasil dihapus dan aktivitas telah dicatat.');

      } catch (err) {
        console.error('Gagal menghapus semua pembelian:', err);
        alert('Gagal menghapus riwayat pembelian.');
      }
    }
  },
  mounted() {
    this.fetchLaporan();
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    this.role = user?.role?.toLowerCase() || '';
    this.loggedInUser = user; // Simpan data user untuk logging
  }
};
</script>
