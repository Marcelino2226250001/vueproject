<template>
  <div>
    <h2>Penerimaan Barang</h2>

    <!-- Pilih Pembelian -->
    <v-card flat outlined>
      <v-card-title>Pilih Transaksi Pembelian</v-card-title>
      <v-card-text>
        <v-select
          v-model="pembelianDipilih"
          :items="pembelianList"
          item-title="supplier"
          item-value="_id"
          label="Pilih Pembelian"
          @update:modelValue="loadDetailPembelian"
        ></v-select>
      </v-card-text>
    </v-card>

    <!-- Form Detail Pembelian -->
    <v-card flat outlined v-if="pembelianDetail">
      <v-card-title>Barang yang Dipesan</v-card-title>
      <v-card-text>
        <v-table dense>
          <thead>
            <tr>
              <th>Kode Barang</th>
              <th>Nama Barang</th>
              <th>Jumlah Dipesan</th>
              <th>Jumlah Diterima</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in pembelianDetail.items" :key="i">
              <td>{{ item.kode }}</td>
              <td>{{ item.nama_barang }}</td>
              <td>{{ item.jumlah }}</td>
              <td>{{ item.jumlah }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn color="success" @click="simpanPenerimaan">Tambah Stok</v-btn>
          <v-btn color="error" @click="batalkanTransaksi">Batalkan Transaksi</v-btn>
        </div>
      </v-card-text>
    </v-card>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      pembelianList: [],
      pembelianDipilih: '',
      pembelianDetail: null,
      loggedInUser: JSON.parse(localStorage.getItem('user')) || null
    };
  },
  methods: {
    async fetchPembelian() {
      try {
        // Selalu fetch data terbaru dari server
        const res = await axios.get('/api/pembelian/belum-diterima');
        this.pembelianList = res.data;

        console.log('Data pembelian ter-update:', this.pembelianList.length, 'items');

        // Reset pilihan jika data yang dipilih sudah tidak ada
        if (this.pembelianDipilih && !this.pembelianList.find(p => p._id === this.pembelianDipilih)) {
          this.pembelianDipilih = '';
          this.pembelianDetail = null;
          console.log('Reset pilihan karena data tidak ditemukan');
        }
      } catch (error) {
        console.error('Error fetch pembelian:', error);
        alert('Gagal mengambil data pembelian');
      }
    },

    async loadDetailPembelian() {
      const pembelian = this.pembelianList.find(p => p._id === this.pembelianDipilih);
      if (pembelian) {
        this.pembelianDetail = {
          ...pembelian,
          items: pembelian.items.map(item => ({ ...item }))
        };
      }
    },

    async refreshDropdown() {
      this.pembelianDipilih = '';
      this.pembelianDetail = null;
      await this.fetchPembelian();
    },

    async simpanPenerimaan() {
      if (!this.pembelianDetail) {
        alert('Tidak ada data pembelian yang dipilih.');
        return;
      }

      const konfirmasi = confirm('Apakah Anda yakin ingin menambah stok dari penerimaan ini?');
      if (!konfirmasi) return;

      try {
        const payload = {
          pembelian_id: this.pembelianDetail._id,
          diterima_oleh: this.loggedInUser?.username || 'gudang',
          items: this.pembelianDetail.items.map(item => ({
            kode: item.kode,
            nama_barang: item.nama_barang,
            jumlah: item.jumlah
          }))
        };

        await axios.post('/api/penerimaan', payload);

        // Log aktivitas untuk setiap item
        for (const item of this.pembelianDetail.items) {
          await axios.post('/api/log/aktivitas', {
            tanggal: new Date(),
            tipe: 'penerimaan',
            kode: item.kode,
            nama_barang: item.nama_barang,
            aksi: 'terima barang',
            oleh: this.loggedInUser?.username || 'gudang'
          });
        }

        alert('Penerimaan berhasil disimpan dan stok diperbarui');
        await this.refreshDropdown();

      } catch (error) {
        console.error('Error saat menyimpan penerimaan:', error);
        alert(`Terjadi kesalahan saat menyimpan penerimaan: ${error.message}`);
      }
    },

    async batalkanTransaksi() {
      if (!this.pembelianDetail) {
        alert('Tidak ada transaksi yang dipilih untuk dibatalkan.');
        return;
      }

      const konfirmasi = confirm('Apakah Anda yakin ingin membatalkan transaksi ini? Transaksi pembelian akan dihapus dari sistem.');
      if (!konfirmasi) return;

      const pembelianId = this.pembelianDetail._id;
      const itemsToLog = [...this.pembelianDetail.items]; // Copy items sebelum reset

      try {
        console.log('Menghapus pembelian ID:', pembelianId);

        // Reset state terlebih dahulu untuk responsivitas UI
        this.pembelianDipilih = '';
        this.pembelianDetail = null;

        // Catat log pembatalan (jangan throw error jika gagal)
        for (const item of itemsToLog) {
          try {
            await axios.post('/api/log/aktivitas', {
              tanggal: new Date(),
              tipe: 'pembatalan',
              kode: item.kode,
              nama_barang: item.nama_barang,
              aksi: 'batal penerimaan',
              oleh: this.loggedInUser?.username || 'gudang'
            });
            console.log('Log pembatalan berhasil dicatat untuk:', item.nama_barang);
          } catch (logError) {
            console.warn('Warning - Error saat mencatat log untuk', item.nama_barang, ':', logError);
            // Lanjutkan proses meskipun log gagal
          }
        }

        // Hapus transaksi pembelian
        await axios.delete(`/api/pembelian/${pembelianId}`);
        console.log('Berhasil hapus pembelian:', pembelianId);

        // Refresh data dari server
        await this.fetchPembelian();

        alert('Transaksi pembelian berhasil dibatalkan dan dihapus dari sistem.');

      } catch (error) {
        console.error('Error saat membatalkan transaksi:', error);

        // Tetap lakukan refresh meskipun ada error
        try {
          await this.fetchPembelian();
          alert('Transaksi berhasil dibatalkan meskipun ada error dalam proses logging.');
        } catch (refreshError) {
          console.error('Error saat refresh:', refreshError);
          alert('Transaksi mungkin sudah dibatalkan. Silakan refresh halaman secara manual.');
          // Force reload halaman jika refresh gagal
          window.location.reload();
        }
      }
    }
  },

  mounted() {
    this.fetchPembelian();
  }
};
</script>
